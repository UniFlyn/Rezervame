'use client';

import { useBusinessStore } from '../../../store/businessStore';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(10, 'Description at least 10 chars'),
  category: z.string().min(2, 'Category required'),
  location: z.string().min(5, 'Location required'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(10, 'Valid phone required')
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const business = useBusinessStore((state) => state.business);
  const updateBusiness = useBusinessStore((state) => state.updateBusiness);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: business?.name || '',
      description: business?.description || '',
      category: business?.category || '',
      location: business?.location || '',
      contactEmail: business?.contactEmail || '',
      contactPhone: business?.contactPhone || ''
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    updateBusiness(data);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const banners = [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="relative group">
        <div className="w-full h-64 bg-slate-100 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative">
          <img 
            src={business?.banner || banners[0]} 
            alt="Business Banner" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-2xl">
                <img src={business?.logo} alt="Logo" className="w-full h-full object-contain rounded-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">{business?.name}</h1>
                <p className="text-white/80 font-bold text-xs uppercase tracking-widest">{business?.category}</p>
              </div>
            </div>
            <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
              Cambiar Logo
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Información General</h3>
            {success && <div className="mb-6 bg-emerald-50 text-emerald-600 p-4 rounded-2xl font-bold flex items-center animate-in slide-in-from-top-2">✓ Perfil actualizado con éxito</div>}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nombre del Negocio</label>
                <input {...register('name')} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
                <textarea {...register('description')} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" rows={4}></textarea>
                {errors.description && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Categoría</label>
                  <input {...register('category')} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Ubicación</label>
                  <input {...register('location')} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email de Contacto</label>
                  <input type="email" {...register('contactEmail')} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Teléfono</label>
                  <input {...register('contactPhone')} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-slate-200 disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Banner Visual</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Selecciona el ambiente de tu negocio</p>
            <div className="grid grid-cols-2 gap-4">
              {banners.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => updateBusiness({ banner: url })}
                  className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-4 transition-all ${business?.banner === url ? 'border-primary ring-4 ring-primary/20' : 'border-slate-50 hover:border-slate-200'}`}
                >
                  <img src={url} alt={`Banner option ${idx}`} className="w-full h-full object-cover" />
                  {business?.banner === url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-white text-primary rounded-full p-1.5 shadow-lg">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-8 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center cursor-pointer hover:border-primary/30 transition-all group">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">+ Subir Propio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
