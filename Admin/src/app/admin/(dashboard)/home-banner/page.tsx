"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  ImageIcon,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Upload,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  HOME_BANNER_ASPECT,
  HOME_BANNER_MAX_HEIGHT,
  HOME_BANNER_MAX_WIDTH,
  prepareHomeBannerImage,
} from "@/lib/homeBannerImage";
import { uploadImageDataUrl } from "@/lib/storageUpload";

type HomeBannerConfig = {
  homeHeroEnabled: boolean;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeHeroDealText: string;
  homeHeroImageUrl: string;
  homeHeroCtaText: string;
  homeHeroCtaUrl: string;
};

const EMPTY: HomeBannerConfig = {
  homeHeroEnabled: true,
  homeHeroTitle: "",
  homeHeroSubtitle: "",
  homeHeroDealText: "",
  homeHeroImageUrl: "",
  homeHeroCtaText: "",
  homeHeroCtaUrl: "",
};

const WEB_APP =
  process.env.NEXT_PUBLIC_WEB_APP_URL?.replace(/\/$/, "") || "https://rezervame-web.web.app";

export default function HomeBannerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [banner, setBanner] = useState<HomeBannerConfig>(EMPTY);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; bytes: number } | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Record<string, unknown>>("/admin/config");
      setBanner({
        homeHeroEnabled: data.homeHeroEnabled !== false,
        homeHeroTitle: String(data.homeHeroTitle ?? ""),
        homeHeroSubtitle: String(data.homeHeroSubtitle ?? ""),
        homeHeroDealText: String(data.homeHeroDealText ?? ""),
        homeHeroImageUrl:
          data.homeHeroImageUrl && data.homeHeroImageUrl !== "***"
            ? String(data.homeHeroImageUrl)
            : "",
        homeHeroCtaText: String(data.homeHeroCtaText ?? ""),
        homeHeroCtaUrl: String(data.homeHeroCtaUrl ?? ""),
      });
      setImageMeta(null);
    } catch (e) {
      toastError("Could not load banner", String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const prepared = await prepareHomeBannerImage(file);
      const url = await uploadImageDataUrl(prepared.dataUrl, "site/hero");
      setBanner((b) => ({ ...b, homeHeroImageUrl: url }));
      setImageMeta({
        width: prepared.width,
        height: prepared.height,
        bytes: prepared.bytes,
      });
      toastSuccess("Image uploaded", "Your banner image is ready.");
    } catch (e) {
      toastError("Upload failed", e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiPost("/admin/config", {
        homeHeroEnabled: banner.homeHeroEnabled,
        homeHeroTitle: banner.homeHeroTitle.trim(),
        homeHeroSubtitle: banner.homeHeroSubtitle.trim(),
        homeHeroDealText: banner.homeHeroDealText.trim(),
        homeHeroImageUrl: banner.homeHeroImageUrl.trim(),
        homeHeroCtaText: banner.homeHeroCtaText.trim(),
        homeHeroCtaUrl: banner.homeHeroCtaUrl.trim(),
      });
      toastSuccess("Banner saved", "Your changes are live on the website and app.");
      await load();
    } catch (e) {
      toastError("Save failed", String(e));
    } finally {
      setSaving(false);
    }
  }

  const enabled = banner.homeHeroEnabled;
  const heroBackgroundStyle: React.CSSProperties = banner.homeHeroImageUrl
    ? { backgroundImage: `url('${banner.homeHeroImageUrl}')` }
    : {
        background:
          "linear-gradient(135deg, #1e293b 0%, #334155 40%, #475569 100%)",
      };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading home banner…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Home banner</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hero image and promo text on the website home page and mobile app.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={WEB_APP}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            View live site
          </a>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save banner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <Monitor className="h-4 w-4" />
            Live preview
          </div>
          <div
            className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-lg"
            style={{
              aspectRatio: String(HOME_BANNER_ASPECT),
              minHeight: 200,
              maxHeight: 320,
            }}
          >
            <div className="absolute inset-0 bg-cover bg-center" style={heroBackgroundStyle} />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-8 text-center text-white">
              {!enabled ? (
                <p className="rounded-full bg-amber-500/90 px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                  Banner hidden on site
                </p>
              ) : null}
              {enabled && banner.homeHeroDealText ? (
                <span className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20">
                  {banner.homeHeroDealText}
                </span>
              ) : null}
              <h2 className="max-w-md text-xl font-extrabold leading-tight drop-shadow md:text-2xl">
                {enabled && banner.homeHeroTitle ? banner.homeHeroTitle : "Beauty bookings, instant"}
              </h2>
              <p className="mt-2 max-w-sm text-sm opacity-90">
                {enabled && banner.homeHeroSubtitle
                  ? banner.homeHeroSubtitle
                  : "Find and book with top local experts"}
              </p>
              {enabled && banner.homeHeroCtaUrl ? (
                <span className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-[11px] font-black uppercase tracking-wide text-slate-900">
                  {banner.homeHeroCtaText || "Book now"} →
                </span>
              ) : null}
            </div>
          </div>
          <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <Smartphone className="h-3.5 w-3.5" />
            Same offer text and image feed the mobile home carousel when enabled.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              checked={banner.homeHeroEnabled}
              onChange={(e) => setBanner({ ...banner, homeHeroEnabled: e.target.checked })}
              className="h-5 w-5 accent-rose-600"
            />
            Show banner on web &amp; mobile home
          </label>

          <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Banner image</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Use a wide landscape photo (JPEG or PNG).
                </p>
              </div>
              <ImageIcon className="h-5 w-5 shrink-0 text-slate-400" />
            </div>

            {banner.homeHeroImageUrl ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={banner.homeHeroImageUrl}
                  alt="Banner preview"
                  className="h-32 w-full object-cover"
                />
              </div>
            ) : null}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImageFile(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Upload image"}
            </button>

            {imageMeta ? (
              <p className="text-center text-[11px] font-semibold text-emerald-700">Image uploaded</p>
            ) : null}

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Or paste image URL
              </label>
              <input
                value={banner.homeHeroImageUrl}
                onChange={(e) => setBanner({ ...banner, homeHeroImageUrl: e.target.value })}
                placeholder="https://…"
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Offer / deal pill (optional)
            </label>
            <input
              value={banner.homeHeroDealText}
              onChange={(e) => setBanner({ ...banner, homeHeroDealText: e.target.value })}
              placeholder="30% OFF · This week only"
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
            />
            <p className="text-[11px] font-medium text-slate-500">
              Short promo line above the title — ideal for limited-time offers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Headline</label>
              <input
                value={banner.homeHeroTitle}
                onChange={(e) => setBanner({ ...banner, homeHeroTitle: e.target.value })}
                placeholder="Beauty bookings, instant"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Subtitle</label>
              <input
                value={banner.homeHeroSubtitle}
                onChange={(e) => setBanner({ ...banner, homeHeroSubtitle: e.target.value })}
                placeholder="Find and book with top local experts"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Button label</label>
              <input
                value={banner.homeHeroCtaText}
                onChange={(e) => setBanner({ ...banner, homeHeroCtaText: e.target.value })}
                placeholder="Book now"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Button link</label>
              <input
                value={banner.homeHeroCtaUrl}
                onChange={(e) => setBanner({ ...banner, homeHeroCtaUrl: e.target.value })}
                placeholder="/search?category=hairService"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
              />
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            Use a site path (e.g. <span className="font-mono">/search</span>) or full https URL for external links.
          </p>
        </div>
      </div>
    </div>
  );
}
