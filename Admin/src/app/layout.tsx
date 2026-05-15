import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppToaster } from "../components/AppToaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rezervame Admin",
  description: "Admin panel for Rezervame",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
