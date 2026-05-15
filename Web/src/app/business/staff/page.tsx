'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStaffStore, type Staff } from '../../../store/staffStore';
import { useBusinessStore } from '../../../store/businessStore';
import { apiGet } from '@/lib/api';
import { Plus, Edit, Trash2, X, Clock, LayoutGrid, List, Camera } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';
import { StaffAvailabilityPicker } from '../../../components/business/StaffAvailabilityPicker';
import { formatAvailabilityDisplay, serializeWeekly, staffPhotoSrc } from '@/lib/staffAvailability';
import clsx from 'clsx';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';

type Draft = { name: string; role: string; availability: string; image: string; serviceIds: string[] };
/** Default Mon–Fri weekly pattern (JSON) so create passes API validation. */
const emptyDraft: Draft = {
  name: '',
  role: '',
  availability: serializeWeekly([1, 2, 3, 4, 5]),
  image: '',
  serviceIds: [],
};

export default function StaffPage() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  
  const staff = useStaffStore((state) => state.staff);
  const total = useStaffStore((state) => state.total);
  const totalPages = useStaffStore((state) => state.totalPages);
  const hydrate = useStaffStore((state) => state.hydrate);
  const addStaff = useStaffStore((state) => state.addStaff);
  const updateStaff = useStaffStore((state) => state.updateStaff);
  const deleteStaff = useStaffStore((state) => state.deleteStaff);
  const business = useBusinessStore((state) => state.business);

  const [bizServices, setBizServices] = useState<{ id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (business?.id) {
      const timer = setTimeout(() => {
        hydrate(page, itemsPerPage, search, roleFilter);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [business?.id, page, search, roleFilter, hydrate]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!business?.id) {
      setBizServices([]);
      return;
    }
    void apiGet<Array<{ id: string; name: string }>>(`/business/${business.id}/services`, 'BUSINESS')
      .then((rows) => setBizServices(Array.isArray(rows) ? rows : []))
      .catch(() => setBizServices([]));
  }, [business?.id]);

  const roles = useMemo(() => ['all', ...Array.from(new Set(staff.map((s) => s.role)))], [staff]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const image = reader.result;
        setDraft((m) => ({ ...m, image }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setIsModalOpen(true);
  };

  const openEdit = (member: Staff) => {
    setEditingId(member.id);
    setDraft({
      name: member.name,
      role: member.role,
      availability: member.availability,
      image: member.image || '',
      serviceIds: Array.isArray(member.serviceIds) ? [...member.serviceIds] : [],
    });
    setIsModalOpen(true);
  };

  const toggleDraftService = (serviceId: string) => {
    setDraft((d) => ({
      ...d,
      serviceIds: d.serviceIds.includes(serviceId)
        ? d.serviceIds.filter((x) => x !== serviceId)
        : [...d.serviceIds, serviceId],
    }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!draft.name.trim() || !draft.role.trim()) {
      toastWarning('Missing fields', 'Enter a name and role for this staff member.');
      return;
    }
    try {
      if (editingId) {
        const existing = staff.find((s) => s.id === editingId);
        await updateStaff(editingId, {
          name: draft.name,
          role: draft.role,
          availability: draft.availability,
          image: draft.image.trim() ? draft.image : null,
          skills: existing?.skills ?? [],
          serviceIds: draft.serviceIds,
        });
        setMessage({ type: 'success', text: 'Staff member updated.' });
        toastSuccess('Staff member updated');
      } else {
        await addStaff({
          name: draft.name,
          role: draft.role,
          availability: draft.availability,
          ...(draft.image.trim() ? { image: draft.image } : {}),
          skills: [],
          serviceIds: draft.serviceIds,
        });
        setMessage({ type: 'success', text: 'Staff member created.' });
        toastSuccess('Staff member created');
      }
      closeModal();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Request failed.';
      setMessage({ type: 'error', text: msg });
      toastError('Could not save staff', msg);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this staff member?')) return;
    setMessage(null);
    try {
      await deleteStaff(id);
      setMessage({ type: 'success', text: 'Staff member deleted.' });
      toastSuccess('Staff member deleted');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Delete failed.';
      setMessage({ type: 'error', text: msg });
      toastError('Delete failed', msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Staff management</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl bg-slate-100 p-1.5">
            <button type="button" onClick={() => setViewMode('grid')} className={clsx('flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'grid' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400')}>
              <LayoutGrid size={14} /> Grid
            </button>
            <button type="button" onClick={() => setViewMode('list')} className={clsx('flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'list' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400')}>
              <List size={14} /> List
            </button>
          </div>
          <button type="button" onClick={openCreate} className="flex items-center rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-dark">
            <Plus className="mr-2 h-4 w-4" /> Add staff
          </button>
        </div>
      </div>

      {message && <div className={clsx('rounded-2xl border px-4 py-3 text-sm font-semibold', message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900')}>{message.text}</div>}

      <BusinessFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, role...">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none">
            {roles.map((r) => (
              <option key={r} value={r}>{r === 'all' ? 'All' : r}</option>
            ))}
          </select>
        </div>
      </BusinessFilterToolbar>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md fade-in duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[40px] bg-white shadow-2xl duration-300">
            <div className="relative flex items-center justify-between border-b border-slate-50 p-8">
              <h3 className="w-full text-center text-xl font-black uppercase tracking-tight text-slate-800">{editingId ? 'Edit staff member' : 'New staff member'}</h3>
              <button type="button" onClick={closeModal} className="absolute right-8 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-8 p-10">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
              <div className="flex flex-col items-center space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex h-28 w-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-200 bg-slate-50 shadow-inner transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <img
                    src={staffPhotoSrc(draft.name, draft.image)}
                    alt={draft.name ? `${draft.name} photo` : 'Staff photo'}
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-slate-900/0 text-white opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100">
                    <Camera className="h-6 w-6" />
                    <span className="mt-1 text-[8px] font-black uppercase tracking-widest">Change</span>
                  </span>
                </button>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {draft.image ? 'Replace photo' : 'Upload photo'}
                  </button>
                  {draft.image ? (
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, image: '' }))}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="space-y-6">
                <div><label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Full name</label><input type="text" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none" /></div>
                <div><label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Role / specialty</label><input type="text" required value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none" /></div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Availability
                  </label>
                  <StaffAvailabilityPicker
                    value={draft.availability}
                    onChange={(availability) => setDraft((d) => ({ ...d, availability }))}
                  />
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Services performed
                  </label>
                  <p className="mb-3 text-[11px] font-semibold text-slate-500">
                    Select which catalog services this person offers. Leave none selected to allow any service at booking.
                  </p>
                  {bizServices.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400">
                      Add services under Services first to tag staff by service.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      {bizServices.map((svc) => (
                        <label
                          key={svc.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm font-bold text-slate-800 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={draft.serviceIds.includes(svc.id)}
                            onChange={() => toggleDraftService(svc.id)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span>{svc.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full rounded-2xl bg-slate-900 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-primary">{editingId ? 'Save changes' : 'Create member'}</button>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div key={member.id} className="group relative rounded-[40px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute right-6 top-6 flex space-x-1">
                <button type="button" onClick={() => openEdit(member)} className="rounded-2xl p-2 text-slate-400 transition-all hover:bg-primary/5 hover:text-primary"><Edit className="h-5 w-5" /></button>
                <button type="button" onClick={() => void remove(member.id)} className="rounded-2xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
              </div>
              <div className="mb-8 flex items-center space-x-6">
                <div className="flex h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-inner">
                  <img
                    src={staffPhotoSrc(member.name, member.image)}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div><h3 className="text-xl font-black uppercase leading-tight tracking-tight text-slate-900">{member.name}</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">{member.role}</p></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-500">
                  <Clock className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
                  {formatAvailabilityDisplay(member.availability)}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {member.serviceIds?.length
                    ? `${member.serviceIds.length} service${member.serviceIds.length === 1 ? '' : 's'} on profile`
                    : 'All services (not restricted)'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-slate-50 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400"><th className="px-8 py-5">Professional</th><th className="px-8 py-5">Role</th><th className="px-8 py-5">Availability</th><th className="px-8 py-5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-primary/5">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-50">
                        <img
                          src={staffPhotoSrc(member.name, member.image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="font-black text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-primary">{member.role}</td>
                  <td className="px-8 py-5 text-slate-500">{formatAvailabilityDisplay(member.availability)}</td>
                  <td className="px-8 py-5 text-right"><button type="button" onClick={() => openEdit(member)} className="rounded-xl p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-700"><Edit className="h-5 w-5" /></button><button type="button" onClick={() => void remove(member.id)} className="rounded-xl p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-5 w-5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    </div>
  );
}
