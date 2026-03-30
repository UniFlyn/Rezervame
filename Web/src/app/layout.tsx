import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { I18nProvider } from "../components/I18nProvider";
import { AuthProvider } from "../components/AuthProvider";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LoginModal } from "../components/LoginModal";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <AuthProvider>
          <I18nProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <LoginModal />
            </div>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
