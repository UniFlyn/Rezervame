"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type PageHeaderMeta = {
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
};

type Ctx = {
  meta: PageHeaderMeta;
  setMeta: (m: PageHeaderMeta) => void;
  clearMeta: () => void;
};

const PageHeaderMetaContext = createContext<Ctx | null>(null);

export function PageHeaderMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMetaState] = useState<PageHeaderMeta>({});
  const setMeta = useCallback((m: PageHeaderMeta) => {
    setMetaState((prev) =>
      prev.title === m.title && prev.subtitle === m.subtitle && prev.hideHeader === m.hideHeader ? prev : m,
    );
  }, []);
  const clearMeta = useCallback(() => {
    setMetaState((prev) =>
      prev.title === undefined && prev.subtitle === undefined && prev.hideHeader === undefined ? prev : {},
    );
  }, []);

  const value = useMemo(
    () => ({
      meta,
      setMeta,
      clearMeta,
    }),
    [meta, setMeta, clearMeta],
  );

  return <PageHeaderMetaContext.Provider value={value}>{children}</PageHeaderMetaContext.Provider>;
}

export function usePageHeaderMeta() {
  const ctx = useContext(PageHeaderMetaContext);
  if (!ctx) throw new Error("usePageHeaderMeta must be used within PageHeaderMetaProvider");
  return ctx;
}
