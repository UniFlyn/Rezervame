'use client';

import { useBusinessStore } from '../../../store/businessStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useEffect, useState } from 'react';
import { Instagram, Twitter, Youtube, Sparkles, CheckCircle, X, ImagePlus } from 'lucide-react';
import { fetchPublicAmenities, type PublicAmenity } from '@/lib/venueSearch';
import { amenityLucideIcon } from '@/lib/amenityIcons';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';
import { PLACEHOLDER_IMAGE_DATA_URI } from '@/lib/placeholderImage';
import { compressImageFile } from '@/lib/compressImage';
import { resolveApiBase } from '@/lib/apiBase';
import { useI18n } from '@/components/I18nProvider';
import { BusinessTypePicker } from '@/components/business/BusinessTypePicker';
import {
  BusinessProfileRegistrationFields,
  mergeRegistrationExtended,
} from '@/components/business/BusinessProfileRegistrationFields';
import { categoryKeysForPartnerType, inferPartnerTypeId } from '@/lib/partnerBusinessTypes';
import type { BusinessRegistrationDetails } from '@/lib/businessJoinConfig';
import { buildBusinessProfilePatch } from '@/lib/businessProfilePatch';

const optionalHttpsUrl = z
  .string()
  .refine((v) => {
    const t = v.trim();
    return t === '' || /^https?:\/\/.+/i.test(t);
  }, { message: 'Use a URL that starts with https:// or http://' });

const optionalImageOrHttps = z
  .string()
  .refine((v) => {
    const t = v.trim();
    return t === '' || /^https?:\/\/.+/i.test(t) || /^data:image\//i.test(t);
  }, { message: 'Use https:// URL or upload an image file' });

