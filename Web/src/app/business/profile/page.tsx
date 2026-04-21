'use client';

import { useBusinessStore } from '../../../store/businessStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Instagram, Twitter, Youtube } from 'lucide-react';

const BUSINESS_CATEGORIES = [
  'Salón de belleza',
  'Barbería',
  'Spa & wellness',
  'Uñas & manicura',
  'Estética facial',
  'Masajes',
  'Otro',
];

const optionalHttpsUrl = z
  .string()
  .refine((v) => {
    const t = v.trim();
    return t === '' || /^https?:\/\/.+/i.test(t);
  }, { message: 'Usa una URL que empiece con https:// o http://' });

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(10, 'Description at least 10 chars'),
  category: z.string().min(2, 'Category required'),
  location: z.string().min(5, 'Location required'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(10, 'Valid phone required'),
  socialYoutube: optionalHttpsUrl,
  socialInstagram: optionalHttpsUrl,
  socialX: optionalHttpsUrl,
  socialTiktok: optionalHttpsUrl,
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
  const business = useBusinessStore((state) => state.business);
  const updateBusiness = useBusinessStore((state) => state.updateBusiness);
  const [success, setSuccess] = useState(false);

  const categoryOptions = useMemo(() => {
    const list = [...BUSINESS_CATEGORIES];
    if (business?.category && !list.includes(business.category)) {
      list.unshift(business.category);
    }
    return list;
  }, [business?.category]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: business?.name || '',
      description: business?.description || '',
      category: business?.category || '',
      location: business?.location || '',
      contactEmail: business?.contactEmail || '',
      contactPhone: business?.contactPhone || '',
      socialYoutube: business?.socialYoutube || '',
      socialInstagram: business?.socialInstagram || '',
      socialX: business?.socialX || '',
      socialTiktok: business?.socialTiktok || '',
    },
  });

  useEffect(() => {
    if (!business) return;
    reset({
      name: business.name || '',
      description: business.description || '',
      category: business.category || '',
      location: business.location || '',
      contactEmail: business.contactEmail || '',
      contactPhone: business.contactPhone || '',
      socialYoutube: business.socialYoutube || '',
      socialInstagram: business.socialInstagram || '',
      socialX: business.socialX || '',
      socialTiktok: business.socialTiktok || '',
    });
  }, [business, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    updateBusiness({
      ...data,
      socialYoutube: data.socialYoutube.trim(),
      socialInstagram: data.socialInstagram.trim(),
      socialX: data.socialX.trim(),
      socialTiktok: data.socialTiktok.trim(),
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const banners = [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80'
  ];

  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2';
  const inputCls =
    'w-full min-h-[52px] px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-0 transition-colors';
  const errCls = 'mt-1.5 text-red-500 text-[10px] font-bold';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-20 md:space-y-10">
      <div className="relative group">
        <div className="relative h-56 w-full overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-2xl sm:h-64 sm:rounded-[40px]">
          <img
            src={business?.banner || banners[0]}
            alt="Business Banner"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-white p-1 shadow-2xl sm:h-24 sm:w-24 sm:rounded-3xl">
                <img src={business?.logo} alt="Logo" className="h-full w-full rounded-xl object-contain sm:rounded-2xl" />
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
            <button
              type="button"
              className="shrink-0 self-start rounded-2xl bg-white/20 px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/30 sm:self-auto"
            >
              Cambiar Logo
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:rounded-[40px] sm:p-8 md:p-10">
            <div className="mb-8 border-b border-slate-100 pb-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Información General</h3>
            </div>
            {success && (
              <div className="mb-8 flex items-center rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 animate-in slide-in-from-top-2">
                ✓ Perfil actualizado con éxito
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 md:space-y-8">
              <div className="space-y-2">
                <label className={labelCls}>Nombre del Negocio</label>
                <input {...register('name')} className={inputCls} />
                {errors.name && <p className={errCls}>{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Descripción</label>
                <textarea {...register('description')} className={inputCls} rows={4} />
                {errors.description && <p className={errCls}>{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-0">
                <div className="space-y-2">
                  <label className={labelCls}>Categoría</label>
                  <select {...register('category')} className={inputCls}>
                    <option value="">Seleccionar categoría…</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className={errCls}>{errors.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Ubicación</label>
                  <input {...register('location')} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-0">
                <div className="space-y-2">
                  <label className={labelCls}>Email de Contacto</label>
                  <input type="email" {...register('contactEmail')} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Teléfono</label>
                  <input {...register('contactPhone')} className={inputCls} />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-slate-100 bg-slate-50/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
                <div className="mb-6 border-b border-slate-200/80 pb-4">
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Redes sociales</h4>
                  <p className="mt-2 max-w-2xl text-[10px] font-bold uppercase leading-relaxed tracking-widest text-slate-400">
                    Enlaces públicos (https://…). Déjalos vacíos si no aplican.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Youtube className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-slate-600">YouTube</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://youtube.com/@tu-canal"
                      {...register('socialYoutube')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialYoutube && <p className={errCls}>{errors.socialYoutube.message}</p>}
                  </div>
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                        <Instagram className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-slate-600">Instagram</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://instagram.com/tu-perfil"
                      {...register('socialInstagram')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialInstagram && <p className={errCls}>{errors.socialInstagram.message}</p>}
                  </div>
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <Twitter className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-slate-600">X (Twitter)</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://x.com/tu-perfil"
                      {...register('socialX')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialX && <p className={errCls}>{errors.socialX.message}</p>}
                  </div>
                  <div className="flex min-h-[7.5rem] flex-col rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex shrink-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                        <TiktokGlyph className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 text-[10px] font-black uppercase tracking-widest text-slate-600">TikTok</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://www.tiktok.com/@usuario"
                      {...register('socialTiktok')}
                      className={`${inputCls} mt-auto rounded-xl`}
                    />
                    {errors.socialTiktok && <p className={errCls}>{errors.socialTiktok.message}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[52px] rounded-2xl bg-slate-900 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:rounded-[40px] sm:p-8 md:p-10">
            <div className="mb-8 border-b border-slate-100 pb-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Banner Visual</h3>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Selecciona el ambiente de tu negocio
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {banners.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateBusiness({ banner: url })}
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    business?.banner === url ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img src={url} alt={`Banner option ${idx}`} className="h-full w-full object-cover" />
                  {business?.banner === url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <div className="rounded-full bg-white p-1.5 text-primary shadow-lg">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="group mt-6 cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:border-primary/40 sm:mt-8 sm:rounded-3xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-primary">
                + Subir Propio
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
