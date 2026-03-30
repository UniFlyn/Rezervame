"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";

export default function AboutPage() {
  return (
    <StaticPageLayout 
      title="Sobre Nosotros" 
      subtitle="Revolucionando la forma en que reservas tus servicios de belleza y bienestar en Panamá."
      breadcrumb="About Us"
    >
      <h2>Nuestra Misión</h2>
      <p>
        En REZERVAME, nuestra misión es conectar a las personas con los mejores profesionales de la belleza y el bienestar, 
        haciendo que el proceso de reserva sea tan sencillo como un solo clic. Creemos en el poder de la tecnología para 
        empoderar tanto a clientes como a negocios locales.
      </p>

      <h2>Nuestra Visión</h2>
      <p>
        Ser la plataforma líder en Latinoamérica para la gestión de citas y servicios, reconocida por su innovación, 
        fiabilidad y el valor que aporta a la comunidad de emprendedores de la belleza.
      </p>

      <h2>Nuestros Valores</h2>
      <ul>
        <li><strong>Innovación:</strong> Buscamos constantemente nuevas formas de mejorar la experiencia del usuario.</li>
        <li><strong>Confianza:</strong> La seguridad de tus datos y la calidad de los servicios son nuestra prioridad.</li>
        <li><strong>Comunidad:</strong> Apoyamos el crecimiento de los negocios locales.</li>
      </ul>
    </StaticPageLayout>
  );
}
