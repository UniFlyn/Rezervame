"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type PageHeaderMeta = {
  title?: string;
  subtitle?: string;
};

type Ctx = {
  meta: PageHeaderMeta;
  setMeta: (m: PageHeaderMeta) => void;
  clearMeta: () => void;
};

const PageHeaderMetaContext = createContext<Ctx | null>(null);

export function PageHeaderMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMetaState] = useState<PageHeaderMeta>({});

  const value = useMemo(
    () => ({
      meta,
      setMeta: (m: PageHeaderMeta) => setMetaState(m),
      clearMeta: () => setMetaState({}),
    }),
    [meta],
  );

  return <PageHeaderMetaContext.Provider value={value}>{children}</PageHeaderMetaContext.Provider>;
}

export function usePageHeaderMeta() {
  const ctx = useContext(PageHeaderMetaContext);
  if (!ctx) throw new Error("usePageHeaderMeta must be used within PageHeaderMetaProvider");
  return ctx;
}
