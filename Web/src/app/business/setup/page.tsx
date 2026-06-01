'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBusinessStore } from '@/store/businessStore';
import { compressImageFile } from '@/lib/compressImage';
import { PLACEHOLDER_IMAGE_DATA_URI } from '@/lib/placeholderImage';
import { toastError, toastSuccess } from '@/lib/toast';
import { resolveSetupStatus, setupFieldLabel, type BusinessSetupField } from '@/lib/businessSetup';
import clsx from 'clsx';
import { CheckCircle, ImagePlus, MapPin, Loader2 } from 'lucide-react';

const DEFAULT_HOURS = [
  { day: 'Monday', open: true, start: '09:00 AM', end: '06:00 PM' },
  { day: 'Tuesday', open: true, start: '09:00 AM', end: '06:00 PM' },
  { day: 'Wednesday', open: true, start: '09:00 AM', end: '06:00 PM' },
  { day: 'Thursday', open: true, start: '09:00 AM', end: '06:00 PM' },
  { day: 'Friday', open: true, start: '09:00 AM', end: '06:00 PM' },
  { day: 'Saturday', open: true, start: '10:00 AM', end: '04:00 PM' },
  { day: 'Sunday', open: false, start: '09:00 AM', end: '06:00 PM' },
];

export default function BusinessSetupPage() {
  const router = useRouter();
  const business = useBusinessStore((s) => s.business);
  const updateBusiness = useBusinessStore((s) => s.updateBusiness);
  const hydrate = useBusinessStore((s) => s.hydrate);

  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const syncFromStore = useCallback(() => {
    if (!business) return;
    setLogo(business.logo || '');
    setBanner(business.banner || '');
    setGallery(business.images?.length ? [...business.images] : []);
    setDescription(business.description || '');
    setLocation(business.location || '');
    setLatitude(business.latitude ?? null);
    setLongitude(business.longitude ?? null);
    if (business.workingHours) {
      try {
        const parsed = JSON.parse(business.workingHours) as Array<{ day: string; hours: string }>;
        setHours(
          DEFAULT_HOURS.map((def) => {
            const row = parsed.find((p) => p.day === def.day);
            if (!row) return def;
            if (row.hours === 'Closed') return { ...def, open: false };
            const [start, end] = row.hours.split(' - ').map((s) => s.trim());
            return { ...def, open: true, start: start || def.start, end: end || def.end };
          }),
        );
      } catch {
        /* keep defaults */
      }
    }
  }, [business]);

  useEffect(() => {
    syncFromStore();
  }, [syncFromStore]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const setup = resolveSetupStatus(business);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      toastError('Location unavailable', 'Your browser does not support geolocation.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
        toastSuccess('Map pin saved');
      },
      () => {
        setLocating(false);
        toastError('Location denied', 'Allow location access or enter an address and try again.');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function saveSetup() {
    if (!business) return;
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        description: description.trim(),
        location: location.trim(),
        workingHours: JSON.stringify(
          hours.map((item) => ({
            day: item.day,
            hours: item.open ? `${item.start} - ${item.end}` : 'Closed',
          })),
        ),
        images: gallery.filter((u) => u.trim()).slice(0, 12),
      };
      if (logo.trim()) patch.logo = logo.trim();
      if (banner.trim()) patch.banner = banner.trim();
      if (latitude != null) patch.latitude = latitude;
      if (longitude != null) patch.longitude = longitude;
      await updateBusiness(patch);
      await hydrate();
      const fresh = useBusinessStore.getState().business;
      const next = resolveSetupStatus(fresh);
      if (next.complete) {
        toastSuccess('Setup complete', 'You can now choose to go visible on the app and web from your dashboard.');
        router.replace('/business/dashboard');
      } else {
        toastError('Still missing required items', next.missing.map(setupFieldLabel).join(', '));
      }
    } catch (e) {
      toastError('Save failed', e instanceof Error ? e.message : 'Could not save setup');
    } finally {
      setSaving(false);
    }
  }

  if (!business) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-bold text-slate-500">
        Loading…
      </div>
    );
  }

  const status = (business.status || '').toLowerCase();
  if (status !== 'active') {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
        <h2 className="text-xl font-black uppercase tracking-tight text-amber-900">Awaiting approval</h2>
        <p className="mt-3 text-sm font-medium text-amber-800">
          Platform admin must approve your business before you can complete setup and appear on the app and web.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Welcome</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Business setup</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Add the required photos, location, and hours. Until this is done, your listing stays hidden and the
          visibility toggle stays disabled.
        </p>
      </div>

      {setup.missing.length > 0 ? (
        <ul className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          <li className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Still needed</li>
          {setup.missing.map((f: BusinessSetupField) => (
            <li key={f} className="flex items-center gap-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {setupFieldLabel(f)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          <CheckCircle className="h-5 w-5 shrink-0" />
          All required items are saved. Go to your dashboard to go visible.
        </div>
      )}

      <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg md:p-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Logo & banner</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ImagePick label="Logo" value={logo} onChange={setLogo} maxWidth={512} maxHeight={512} />
          <ImagePick label="Banner" value={banner} onChange={setBanner} maxWidth={1600} maxHeight={900} />
        </div>
      </section>

      <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg md:p-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Gallery</h2>
        <p className="text-xs text-slate-500">At least one photo for your public venue page.</p>
        <div className="flex flex-wrap gap-3">
          {gallery.map((src, idx) => (
            <div key={`${idx}-${src.slice(0, 24)}`} className="relative h-24 w-24 overflow-hidden rounded-2xl border">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white"
                onClick={() => setGallery((g) => g.filter((_, i) => i !== idx))}
              >
                ×
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary">
            <ImagePlus className="h-6 w-6" />
            <span className="mt-1 text-[9px] font-black uppercase">Add</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                void Promise.all(
                  files.map((file) =>
                    compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, maxBytes: 400_000 }),
                  ),
                )
                  .then((urls) => setGallery((g) => [...g, ...urls].slice(0, 12)))
                  .catch((err) =>
                    toastError('Upload failed', err instanceof Error ? err.message : 'Try another image'),
                  );
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg md:p-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Basics</h2>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void useMyLocation()}
            disabled={locating}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            Pin on map (GPS)
          </button>
          {latitude != null && longitude != null ? (
            <span className="text-xs font-bold text-emerald-700">
              Location saved ({latitude.toFixed(4)}, {longitude.toFixed(4)})
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700">Map pin required for discovery</span>
          )}
        </div>
        {location.trim() ? (
          <iframe
            title="map-preview"
            className="h-48 w-full rounded-2xl border border-slate-100"
            src={`https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
          />
        ) : null}
      </section>

      <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg md:p-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Working hours</h2>
        <ul className="space-y-2">
          {hours.map((item, idx) => (
            <li key={item.day} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-2">
              <span className="w-24 text-xs font-black uppercase text-slate-600">{item.day}</span>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={item.open}
                  onChange={(e) =>
                    setHours((h) => h.map((row, i) => (i === idx ? { ...row, open: e.target.checked } : row)))
                  }
                />
                Open
              </label>
              {item.open ? (
                <>
                  <input
                    value={item.start}
                    onChange={(e) =>
                      setHours((h) => h.map((row, i) => (i === idx ? { ...row, start: e.target.value } : row)))
                    }
                    className="rounded-lg border px-2 py-1 text-xs"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    value={item.end}
                    onChange={(e) =>
                      setHours((h) => h.map((row, i) => (i === idx ? { ...row, end: e.target.value } : row)))
                    }
                    className="rounded-lg border px-2 py-1 text-xs"
                  />
                </>
              ) : (
                <span className="text-xs font-bold text-slate-400">Closed</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        disabled={saving}
        onClick={() => void saveSetup()}
        className={clsx(
          'w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-white',
          saving ? 'bg-slate-400' : 'bg-primary hover:opacity-90',
        )}
      >
        {saving ? 'Saving…' : 'Save & continue'}
      </button>
    </div>
  );
}

function ImagePick({
  label,
  value,
  onChange,
  maxWidth,
  maxHeight,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  maxWidth: number;
  maxHeight: number;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <div className="relative aspect-video overflow-hidden rounded-2xl border bg-slate-50">
        <img src={value || PLACEHOLDER_IMAGE_DATA_URI} alt={label} className="h-full w-full object-cover" />
        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 hover:bg-black/20">
          <span className="rounded-xl bg-white/90 px-3 py-2 text-[10px] font-black uppercase">Upload</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void compressImageFile(file, { maxWidth, maxHeight, maxBytes: 450_000 })
                .then(onChange)
                .catch((err) =>
                  toastError('Upload failed', err instanceof Error ? err.message : 'Try another image'),
                );
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
