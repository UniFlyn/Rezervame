import React from "react";
import { Sidebar, Topbar } from "@/components/admin/Layout";
import AuthGuard from "@/components/admin/AuthGuard";
import { WebPushManager } from "@/components/admin/WebPushManager";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <WebPushManager />
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="p-8 pb-12 ml-0 sm:ml-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
