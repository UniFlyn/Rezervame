'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServicesStore, Service } from '../../../store/servicesStore';
import { useBusinessStore } from '../../../store/businessStore';
import { useI18n } from '../../../components/I18nProvider';
import { fetchPublicCategories, type PublicCategory } from '@/lib/venueSearch';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';
import { Plus, Edit, Trash2, X, Scissors, Camera } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import clsx from 'clsx';
import { Tag, Percent } from 'lucide-react';

type Draft = {
  name: string;
  price: number | '';
  categoryKey: string;
  duration: number | '';
  /** Data URL or existing saved URL */
  imageUrl: string;
};

const emptyDraft: Draft = {
  name: '',
  price: '',
  categoryKey: '',
  duration: 30,
  imageUrl: '',
};

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function labelForCategory(lang: string, c: PublicCategory): string {
  return c.labelEn || c.labelEs || c.key;
}

export default function ServicesPage() {
  const { language } = useI18n();
  const business = useBusinessStore((state) => state.business);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const services = useServicesStore((state) => state.services);
  const total = useServicesStore((state) => state.total);
  const totalPages = useServicesStore((state) => state.totalPages);
  const hydrate = useServicesStore((state) => state.hydrate);
  const addService = useServicesStore((state) => state.addService);
  const updateService = useServicesStore((state) => state.updateService);
  const deleteService = useServicesStore((state) => state.deleteService);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (business?.id) {
      const timer = setTimeout(() => {
        hydrate(page, itemsPerPage, search, categoryFilter);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [business?.id, page, search, categoryFilter, hydrate]);

  const { data: allCategories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: fetchPublicCategories,
  });

  const allowedCategories = useMemo(() => {
    const active = allCategories.filter((c) => c.active);
    const keys = business?.categoryKeys?.filter(Boolean);
    if (!keys?.length) return active;
    return active.filter((c) => keys.includes(c.key));
  }, [allCategories, business?.categoryKeys]);

  const labelByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of allCategories) {
      m.set(c.key, labelForCategory(language, c));
    }
    return m;
  }, [allCategories, language]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Draft>(emptyDraft);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const modalTitle = useMemo(() => (editing ? 'Edit service' : 'New service'), [editing]);

  const categorySelectOptions = useMemo(() => {
    const base = allowedCategories;
    if (!editing?.category) return base;
    const k = editing.category.trim();
    if (!k || base.some((c) => c.key === k)) return base;
    return [
      ...base,
      {
        id: `legacy-${k}`,
        key: k,
        labelEn: k,
        labelEs: k,
        active: true,
        sortOrder: 9999,
      },
    ];
  }, [allowedCategories, editing]);

  async function submitService(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const priceNum = typeof newService.price === 'number' ? newService.price : Number(newService.price);
    const durationNum =
      typeof newService.duration === 'number' ? newService.duration : Number(newService.duration);
    if (!newService.name.trim() || Number.isNaN(priceNum) || Number.isNaN(durationNum)) {
      toastWarning('Invalid form', 'Please fill all fields with valid numbers.');
      setMessage({ type: 'error', text: 'Please fill all fields with valid numbers.' });
      return;
    }
    if (!newService.categoryKey.trim()) {
      toastWarning('Category required', 'Select a service category (same types as business signup).');
      setMessage({ type: 'error', text: 'Select a service category (same types as business signup).' });
      return;
    }

    try {
      const img = newService.imageUrl.trim();
      const payload = {
        name: newService.name.trim(),
        price: priceNum,
        duration: durationNum,
        category: newService.categoryKey.trim(),
      };
      if (editing) {
        await updateService(editing.id, {
          ...payload,
          imageUrl: img,
        });
      } else {
        await addService({
          ...payload,
          ...(img ? { imageUrl: img } : {}),
        });
      }
      const ok = editing ? 'Service updated.' : 'Service created.';
      setMessage({ type: 'success', text: ok });
      toastSuccess(ok);
      setIsModalOpen(false);
      setEditing(null);
      setNewService(emptyDraft);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed.';
      setMessage({ type: 'error', text: msg });
      toastError('Could not save service', msg);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this service? Bookings linked to it will detach.')) return;
    setMessage(null);
    try {
      await deleteService(id);
      setMessage({ type: 'success', text: 'Service removed.' });
      toastSuccess('Service removed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed.';
      setMessage({ type: 'error', text: msg });
      toastError('Delete failed', msg);
    }
  }

  function openEdit(s: Service) {
    setEditing(s);
    setNewService({
      name: s.name,
      categoryKey: s.category,
      price: s.price,
      duration: s.duration,
      imageUrl: s.imageUrl ?? '',
    });
    setIsModalOpen(true);
  }

  function openCreate() {
    setEditing(null);
    const firstKey = allowedCategories[0]?.key ?? '';
    setNewService({ ...emptyDraft, categoryKey: firstKey });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditing(null);
    setNewService(emptyDraft);
  }

  const [promoModal, setPromoModal] = useState<{ open: boolean; service: Service | null }>({ open: false, service: null });
  const [promoDraft, setPromoDraft] = useState<{ discount: number; label: string; active: boolean; endsAt: string; noExpiry: boolean }>({ 
    discount: 10, 
    label: '', 
    active: true, 
    endsAt: '',
    noExpiry: true
  });

  async function savePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoModal.service || !business?.id) return;
    try {
      const activePromo = (promoModal.service as any).promotions?.[0];
      const payload = {
        discountPercent: promoDraft.discount,
        label: promoDraft.label,
        active: promoDraft.active,
        endsAt: promoDraft.noExpiry ? null : (promoDraft.endsAt ? new Date(promoDraft.endsAt).toISOString() : null)
      };

      if (activePromo) {
        await apiPatch(`/business/${business.id}/promotions/${activePromo.id}`, payload, 'BUSINESS');
      } else {
        await apiPost(`/business/${business.id}/promotions`, {
          serviceId: promoModal.service.id,
          ...payload
        }, 'BUSINESS');
      }
      toastSuccess('Promotion saved');
      setPromoModal({ open: false, service: null });
      hydrate(page, itemsPerPage, search, categoryFilter);
    } catch (err) {
      toastError('Failed to save promotion');
    }
  }

  function openPromo(s: Service) {
    const p = (s as any).promotions?.[0];
    setPromoDraft({
      discount: p?.discountPercent ?? 10,
      label: p?.label ?? '',
      active: p?.active ?? true,
      endsAt: p?.endsAt ? new Date(p.endsAt).toISOString().slice(0, 16) : '',
      noExpiry: !p?.endsAt
    });
    setPromoModal({ open: true, service: s });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Services</h2>
        <button
          type="button"
          onClick={() => openCreate()}
          disabled={allowedCategories.length === 0}
          className="flex items-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="h-4 w-4 mr-2" /> Add service
        </button>
      </div>

      <BusinessFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search services...">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-4 py-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest text-[var(--rz-navy-800)] outline-none">
            <option value="all">All</option>
            {allowedCategories.map((c) => (
              <option key={c.id} value={c.key}>{labelForCategory(language, c)}</option>
            ))}
          </select>
        </div>
      </BusinessFilterToolbar>

      {allowedCategories.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          No categories are configured for your business yet. Ask an admin to set your business categories, or complete signup with at least one category.
        </div>
      ) : null}

      {message ? (
        <div
          className={clsx(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            message.type === 'success' &&
              'border-emerald-200 bg-emerald-50 text-emerald-900',
            message.type === 'error' &&
              'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          {message.text}
        </div>
      ) : null}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#023047]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[var(--rz-gray-050)] flex justify-between items-center relative">
              <h3 className="text-xl font-black text-[var(--rz-navy-800)] uppercase tracking-tight text-center w-full">
                {modalTitle}
              </h3>
              <button
                type="button"
                onClick={() => closeModal()}
                className="absolute right-8 p-2 hover:bg-[var(--rz-gray-050)] rounded-full transition-colors text-[var(--rz-gray-500)]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitService} className="p-10 space-y-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center text-primary overflow-hidden border-2 border-[var(--rz-gray-100)]">
                    {newService.imageUrl ? (
                      <img
                        src={newService.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Scissors size={32} />
                    )}
                  </div>
                  <input
                    id="service-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await readFileAsDataUrl(file);
                        setNewService((prev) => ({ ...prev, imageUrl: dataUrl }));
                      } catch {
                        setMessage({ type: 'error', text: 'Could not read image.' });
                        toastError('Image error', 'Could not read the selected file.');
                      }
                      e.target.value = '';
                    }}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('service-image-upload')?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--rz-navy)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {newService.imageUrl ? 'Change image' : 'Upload image'}
                    </button>
                    {newService.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setNewService((prev) => ({ ...prev, imageUrl: '' }))}
                        className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)] hover:text-rose-600"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">Service details</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 mb-2 block">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    placeholder="e.g. Classic cut"
                    className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 mb-2 block">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={newService.price}
                      onChange={(e) =>
                        setNewService({ ...newService, price: e.target.value === '' ? '' : Number(e.target.value) })
                      }
                      className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 mb-2 block">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min={1}
                      required
                      inputMode="numeric"
                      value={newService.duration}
                      onChange={(e) =>
                        setNewService({ ...newService, duration: Number(e.target.value) })
                      }
                      className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 mb-2 block">
                    Category (signup types)
                  </label>
                  <select
                    required
                    value={newService.categoryKey}
                    onChange={(e) =>
                      setNewService({ ...newService, categoryKey: e.target.value })
                    }
                    className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
                  >
                    <option value="">Select category</option>
                    {categorySelectOptions.map((c) => (
                      <option key={c.id} value={c.key}>
                        {labelForCategory(language, c)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-[var(--rz-navy)] hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-[color:var(--rz-gray-200)]"
              >
                {editing ? 'Save changes' : 'Save service'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-[color:rgba(231,234,239,0.5)] border border-[var(--rz-gray-100)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--rz-gray-050)] border-b border-[var(--rz-gray-100)] text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest">
              <th className="px-8 py-5 w-16">Photo</th>
              <th className="px-8 py-5">Service</th>
              <th className="px-8 py-5">Category</th>
              <th className="px-8 py-5 text-center">Price</th>
              <th className="px-8 py-5 text-center">Duration</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rz-gray-050)] text-sm font-bold">
            {services.map((service: Service) => (
              <tr key={service.id} className="hover:bg-primary/5 transition-all group">
                <td className="px-8 py-6">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Scissors className="h-5 w-5 opacity-60" />
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-[var(--rz-navy)] font-black">
                  {service.name}
                  {(service as any).promotions?.length > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                      <Percent size={10} /> {(service as any).promotions[0].discountPercent}% OFF
                    </span>
                  )}
                </td>
                <td className="px-8 py-6 text-[var(--rz-gray-500)] font-medium">
                  {labelByKey.get(service.category) ?? service.category}
                </td>
                <td className="px-8 py-6 text-center text-emerald-600 font-black">${service.price}</td>
                <td className="px-8 py-6 text-center text-[var(--rz-gray-500)] font-medium">{service.duration} min</td>
                 <td className="px-8 py-6">
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => openPromo(service)}
                      title="Promotions"
                      className="p-3 text-[var(--rz-gray-300)] hover:text-emerald-500 hover:bg-white rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                    >
                      <Tag className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit ${service.name}`}
                      onClick={() => openEdit(service)}
                      className="p-3 text-[var(--rz-gray-300)] hover:text-primary hover:bg-white rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${service.name}`}
                      onClick={() => void onDelete(service.id)}
                      className="p-3 text-[var(--rz-gray-300)] hover:text-red-500 hover:bg-white rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={itemsPerPage}
            onPageChange={setPage}
          />
        </div>
      )}

      {promoModal.open && promoModal.service && (
        <div className="fixed inset-0 bg-[#023047]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[var(--rz-gray-050)] flex justify-between items-center relative">
              <h3 className="text-xl font-black text-[var(--rz-navy-800)] uppercase tracking-tight text-center w-full">
                Promote Service
              </h3>
              <button
                type="button"
                onClick={() => setPromoModal({ open: false, service: null })}
                className="absolute right-8 p-2 hover:bg-[var(--rz-gray-050)] rounded-full transition-colors text-[var(--rz-gray-500)]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={savePromo} className="p-10 space-y-8">
              <div className="space-y-6">
                <p className="text-sm font-bold text-[var(--rz-gray-500)]">
                  Setup a discount for <span className="text-[var(--rz-navy)] font-black">{promoModal.service.name}</span>.
                </p>
                <div>
                  <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 mb-2 block">
                    Discount Percent (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={promoDraft.discount}
                    onChange={(e) => setPromoDraft({ ...promoDraft, discount: Number(e.target.value) })}
                    className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 mb-2 block">
                    Promotion Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Sale"
                    value={promoDraft.label}
                    onChange={(e) => setPromoDraft({ ...promoDraft, label: e.target.value })}
                    className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
                  />
                </div>

                <div className="space-y-4 pt-2">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">
                       Promotion Expiry
                     </label>
                     <div className="flex items-center gap-2">
                       <input 
                        type="checkbox" 
                        id="no-expiry" 
                        checked={promoDraft.noExpiry}
                        onChange={(e) => setPromoDraft({...promoDraft, noExpiry: e.target.checked})}
                        className="w-4 h-4 rounded-md accent-primary"
                       />
                       <label htmlFor="no-expiry" className="text-[10px] font-black text-[var(--rz-gray-600)] uppercase tracking-widest cursor-pointer">No expiry</label>
                     </div>
                   </div>
                   
                   {!promoDraft.noExpiry && (
                     <div className="animate-in slide-in-from-top-2 duration-300">
                        <input
                          type="datetime-local"
                          required={!promoDraft.noExpiry}
                          value={promoDraft.endsAt}
                          onChange={(e) => setPromoDraft({ ...promoDraft, endsAt: e.target.value })}
                          className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
                        />
                        <p className="mt-2 text-[9px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest ml-1 italic">The promotion will automatically stop after this date.</p>
                     </div>
                   )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-emerald-200"
              >
                Save Promotion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
