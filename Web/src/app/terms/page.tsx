"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";

export default function TermsPage() {
  return (
    <StaticPageLayout 
      title="Términos del Servicio" 
      subtitle="Al usar nuestra plataforma, aceptas estos términos. Por favor, léelos cuidadosamente."
      breadcrumb="Terms of Service"
    >
      <p className="lead">
        Vigente a partir del: 30 de Marzo, 2026.
      </p>

      <h2>1. Aceptación de los Términos</h2>
      <p>
        Al acceder o utilizar REZERVAME, aceptas cumplir con estos términos y todas las leyes y 
        regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, tienes prohibido 
        utilizar o acceder a este sitio.
      </p>

      <h2>2. Uso de la Plataforma</h2>
      <p>
        Nuestra plataforma permite a los usuarios reservar citas con profesionales de la belleza. 
        Eres responsable de mantener la confidencialidad de tu cuenta y de todas las actividades que 
        ocurran bajo tu nombre de usuario.
      </p>

      <h2>3. Política de Cancelación</h2>
      <p>
        Las cancelaciones están sujetas a las políticas individuales de cada negocio. REZERVAME no se 
        hace responsable de los cargos por cancelación impuestos por los prestadores de servicios.
      </p>

      <h2>4. Limitación de Responsabilidad</h2>
      <p>
        REZERVAME no garantiza la calidad de los servicios prestados por los negocios registrados. 
        Actuamos únicamente como un intermediario tecnológico para facilitar el proceso de reserva.
      </p>
    </StaticPageLayout>
  );
}
