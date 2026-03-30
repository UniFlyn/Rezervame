"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";

export default function PrivacyPage() {
  return (
    <StaticPageLayout 
      title="Política de Privacidad" 
      subtitle="Tu privacidad es nuestra prioridad. Conoce cómo protegemos tus datos en REZERVAME."
      breadcrumb="Privacy Policy"
    >
      <p className="lead">
        Última actualización: 30 de Marzo, 2026.
      </p>

      <h2>1. Información que Recopilamos</h2>
      <p>
        Recopilamos información que nos proporcionas directamente al crear una cuenta, como tu nombre, 
        dirección de correo electrónico, número de teléfono y preferencias de servicio.
      </p>

      <h2>2. Cómo Utilizamos tu Información</h2>
      <p>
        Utilizamos la información para procesar tus reservas, comunicarnos contigo sobre servicios y 
        mejorar nuestra plataforma. No vendemos tu información personal a terceros.
      </p>

      <h2>3. Seguridad de los Datos</h2>
      <p>
        Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra 
        el acceso no autorizado, la pérdida o la alteración.
      </p>

      <h2>4. Tus Derechos</h2>
      <p>
        Tienes derecho a acceder, rectificar o eliminar tus datos personales en cualquier momento a 
        través de la configuración de tu perfil o contactando a nuestro equipo de soporte.
      </p>
    </StaticPageLayout>
  );
}
