"use client";

import { AppLoader } from "@/components/admin/AppLoader";

export function TableLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <tr>
      <td colSpan={99} className="py-16">
        <AppLoader label={label} variant="section" />
      </td>
    </tr>
  );
}
