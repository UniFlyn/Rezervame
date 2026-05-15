import { toast } from "sonner";

const defaults = { duration: 5000 as const };

export function toastError(title: string, description?: string) {
  return toast.error(title, { ...defaults, description });
}

export function toastSuccess(title: string, description?: string) {
  return toast.success(title, { ...defaults, description });
}

export function toastWarning(title: string, description?: string) {
  return toast.warning(title, { ...defaults, description });
}

export function toastInfo(title: string, description?: string) {
  return toast.message(title, { ...defaults, description });
}
