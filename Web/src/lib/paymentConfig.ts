export type CheckoutPaymentId = "wompi" | "yappy" | "pay_at_venue";

export type NormalizedPaymentMethod = {
  id: CheckoutPaymentId;
  label: string;
  enabled: boolean;
  configured: boolean;
};

export type NormalizedPaymentConfig = {
  defaultCommission: number;
  methods: NormalizedPaymentMethod[];
};

function mapMethodId(id: string): CheckoutPaymentId {
  if (id === "wompi" || id === "card") return "wompi";
  if (id === "yappy") return "yappy";
  return "pay_at_venue";
}

function inferConfigured(
  rawId: string,
  cfg: Record<string, unknown>,
): boolean {
  if (rawId === "cash" || rawId === "pay_at_venue") return true;
  if (rawId === "wompi" || rawId === "card") {
    return Boolean(cfg.wompiConfigured ?? cfg.stripeEnabled);
  }
  if (rawId === "yappy") {
    return Boolean(cfg.yappyConfigured);
  }
  return false;
}

/** Normalize legacy (`card`/`cash`) and new (`wompi`/`pay_at_venue`) payment-config API shapes. */
export function normalizePublicPaymentConfig(
  cfg: Record<string, unknown> | null | undefined,
): NormalizedPaymentConfig {
  const defaultCommission =
    typeof cfg?.defaultCommission === "number" ? cfg.defaultCommission : 15;

  const rawMethods = Array.isArray(cfg?.methods) ? cfg.methods : [];
  const methods: NormalizedPaymentMethod[] = rawMethods.map((m) => {
    const row = m as Record<string, unknown>;
    const rawId = String(row.id ?? "");
    const id = mapMethodId(rawId);
    const enabled = row.enabled !== false;
    const configured =
      typeof row.configured === "boolean"
        ? row.configured
        : inferConfigured(rawId, cfg ?? {});

    let label = String(row.label ?? "").trim();
    if (!label) {
      if (id === "wompi") label = "Card";
      else if (id === "yappy") label = "Yappy";
      else label = "Pay by visit";
    }

    return { id, label, enabled, configured };
  });

  if (methods.length === 0) {
    const payAtVenue = cfg?.cashPayEnabled !== false && cfg?.payAtVenueEnabled !== false;
    return {
      defaultCommission,
      methods: [
        { id: "wompi", label: "Card", enabled: false, configured: false },
        { id: "yappy", label: "Yappy", enabled: false, configured: false },
        {
          id: "pay_at_venue",
          label: "Pay by visit",
          enabled: payAtVenue,
          configured: true,
        },
      ],
    };
  }

  return { defaultCommission, methods };
}

export function isPaymentMethodSelectable(m: NormalizedPaymentMethod): boolean {
  return m.enabled && m.configured;
}

export function pickDefaultPaymentMethod(
  methods: NormalizedPaymentMethod[],
): CheckoutPaymentId {
  const selectable = methods.filter(isPaymentMethodSelectable);
  const payAtVenue = selectable.find((m) => m.id === "pay_at_venue");
  if (payAtVenue) return "pay_at_venue";
  if (selectable.length > 0) return selectable[0].id;
  return "pay_at_venue";
}

export function selectablePaymentMethods(
  methods: NormalizedPaymentMethod[],
): NormalizedPaymentMethod[] {
  return methods.filter(isPaymentMethodSelectable);
}

/**
 * Customer-facing payment methods per the Rezervame spec (§9): card + Yappy only,
 * never "pay at venue". Backend endpoints still accept pay_at_venue — this only
 * shapes what the customer web offers.
 */
export function customerFacingPaymentMethods(
  methods: NormalizedPaymentMethod[],
): NormalizedPaymentMethod[] {
  return methods.filter((m) => m.id !== "pay_at_venue");
}

/** Default customer payment tab: prefer card, then Yappy. Never pay-at-venue. */
export function pickCustomerDefaultPaymentMethod(
  methods: NormalizedPaymentMethod[],
): Exclude<CheckoutPaymentId, "pay_at_venue"> {
  const online = customerFacingPaymentMethods(methods);
  const card = online.find((m) => m.id === "wompi");
  if (card) return "wompi";
  const yappy = online.find((m) => m.id === "yappy");
  if (yappy) return "yappy";
  return "wompi";
}