const MAX_GALLERY_PHOTOS = 12;

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  owner: z.string().min(2, 'Owner name is required'),
  taxId: z.string().min(2, 'Tax ID is required'),
  description: z.string().min(10, 'Description at least 10 chars'),
  location: z.string().min(5, 'Location required'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(10, 'Valid phone required'),
  socialYoutube: optionalHttpsUrl,
  socialInstagram: optionalHttpsUrl,
  socialX: optionalHttpsUrl,
  socialTiktok: optionalHttpsUrl,
  logo: optionalImageOrHttps,
  banner: optionalImageOrHttps,
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function TiktokGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

export default function ProfilePage() {
  const { t, language } = useI18n();
  const lang = language === 'es' ? 'es' : 'en';
  const business = useBusinessStore((state) => state.business);
  const updateBusiness = useBusinessStore((state) => state.updateBusiness);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [amenityCatalog, setAmenityCatalog] = useState<PublicAmenity[]>([]);
  const [amenityKeysDraft, setAmenityKeysDraft] = useState<string[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [galleryDraft, setGalleryDraft] = useState<string[]>([]);
  const [businessTypeId, setBusinessTypeId] = useState('');
  const [categoryKeysDraft, setCategoryKeysDraft] = useState<string[]>([]);
  const [registrationExtended, setRegistrationExtended] = useState(() =>
    mergeRegistrationExtended('', null),
  );
  const [workingHoursDraft, setWorkingHoursDraft] = useState<Array<{ day: string; open: boolean; start: string; end: string }>>([
    { day: "Monday", open: true, start: "09:00 AM", end: "06:00 PM" },
    { day: "Tuesday", open: true, start: "09:00 AM", end: "06:00 PM" },
    { day: "Wednesday", open: true, start: "09:00 AM", end: "06:00 PM" },
    { day: "Thursday", open: true, start: "09:00 AM", end: "06:00 PM" },
    { day: "Friday", open: true, start: "09:00 AM", end: "06:00 PM" },
    { day: "Saturday", open: true, start: "10:00 AM", end: "04:00 PM" },
    { day: "Sunday", open: false, start: "09:00 AM", end: "06:00 PM" },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: business?.name || '',
      owner: business?.owner || '',
      taxId: business?.taxId || '',
      description: business?.description || '',
      location: business?.location || '',
      contactEmail: business?.contactEmail || '',
      contactPhone: business?.contactPhone || '',
      socialYoutube: business?.socialYoutube || '',
      socialInstagram: business?.socialInstagram || '',
      socialX: business?.socialX || '',
      socialTiktok: business?.socialTiktok || '',
      logo: business?.logo || '',
      banner: business?.banner || '',
    },
  });

  const logoVal = watch('logo');
  const bannerVal = watch('banner');

  const syncFromBusiness = useCallback(() => {
    if (!business) return;
    const keepLogo = getValues('logo')?.trim() || '';
    const keepBanner = getValues('banner')?.trim() || '';
    const typeId =
      business.businessType ||
      inferPartnerTypeId(business.categoryKeys, (business.registrationDetails as BusinessRegistrationDetails)?.businessType);
    setBusinessTypeId(typeId);
    setCategoryKeysDraft(
      business.categoryKeys?.length
        ? [...business.categoryKeys]
        : typeId
          ? categoryKeysForPartnerType(typeId)
          : [],
    );
    setRegistrationExtended(
      mergeRegistrationExtended(
        typeId,
        (business.registrationDetails as BusinessRegistrationDetails) ?? null,
        {
          latitude: business.latitude,
          longitude: business.longitude,
          contactPhone: business.contactPhone,
          contactEmail: business.contactEmail,
        },
      ),
    );

    reset({
      name: business.name || '',
      owner: business.owner || '',
      taxId: business.taxId || '',
      description: business.description || '',
      location: business.location || '',
      contactEmail: business.contactEmail || '',
      contactPhone: business.contactPhone || '',
      socialYoutube: business.socialYoutube || '',
      socialInstagram: business.socialInstagram || '',
      socialX: business.socialX || '',
      socialTiktok: business.socialTiktok || '',
      logo: business.logo || keepLogo || '',
      banner: business.banner || keepBanner || '',
    });
    setAmenityKeysDraft([...(business.amenityKeys ?? [])]);

    const logo = (business.logo || '').trim();
    const banner = (business.banner || '').trim();
    const skip = new Set([logo, banner].filter(Boolean));
    const gallery = (business.images ?? []).filter((u) => {
      const s = (u || '').trim();
      return s && !skip.has(s);
    });
    setGalleryDraft(gallery.length > 0 ? gallery : banner ? [banner] : []);

    if (business.workingHours) {
      try {
        const parsed = JSON.parse(business.workingHours);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded = [
            { day: "Monday", open: true, start: "09:00 AM", end: "06:00 PM" },
            { day: "Tuesday", open: true, start: "09:00 AM", end: "06:00 PM" },
            { day: "Wednesday", open: true, start: "09:00 AM", end: "06:00 PM" },
            { day: "Thursday", open: true, start: "09:00 AM", end: "06:00 PM" },
            { day: "Friday", open: true, start: "09:00 AM", end: "06:00 PM" },
            { day: "Saturday", open: true, start: "10:00 AM", end: "04:00 PM" },
            { day: "Sunday", open: false, start: "09:00 AM", end: "06:00 PM" },
          ].map(def => {
            const match = parsed.find((p: any) => p.day?.toLowerCase() === def.day.toLowerCase());
            if (match) {
              const isClosed = match.hours?.toLowerCase() === "closed";
              let start = "09:00 AM";
              let end = "06:00 PM";
              if (!isClosed && match.hours?.includes(" - ")) {
                const parts = match.hours.split(" - ");
                start = parts[0]?.trim() || "09:00 AM";
                end = parts[1]?.trim() || "06:00 PM";
              }
              return {
                day: def.day,
                open: !isClosed,
                start,
                end
              };
            }
            return def;
          });
          setWorkingHoursDraft(loaded);
        }
      } catch (e) {
        console.error("Error parsing loaded workingHours:", e);
      }
    }
  }, [business, reset, getValues]);

  useEffect(() => {
    syncFromBusiness();
  }, [syncFromBusiness]);

  /** Register logo/banner without hidden inputs — browsers cap `input.value` length, which drops huge data URLs on submit. */
  useEffect(() => {
    register('logo');
    register('banner');
  }, [register]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicAmenities()
      .then((rows) => {
        if (!cancelled) setAmenityCatalog(rows);
      })
      .catch(() => {
        if (!cancelled) setAmenityCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const API_BASE = resolveApiBase();
    fetch(`${API_BASE}/public/plans`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error("Plans failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setPlans(data);
          } else {
            throw new Error("No plans");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlans([
            {
              id: 'basic',
              name: 'Basic',
              price: 0,
              billingCycle: 'monthly',
              features: ['Up to 50 bookings/month', 'Basic business profile', 'Email support'],
            },
            {
              id: 'premium',
              name: 'Premium',
              price: 29.0,
              billingCycle: 'monthly',
              features: ['Unlimited bookings', 'Marketing & Promotions', 'Advanced Analytics', '24/7 Priority support'],
            },
            {
              id: 'gold',
              name: 'Gold',
              price: 29.99,
              billingCycle: 'monthly',
              features: ['Unlimited Staff', 'Unlimited Service'],
            },
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!business) return;
    setErrorMessage(null);
    try {
      const logo = (getValues('logo') || data.logo || business.logo || '').trim();
      const banner = (getValues('banner') || data.banner || business.banner || '').trim();
      const resolvedTypeId =
        businessTypeId ||
        inferPartnerTypeId(business.categoryKeys, registrationExtended.businessType) ||
        business.businessType ||
        '';
      if (!resolvedTypeId) {
        toastWarning('Business type', 'Select the same business type you chose when registering.');
        return;
      }
      const workingHoursJson = JSON.stringify(
        workingHoursDraft.map((item) => ({
          day: item.day,
          hours: item.open ? `${item.start} - ${item.end}` : 'Closed',
        })),
      );
      const patch = buildBusinessProfilePatch({
        business,
        form: data,
        businessTypeId: resolvedTypeId,
        categoryKeys:
          categoryKeysDraft.length > 0
            ? categoryKeysDraft
            : categoryKeysForPartnerType(resolvedTypeId),
        registrationDetails: {
          ...registrationExtended,
          businessType: resolvedTypeId,
        },
        amenityKeys: amenityKeysDraft,
        galleryImages: galleryDraft,
        workingHoursJson,
        logo,
        banner,
      });
      await updateBusiness(patch);
      setBusinessTypeId(resolvedTypeId);
      setSuccess(true);
      toastSuccess('Business profile updated');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setSuccess(false);
      const msg = error instanceof Error ? error.message : 'Update failed';
      setErrorMessage(msg);
      toastError('Update failed', msg);
    }
  };

  function toggleAmenityKey(key: string) {
    setAmenityKeysDraft((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)] mb-2';
  const inputCls =
    'w-full min-h-[52px] px-5 py-3.5 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl text-sm font-bold text-[var(--rz-navy-800)] placeholder:text-[var(--rz-gray-300)] focus:outline-none focus:border-primary focus:bg-white focus:ring-0 transition-colors';
  const errCls = 'mt-1.5 text-red-500 text-[10px] font-bold';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-20 md:space-y-10">
      <div className="relative group">
        <div className="relative h-56 w-full overflow-hidden rounded-3xl border-4 border-white bg-[var(--rz-gray-100)] shadow-2xl sm:h-64 sm:rounded-[40px]">
          <img
            key={bannerVal ? bannerVal.slice(0, 48) : 'banner-empty'}
            src={bannerVal || PLACEHOLDER_IMAGE_DATA_URI}
            alt="Business Banner"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,48,71,0.7)] via-[rgba(2,48,71,0.2)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-white p-1 shadow-2xl sm:h-24 sm:w-24 sm:rounded-3xl">
                <img
                  key={logoVal ? logoVal.slice(0, 48) : 'logo-empty'}
                  src={logoVal || PLACEHOLDER_IMAGE_DATA_URI}
                  alt="Logo"
                  className="h-full w-full rounded-xl object-contain sm:rounded-2xl"
                />
              </div>
              <div className="min-w-0 text-left">
                <h1 className="truncate text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  {business?.name}
                </h1>
                <p className="mt-1 text-left text-[10px] font-bold uppercase tracking-widest text-white/80 sm:text-xs">
                  {business?.category}
                </p>
              </div>
            </div>
            <label className="shrink-0 cursor-pointer self-start rounded-2xl bg-white/20 px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/30 sm:self-auto">
              Change logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void compressImageFile(file, { maxWidth: 512, maxHeight: 512, maxBytes: 280_000 })
                    .then((url) => setValue('logo', url, { shouldValidate: true, shouldDirty: true }))
                    .catch((err) =>
                      toastError('Logo upload failed', err instanceof Error ? err.message : 'Try another image'),
                    );
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="rounded-3xl border border-[var(--rz-gray-100)] bg-white p-6 shadow-xl shadow-[color:rgba(231,234,239,0.5)] sm:rounded-[40px] sm:p-8 md:p-10">
            <div className="mb-8 border-b border-[var(--rz-gray-100)] pb-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">General information</h3>
            </div>
            {errorMessage && (
              <div className="mb-4 flex items-center rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
                {errorMessage}
              </div>
            )}
            {success && (
              <div className="mb-8 flex items-center rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 animate-in slide-in-from-top-2">
                Profile updated successfully
              </div>
            )}
            <form
              onSubmit={handleSubmit(onSubmit, (formErrors) => {
                const first = Object.values(formErrors)[0] as { message?: string } | undefined;
                const m = first?.message;
                if (m) toastWarning('Please fix the form', m);
              })}
              className="space-y-7 md:space-y-8"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelCls}>Business name</label>
                  <input {...register('name')} className={inputCls} />
                  {errors.name && <p className={errCls}>{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Tax ID</label>
                  <input {...register('taxId')} className={inputCls} />
                  {errors.taxId && <p className={errCls}>{errors.taxId.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Owner / manager</label>
                <input {...register('owner')} className={inputCls} />
                {errors.owner && <p className={errCls}>{errors.owner.message}</p>}
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Description</label>
                <textarea {...register('description')} className={inputCls} rows={4} />
                {errors.description && <p className={errCls}>{errors.description.message}</p>}
              </div>

              <div className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6">
                <label className={labelCls}>{t('joinBusinessTypeLabel')}</label>
                <p className="mb-4 text-[10px] font-bold uppercase leading-relaxed tracking-widest text-[var(--rz-gray-500)]">
                  {t('joinBusinessTypeSub')}
                </p>
                {!businessTypeId ? (
                  <p className="mb-3 text-xs font-bold text-amber-700">
                    No business type detected from registration — pick the type you selected when joining.
                  </p>
                ) : null}
                <BusinessTypePicker
                  compact
                  lang={lang}
                  selectedId={businessTypeId}
                  t={t}
                  onSelect={(id, categoryKeys) => {
                    setBusinessTypeId(id);
                    setCategoryKeysDraft(categoryKeys);
                    setRegistrationExtended((prev) => ({ ...prev, businessType: id }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Street address</label>
                <input {...register('location')} className={inputCls} />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-0">
                <div className="space-y-2">
                  <label className={labelCls}>Contact email</label>
                  <input type="email" {...register('contactEmail')} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Phone</label>
                  <input {...register('contactPhone')} className={inputCls} />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
                <div className="mb-4 border-b border-[#e7eaef]/80 pb-4">
                  <h4 className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Amenities</h4>
                  <p className="mt-2 max-w-2xl text-[10px] font-bold uppercase leading-relaxed tracking-widest text-[var(--rz-gray-500)]">
                    Select what guests can expect. Managed in Admin → Amenities.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {amenityCatalog.map((a) => {
                    const on = amenityKeysDraft.includes(a.key);
                    const Icon = amenityLucideIcon(a.key);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenityKey(a.key)}
                        className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide transition-colors ${
                          on ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--rz-gray-200)] bg-white text-[var(--rz-gray-600)] hover:border-[var(--rz-gray-300)]'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        <span>{a.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
                {amenityCatalog.length === 0 ? (
                  <p className="mt-2 text-xs font-bold text-[var(--rz-gray-500)]">No amenities loaded. Check API and seed.</p>
                ) : null}
              </div>

              <div className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
                <div className="mb-6 border-b border-[#e7eaef]/80 pb-4">
                  <h4 className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Social links</h4>
                  <p className="mt-2 max-w-2xl text-[10px] font-bold uppercase leading-relaxed tracking-widest text-[var(--rz-gray-500)]">
                    Public links (https://...). Leave blank if not applicable.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-[var(--rz-gray-100)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Youtube className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-600)]">YouTube</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://youtube.com/@your-channel"
                      {...register('socialYoutube')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialYoutube && <p className={errCls}>{errors.socialYoutube.message}</p>}
                  </div>
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-[var(--rz-gray-100)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                        <Instagram className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-600)]">Instagram</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://instagram.com/your-handle"
                      {...register('socialInstagram')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialInstagram && <p className={errCls}>{errors.socialInstagram.message}</p>}
                  </div>
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-[var(--rz-gray-100)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--rz-navy)] text-white">
                        <Twitter className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-600)]">X (Twitter)</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://x.com/your-handle"
                      {...register('socialX')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialX && <p className={errCls}>{errors.socialX.message}</p>}
                  </div>
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-[var(--rz-gray-100)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                        <TiktokGlyph className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-600)]">TikTok</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://www.tiktok.com/@your-handle"
                      {...register('socialTiktok')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialTiktok && <p className={errCls}>{errors.socialTiktok.message}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 border-b border-[#e7eaef]/80 pb-4">
                  <h4 className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Business Hours</h4>
                  <p className="mt-2 max-w-2xl text-[10px] font-bold uppercase leading-relaxed tracking-widest text-[var(--rz-gray-500)]">
                    Set your weekly operating hours. Turn off the toggle for days you are closed.
                  </p>
                </div>
                <div className="space-y-4">
                  {workingHoursDraft.map((item, idx) => (
                    <div key={item.day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#e7eaef]/60 bg-white shadow-sm transition-all hover:border-[var(--rz-gray-300)]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...workingHoursDraft];
                            updated[idx].open = !updated[idx].open;
                            setWorkingHoursDraft(updated);
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${item.open ? 'bg-[var(--rz-navy)]' : 'bg-[var(--rz-gray-200)]'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${item.open ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                        <span className="text-xs font-black uppercase tracking-wider text-[var(--rz-gray-700)] min-w-[90px]">{item.day}</span>
                      </div>
                      
                      {item.open ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={item.start}
                            onChange={(e) => {
                              const updated = [...workingHoursDraft];
                              updated[idx].start = e.target.value;
                              setWorkingHoursDraft(updated);
                            }}
                            className="bg-[var(--rz-gray-050)] border border-[var(--rz-gray-200)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--rz-navy-800)] outline-none cursor-pointer focus:border-[var(--rz-gray-500)]"
                          >
                            {Array.from({ length: 24 }).map((_, h) => {
                              const hour = h % 12 === 0 ? 12 : h % 12;
                              const ampm = h < 12 ? 'AM' : 'PM';
                              const formatted = `${String(hour).padStart(2, '0')}:00 ${ampm}`;
                              const formatted30 = `${String(hour).padStart(2, '0')}:30 ${ampm}`;
                              return (
                                <React.Fragment key={h}>
                                  <option value={formatted}>{formatted}</option>
                                  <option value={formatted30}>{formatted30}</option>
                                </React.Fragment>
                              );
                            })}
                          </select>
                          <span className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest">to</span>
                          <select
                            value={item.end}
                            onChange={(e) => {
                              const updated = [...workingHoursDraft];
                              updated[idx].end = e.target.value;
                              setWorkingHoursDraft(updated);
                            }}
                            className="bg-[var(--rz-gray-050)] border border-[var(--rz-gray-200)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--rz-navy-800)] outline-none cursor-pointer focus:border-[var(--rz-gray-500)]"
                          >
                            {Array.from({ length: 24 }).map((_, h) => {
                              const hour = h % 12 === 0 ? 12 : h % 12;
                              const ampm = h < 12 ? 'AM' : 'PM';
                              const formatted = `${String(hour).padStart(2, '0')}:00 ${ampm}`;
                              const formatted30 = `${String(hour).padStart(2, '0')}:30 ${ampm}`;
                              return (
                                <React.Fragment key={h}>
                                  <option value={formatted}>{formatted}</option>
                                  <option value={formatted30}>{formatted30}</option>
                                </React.Fragment>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--rz-gray-500)] py-1.5 px-4 bg-[var(--rz-gray-050)] border border-[var(--rz-gray-100)] rounded-lg">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(errors.logo || errors.banner) && (
                <p className={errCls}>{errors.logo?.message || errors.banner?.message}</p>
              )}

              <BusinessProfileRegistrationFields
                lang={lang}
                extended={registrationExtended}
                setExtended={setRegistrationExtended}
              />

              <div className="border-t border-[var(--rz-gray-100)] pt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[52px] rounded-2xl bg-[var(--rz-navy)] py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[color:var(--rz-gray-200)] transition-all hover:bg-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6">
          <div className="rounded-3xl border border-[var(--rz-gray-100)] bg-white p-6 shadow-xl shadow-[color:rgba(231,234,239,0.5)] sm:rounded-[40px] sm:p-8 md:p-10">
            <div className="mb-8 border-b border-[var(--rz-gray-100)] pb-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Visual banner</h3>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                Upload your banner image (saved with Save changes). No stock presets.
              </p>
            </div>
            <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--rz-gray-200)] bg-[var(--rz-gray-050)] p-6 text-center transition-colors hover:border-primary/40 sm:rounded-3xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)] transition-colors group-hover:text-primary">
                + Upload custom banner
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void compressImageFile(file, { maxWidth: 1600, maxHeight: 900, maxBytes: 400_000 })
                    .then((dataUrl) =>
                      setValue('banner', dataUrl, { shouldValidate: true, shouldDirty: true }),
                    )
                    .catch((err) =>
                      toastError('Banner upload failed', err instanceof Error ? err.message : 'Try another image'),
                    );
                  e.target.value = '';
                }}
              />
            </label>

            <div className="mt-8 border-t border-[var(--rz-gray-100)] pt-8">
              <div className="mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Photo gallery</h3>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                  Add up to {MAX_GALLERY_PHOTOS} photos for your public venue page. Logo stays on the banner; these appear in the gallery.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryDraft.map((src, idx) => (
                  <div
                    key={`${src.slice(0, 24)}-${idx}`}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)]"
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setGalleryDraft((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute right-2 top-2 rounded-full bg-[#023047]/80 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {galleryDraft.length < MAX_GALLERY_PHOTOS ? (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--rz-gray-200)] bg-[var(--rz-gray-050)] text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
                    <ImagePlus className="mb-2 h-6 w-6 text-[var(--rz-gray-300)]" />
                    <span className="px-2 text-[9px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                      Add photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length === 0) return;
                        void (async () => {
                          const remaining = MAX_GALLERY_PHOTOS - galleryDraft.length;
                          const picked = files.slice(0, remaining);
                          try {
                            const urls = await Promise.all(
                              picked.map((file) =>
                                compressImageFile(file, {
                                  maxWidth: 1200,
                                  maxHeight: 900,
                                  maxBytes: 350_000,
                                }),
                              ),
                            );
                            setGalleryDraft((prev) => [...prev, ...urls].slice(0, MAX_GALLERY_PHOTOS));
                          } catch (err) {
                            toastError(
                              'Photo upload failed',
                              err instanceof Error ? err.message : 'Try another image',
                            );
                          }
                        })();
                        e.target.value = '';
                      }}
                    />
                  </label>
                ) : null}
              </div>
              <p className="mt-3 text-[10px] font-bold text-[var(--rz-gray-500)]">
                {galleryDraft.length} / {MAX_GALLERY_PHOTOS} photos · Save changes to publish
              </p>
            </div>
          </div>

          {/* PLAN MANAGEMENT CARD */}
          <div className="mt-8 rounded-3xl border border-[var(--rz-gray-100)] bg-white p-6 shadow-xl shadow-[color:rgba(231,234,239,0.5)] sm:rounded-[40px] sm:p-8 md:p-10">
            <div className="mb-6 border-b border-[var(--rz-gray-100)] pb-6">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-gradient-to-tr from-[#ff5757] to-amber-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-[#ff5757]/20">
                    <Sparkles size={16} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Subscription Plan</h3>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                       Manage your merchant subscription tier
                    </p>
                 </div>
              </div>
            </div>

            {/* Current Active Plan Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-[var(--rz-navy)] to-[var(--rz-navy-800)] p-6 text-white shadow-lg mb-6">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5757]">Active Plan</p>
               <h4 className="text-2xl font-black uppercase tracking-tight mt-1">
                  {business?.plan || 'Basic'}
               </h4>
               <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--rz-gray-300)]">
                  <CheckCircle className="text-emerald-400" size={14} />
                  <span>Seeded Enterprise Ready</span>
               </div>
            </div>

            {/* Plan Switcher Grid */}
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Change Plan</p>
               <div className="grid grid-cols-1 gap-3">
                  {plans.map((p) => {
                     const isCurrent = (business?.planId === p.id) || (!business?.planId && p.id === 'basic') || (business?.plan?.toLowerCase() === p.id.toLowerCase()) || (business?.plan?.toLowerCase() === p.name.toLowerCase());
                     return (
                        <button
                           key={p.id}
                           type="button"
                           onClick={async () => {
                              if (isCurrent) return;
                              try {
                                 await updateBusiness({ planId: p.id, plan: p.name });
                                 toastSuccess(`Upgraded to ${p.name} plan successfully!`);
                              } catch (err) {
                                 toastError('Upgrade failed', err instanceof Error ? err.message : 'Upgrade request failed');
                              }
                           }}
                           className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-300 flex items-center justify-between ${
                              isCurrent
                                 ? 'border-[#ff5757] bg-[#ff5757]/5 shadow-[#ff5757]/5 cursor-default'
                                 : 'border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] hover:border-[var(--rz-gray-300)] hover:bg-white'
                           }`}
                        >
                           <div>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                 isCurrent ? 'bg-[#ff5757] text-white' : 'bg-[var(--rz-gray-200)] text-[var(--rz-gray-600)]'
                              }`}>
                                 {p.name}
                              </span>
                              <p className="text-sm font-black text-[var(--rz-navy)] mt-1">
                                 ${p.price.toFixed(2)} <span className="text-[10px] text-[var(--rz-gray-500)] font-bold">/ {p.billingCycle === 'yearly' ? 'year' : 'month'}</span>
                              </p>
                           </div>

                           {isCurrent ? (
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#ff5757] bg-[#ff5757]/10 px-3 py-1.5 rounded-xl">
                                 Active
                              </span>
                           ) : (
                              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--rz-gray-600)] bg-white border border-[var(--rz-gray-200)] px-3 py-1.5 rounded-xl shadow-sm hover:bg-[var(--rz-gray-050)]">
                                 Switch
                              </span>
                           )}
                        </button>
                     );
                  })}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
