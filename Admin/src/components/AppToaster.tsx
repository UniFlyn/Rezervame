"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand={false}
      gap={10}
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  );
}
