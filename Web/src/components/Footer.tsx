"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { isBookingConfirmationPath } from "@/lib/bookingConfirmation";
import { Footer as DSFooter } from "@/ds";

const FOOTER_CONTENT_MAX = "min(94vw, 1600px)";

/**
 * Customer footer — full-bleed coral, rendered with the Rezervame Design System
 * `Footer`. Columns follow the design-system customer-web kit exactly. Hidden on
 * the business panel and the booking-confirmation screen (previous behaviour).
 */
const FOOTER_COLUMNS = [
  {
    title: "Para Clientes",
    links: ["Descargar app", "Cómo funciona", "Atención al cliente", "Reseñas de Rezervame"],
  },
  {
    title: "Para Negocios",
    links: ["Únete a Rezervame", "Acceso para Negocios", "Precios", "Soporte para Negocios"],
  },
  {
    title: "Rezervame",
    links: ["Sobre nosotros", "Empleos", "Política de privacidad", "Términos del servicio"],
  },
];

export const Footer = () => {
  const pathname = usePathname();

  if (pathname.startsWith("/business") || isBookingConfirmationPath(pathname)) return null;

  return (
    <DSFooter
      logoSrc="/ds/logos/rezervame-white.png"
      columns={FOOTER_COLUMNS}
      socials={["instagram", "facebook", "linkedin", "x"]}
      contentMax={FOOTER_CONTENT_MAX}
    />
  );
};
