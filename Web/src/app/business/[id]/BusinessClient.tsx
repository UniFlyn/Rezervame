"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { toastError, toastWarning } from "@/lib/toast";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { StatePanel, statePanelVariantForMessage } from "@/components/ui/StatePanel";
import { userFacingError } from "@/lib/userFacingError";

type ServiceRow = { id: string; name: string; duration: number; price: number; category: string };

export default function BusinessClient({ params }: { params: { id: string } }) {
  const [id, setId] = useState(params.id);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split('/');
      if (parts.length >= 3 && parts[1] === 'business' && parts[2] !== 'default') {
        setId(parts[2]);
      }
    }
  }, []);
  const [name, setName] = useState("—");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [banner, setBanner] = useState<string>(PLACEHOLDER_IMAGE_DATA_URI);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoadError(null);
      try {
        if (id === 'default') return;
        const business = await apiGet<Record<string, unknown> | null>(`/business/${id}`);
        if (!business) {
          const msg = "Negocio no encontrado o no disponible.";
          setLoadError(msg);
          toastWarning("Not found", msg);
          return;
        }
        const svc = await apiGet<ServiceRow[]>(`/business/${id}/services`).catch(() => []);
        setName(String(business.name ?? "—"));
        setAddress(String((business as { location?: string }).location ?? ""));
        setDescription(String((business as { description?: string }).description ?? ""));
        const b = (business as { banner?: string; logo?: string }).banner?.toString().trim();
        const l = (business as { banner?: string; logo?: string }).logo?.toString().trim();
        const hero = b || l || "";
        setBanner(
          hero && (hero.startsWith("http") || hero.startsWith("/") || hero.startsWith("data:"))
            ? hero
            : PLACEHOLDER_IMAGE_DATA_URI,
        );
        setServices(Array.isArray(svc) ? svc : []);
      } catch (e: unknown) {
        const msg = userFacingError(e, "Unable to load this business right now.");
        setLoadError(msg);
        toastError("Load failed", msg);
      }
    };
    void run();
  }, [id]);

  return (
    <div className="max-w-5xl mx-auto bg-white min-h-screen border-x border-slate-200">
      <div className="h-72 bg-slate-200 relative">
        <img src={banner} alt="" className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
          <h1 className="text-4xl font-bold">{name}</h1>
          <p className="mt-2 text-lg text-slate-200">{address || "—"}</p>
        </div>
      </div>

      {loadError ? (
        <div className="p-6 sm:p-8">
          <StatePanel
            variant={statePanelVariantForMessage(loadError)}
            title="Couldn't load business"
            description={loadError}
            actions={[
              {
                label: "Try again",
                onClick: () => window.location.reload(),
                primary: true,
              },
            ]}
          />
        </div>
      ) : null}

      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">About us</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{description || "—"}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Services</h2>
            {services.length === 0 ? (
              <p className="text-slate-500 text-sm">No services listed yet.</p>
            ) : (
              <div className="space-y-4">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-primary transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-lg">{svc.name}</h4>
                      <p className="text-sm text-slate-500">
                        {svc.duration} min · {svc.category}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold text-lg">${Number(svc.price).toFixed(2)}</span>
                      <span className="px-4 py-2 bg-slate-100 text-primary font-semibold rounded text-sm">Select</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="border border-slate-200 rounded-xl p-6 h-fit sticky top-6 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Ready to book?</h3>
          <p className="text-sm text-slate-600 mb-6">
            Browse this business on the public venue page to complete a reservation.
          </p>
          <Link
            href={`/venue/${id}`}
            className="block w-full text-center py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors shadow"
          >
            View venue & book
          </Link>
        </div>
      </div>
    </div>
  );
}
