export type CancellationPolicyConfig = {
  allowed: boolean;
  hoursBefore: number;
};

export function normalizeCancellationPolicy(
  business?: {
    cancellationAllowed?: boolean | null;
    cancellationHoursBefore?: number | null;
  } | null,
): CancellationPolicyConfig {
  const allowed = business?.cancellationAllowed !== false;
  const raw = business?.cancellationHoursBefore;
  const hoursBefore =
    typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 1;
  return { allowed, hoursBefore };
}

export function formatCancellationPolicyMessage(
  policy: CancellationPolicyConfig,
  lang: "en" | "es" = "en",
): string {
  if (!policy.allowed) {
    return lang === "es"
      ? "Este negocio no permite cancelaciones."
      : "This business does not allow cancellations.";
  }
  if (policy.hoursBefore <= 0) {
    return lang === "es"
      ? "Puedes cancelar o reagendar tu reserva sin costo hasta 60 minutos antes de la hora programada."
      : "You may cancel or reschedule at no cost up to 60 minutes before your appointment.";
  }
  const minutes = policy.hoursBefore * 60;
  if (minutes <= 60) {
    return lang === "es"
      ? "Puedes cancelar o reagendar tu reserva sin costo hasta 60 minutos antes de la hora programada."
      : "You may cancel or reschedule at no cost up to 60 minutes before your appointment.";
  }
  return lang === "es"
    ? `Las cancelaciones deben hacerse ${policy.hoursBefore}h antes de tu cita.`
    : `Cancellations must be done ${policy.hoursBefore}h before your appointment.`;
}

export function canCustomerCancelBooking(input: {
  status: string;
  appointmentAt: string | Date;
  transactionId?: string | null;
  business?: {
    cancellationAllowed?: boolean | null;
    cancellationHoursBefore?: number | null;
  } | null;
  now?: Date;
}): { allowed: boolean; message: string } {
  const status = String(input.status || "");
  const now = input.now ?? new Date();
  if (status === "Completed" || status === "Cancelled" || status === "Rejected") {
    return { allowed: false, message: "This booking can no longer be cancelled." };
  }
  const isPendingUnpaid = status === "Pending" && !input.transactionId;
  if (isPendingUnpaid) {
    return {
      allowed: true,
      message: "You may cancel before the venue accepts your booking.",
    };
  }
  const policy = normalizeCancellationPolicy(input.business);
  if (!policy.allowed) {
    return { allowed: false, message: "This business does not allow cancellations." };
  }
  const appointmentAt =
    typeof input.appointmentAt === "string"
      ? new Date(input.appointmentAt)
      : input.appointmentAt;
  if (!Number.isNaN(appointmentAt.getTime()) && policy.hoursBefore > 0) {
    const deadline = new Date(
      appointmentAt.getTime() - policy.hoursBefore * 60 * 60 * 1000,
    );
    if (now.getTime() > deadline.getTime()) {
      return {
        allowed: false,
        message: `Cancellations must be made at least ${policy.hoursBefore} hours before the appointment.`,
      };
    }
  }
  return { allowed: true, message: "Cancellation is allowed." };
}

export function policyMessageForBooking(
  input: {
    status: string;
    appointmentAt: string | Date;
    transactionId?: string | null;
    business?: {
      cancellationAllowed?: boolean | null;
      cancellationHoursBefore?: number | null;
    } | null;
  },
  lang: "en" | "es",
): string {
  const status = String(input.status || "").toLowerCase();
  if (status === "pending" && !input.transactionId) {
    return lang === "es"
      ? "Puedes cancelar o reagendar tu reserva sin costo hasta 60 minutos antes de la hora programada."
      : "You may cancel or reschedule at no cost up to 60 minutes before your appointment.";
  }
  return formatCancellationPolicyMessage(normalizeCancellationPolicy(input.business), lang);
}
