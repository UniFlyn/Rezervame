"use client";
import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [confirming, setConfirming] = React.useState(false);
  React.useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);
  if (!open) return null;

  const iconBg =
    variant === "danger"
      ? "bg-red-50 text-red-500"
      : variant === "warning"
      ? "bg-amber-50 text-amber-500"
      : "bg-blue-50 text-blue-500";

  const confirmBg =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 shadow-red-200"
      : variant === "warning"
      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
      : "bg-[#ff5a5f] hover:bg-[#e0484d] shadow-[#ff5a5f]/20";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
        {/* Top accent bar */}
        <div
          className={`h-1 w-full ${
            variant === "danger"
              ? "bg-gradient-to-r from-red-400 to-red-600"
              : variant === "warning"
              ? "bg-gradient-to-r from-amber-400 to-amber-600"
              : "bg-gradient-to-r from-[#ff5a5f] to-[#ff8a5f]"
          }`}
        />

        <div className="p-8">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-6`}>
            {variant === "danger" ? (
              <Trash2 size={26} strokeWidth={2} />
            ) : (
              <AlertTriangle size={26} strokeWidth={2} />
            )}
          </div>

          {/* Content */}
          <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{title}</h3>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={confirming}
              className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:border-slate-200 transition-all disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              onClick={async () => {
                setConfirming(true);
                try {
                  await onConfirm();
                } finally {
                  setConfirming(false);
                }
              }}
              disabled={confirming}
              className={`flex-1 py-3.5 px-6 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 ${confirmBg}`}
            >
              {confirming ? "Working..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
