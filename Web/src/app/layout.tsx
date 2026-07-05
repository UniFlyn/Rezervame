import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { I18nProvider } from "../components/I18nProvider";
import { AuthProvider } from "../components/AuthProvider";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LoginModal } from "../components/LoginModal";
import { FavoritePrompt } from "../components/FavoritePrompt";
import { AppToaster } from "../components/AppToaster";
import { WebPushManager } from "../components/WebPushManager";
import { MaintenanceGate } from "../components/MaintenanceGate";
import { PageHeaderMetaProvider } from "../contexts/PageHeaderMetaContext";

export const metadata: Metadata = {
  title: "Rezervame - Reserva citas de belleza al instante",
  description: "Descubre y reserva con los mejores salones de belleza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <AuthProvider>
          <I18nProvider>
            <PageHeaderMetaProvider>
            <MaintenanceGate>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="min-h-0 w-full flex-1">
                  {children}
                </main>
                <Footer />
                <LoginModal />
                <FavoritePrompt />
                <AppToaster />
                <WebPushManager />
              </div>
            </MaintenanceGate>
            </PageHeaderMetaProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
