'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useStaffStore, type Staff } from '../../../store/staffStore';
import { useBusinessStore } from '../../../store/businessStore';
import { apiGet } from '@/lib/api';
import { Plus, Edit, Trash2, X, Clock, LayoutGrid, List, Camera, Menu, LayoutDashboard, Settings, Calendar, Star, Users } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';
import { StaffAvailabilityPicker } from '../../../components/business/StaffAvailabilityPicker';
import { formatAvailabilityDisplay, serializeWeekly, staffPhotoSrc } from '@/lib/staffAvailability';
import { compressImageFile } from '@/lib/compressImage';
import {
  formatSpecialistTypes,
  parseSpecialistTypes,
  STAFF_SPECIALIST_OPTIONS,
} from '@/lib/staffSpecialists';
import clsx from 'clsx';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';

type Draft = {
  name: string;
  specialistTypes: string[];
  availability: string;
  image: string;
  serviceIds: string[];
  bio: string;
  experienceYears: number;
};
/** Default Mon–Fri weekly pattern (JSON) so create passes API validation. */
const emptyDraft: Draft = {
  name: '',
  specialistTypes: [],
  availability: serializeWeekly([1, 2, 3, 4, 5]),
  image: '',
  serviceIds: [],
  bio: '',
  experienceYears: 0,
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
  const [specialistFilter, setSpecialistFilter] = useState<string>('all');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (business?.id) {
      const timer = setTimeout(() => {
        hydrate(page, itemsPerPage, search, specialistFilter);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [business?.id, page, search, specialistFilter, hydrate]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const staffPhotoInputId = 'staff-photo-file-input';

  useEffect(() => {
    if (!business?.id) {
      setBizServices([]);
      return;
    }
    void apiGet<Array<{ id: string; name: string }>>(`/business/${business.id}/services`, 'BUSINESS')
      .then((rows) => setBizServices(Array.isArray(rows) ? rows : []))
      .catch(() => setBizServices([]));
  }, [business?.id]);

  const specialistFilterOptions = useMemo(() => {
    const fromStaff = staff.flatMap((s) => parseSpecialistTypes(s.role, s.skills));
    return ['all', ...Array.from(new Set([...STAFF_SPECIALIST_OPTIONS, ...fromStaff]))];
  }, [staff]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastWarning('Invalid file', 'Please choose a JPG, PNG, or WebP image.');
      return;
    }
    setPhotoUploading(true);
    void compressImageFile(file, { maxWidth: 512, maxHeight: 512, maxBytes: 280_000 })
      .then((image) => {
        setDraft((m) => ({ ...m, image }));
        toastSuccess('Photo ready', 'Save changes to apply this photo to the staff profile.');
      })
      .catch((err) => {
        toastError(
          'Photo upload failed',
          err instanceof Error ? err.message : 'Try a smaller image.',
        );
      })
      .finally(() => setPhotoUploading(false));
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
      specialistTypes: parseSpecialistTypes(member.role, member.skills),
      availability: member.availability,
      image: member.image || '',
      serviceIds: Array.isArray(member.serviceIds) ? [...member.serviceIds] : [],
      bio: member.bio || '',
      experienceYears: member.experienceYears || 0,
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

  const toggleSpecialistType = (type: string) => {
    setDraft((d) => ({
      ...d,
      specialistTypes: d.specialistTypes.includes(type)
        ? d.specialistTypes.filter((x) => x !== type)
        : [...d.specialistTypes, type],
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
    if (!draft.name.trim() || draft.specialistTypes.length === 0) {
      toastWarning('Missing fields', 'Enter a name and select at least one specialist type.');
      return;
    }
    const roleLabel = formatSpecialistTypes(draft.specialistTypes);
    try {
      if (editingId) {
        await updateStaff(editingId, {
          name: draft.name,
          role: roleLabel,
          availability: draft.availability,
          image: draft.image.trim() ? draft.image : null,
          skills: [...draft.specialistTypes],
          serviceIds: draft.serviceIds,
          bio: draft.bio,
          experienceYears: draft.experienceYears,
        });
        setMessage({ type: 'success', text: 'Staff member updated.' });
        toastSuccess('Staff member updated');
      } else {
        await addStaff({
          name: draft.name,
          role: roleLabel,
          availability: draft.availability,
          ...(draft.image.trim() ? { image: draft.image } : {}),
          skills: [...draft.specialistTypes],
          serviceIds: draft.serviceIds,
          bio: draft.bio,
          experienceYears: draft.experienceYears,
        } as any);
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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 md:text-3xl">Staff management</h2>
          <p className="mt-0.5 text-sm text-[var(--rz-gray-500)] font-medium">Manage your team members and their schedules.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl bg-[var(--rz-gray-100)] p-1.5">
            <button type="button" onClick={() => setViewMode('grid')} className={clsx('flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'grid' ? 'bg-white text-[var(--rz-navy)] shadow-md' : 'text-[var(--rz-gray-500)]')}>
              <LayoutGrid size={14} /> Grid
            </button>
            <button type="button" onClick={() => setViewMode('list')} className={clsx('flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'list' ? 'bg-white text-[var(--rz-navy)] shadow-md' : 'text-[var(--rz-gray-500)]')}>
              <List size={14} /> List
            </button>
          </div>
          <button type="button" onClick={openCreate} className="flex items-center rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-dark">
            <Plus className="mr-2 h-4 w-4" /> Add staff
          </button>
        </div>
      </div>

      {message && <div className={clsx('rounded-2xl border px-4 py-3 text-sm font-semibold', message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900')}>{message.text}</div>}

      <BusinessFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, specialist...">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-4 py-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Specialist</label>
          <select
            value={specialistFilter}
            onChange={(e) => setSpecialistFilter(e.target.value)}
            className="max-w-[180px] cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest text-[var(--rz-navy-800)] outline-none"
          >
            {specialistFilterOptions.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All specialists' : r}
              </option>
            ))}
          </select>
        </div>
      </BusinessFilterToolbar>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-[#023047]/60 p-4 backdrop-blur-md fade-in duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[40px] bg-white shadow-2xl duration-300">
            <div className="relative flex items-center justify-between border-b border-[var(--rz-gray-050)] p-8">
              <h3 className="w-full text-center text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">{editingId ? 'Edit staff member' : 'New staff member'}</h3>
              <button type="button" onClick={closeModal} className="absolute right-8 rounded-full p-2 text-[var(--rz-gray-500)] transition-colors hover:bg-[var(--rz-gray-050)]"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-8 p-10">
              <input
                ref={fileInputRef}
                id={staffPhotoInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="sr-only"
                onChange={onPickFile}
                disabled={photoUploading}
              />
              <div className="flex flex-col items-center space-y-3">
                <label
                  htmlFor={staffPhotoInputId}
                  className={clsx(
                    'group relative flex h-28 w-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--rz-gray-200)] bg-[var(--rz-gray-050)] shadow-inner transition-all hover:border-primary/30 hover:bg-primary/5',
                    photoUploading && 'pointer-events-none opacity-60',
                  )}
                >
                  <img
                    src={staffPhotoSrc(draft.name, draft.image)}
                    alt={draft.name ? `${draft.name} photo` : 'Staff photo'}
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-[#023047]/0 text-white opacity-0 transition-all group-hover:bg-[#023047]/40 group-hover:opacity-100">
                    <Camera className="h-6 w-6" />
                    <span className="mt-1 text-[8px] font-black uppercase tracking-widest">
                      {photoUploading ? 'Processing…' : 'Change'}
                    </span>
                  </span>
                </label>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <label
                    htmlFor={staffPhotoInputId}
                    className={clsx(
                      'inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--rz-navy)] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary',
                      photoUploading && 'pointer-events-none opacity-60',
                    )}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {photoUploading ? 'Processing…' : draft.image ? 'Replace photo' : 'Upload photo'}
                  </label>
                  {draft.image ? (
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, image: '' }))}
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)] hover:text-rose-600"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="space-y-6">
                <div><label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Full name</label><input type="text" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none" /></div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                    Specialist
                  </label>
                  <p className="mb-3 text-[11px] font-semibold text-[var(--rz-gray-500)]">
                    Choose specialist type(s) from the list — select all that apply.
                  </p>
                  <select
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) toggleSpecialistType(v);
                    }}
                    className="mb-3 w-full cursor-pointer rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-4 py-3 text-sm font-bold text-[var(--rz-navy-800)] outline-none focus:border-primary focus:bg-white"
                  >
                    <option value="">Add specialist from dropdown…</option>
                    {STAFF_SPECIALIST_OPTIONS.filter((t) => !draft.specialistTypes.includes(t)).map(
                      (type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ),
                    )}
                  </select>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-3">
                    {STAFF_SPECIALIST_OPTIONS.map((type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm font-bold text-[var(--rz-navy-800)] hover:bg-white"
                      >
                        <input
                          type="checkbox"
                          checked={draft.specialistTypes.includes(type)}
                          onChange={() => toggleSpecialistType(type)}
                          className="h-4 w-4 rounded border-[var(--rz-gray-300)] text-primary focus:ring-primary"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div><label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Years of Experience</label><input type="number" value={draft.experienceYears} onChange={(e) => setDraft({ ...draft, experienceYears: parseInt(e.target.value) || 0 })} className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none" /></div>
                <div><label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Professional Bio</label><textarea rows={3} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Tell us about their background..." className="w-full rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none" /></div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                    Availability
                  </label>
                  <StaffAvailabilityPicker
                    value={draft.availability}
                    onChange={(availability) => setDraft((d) => ({ ...d, availability }))}
                  />
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                    Services performed
                  </label>
                  <p className="mb-3 text-[11px] font-semibold text-[var(--rz-gray-500)]">
                    Select which catalog services this person offers. Leave none selected to allow any service at booking.
                  </p>
                  {bizServices.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[var(--rz-gray-200)] bg-[var(--rz-gray-050)] px-4 py-3 text-xs font-semibold text-[var(--rz-gray-500)]">
                      Add services under Services first to tag staff by service.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-3">
                      {bizServices.map((svc) => (
                        <label
                          key={svc.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm font-bold text-[var(--rz-navy-800)] hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={draft.serviceIds.includes(svc.id)}
                            onChange={() => toggleDraftService(svc.id)}
                            className="h-4 w-4 rounded border-[var(--rz-gray-300)] text-primary focus:ring-primary"
                          />
                          <span>{svc.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={photoUploading}
                className="w-full rounded-2xl bg-[var(--rz-navy)] py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[color:var(--rz-gray-200)] transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? 'Save changes' : 'Create member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div key={member.id} className="group relative rounded-[40px] border border-[var(--rz-gray-100)] bg-white p-8 shadow-xl shadow-[color:rgba(231,234,239,0.5)] transition-all hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute right-6 top-6 flex space-x-1">
                <button type="button" onClick={() => openEdit(member)} className="rounded-2xl p-2 text-[var(--rz-gray-500)] transition-all hover:bg-primary/5 hover:text-primary"><Edit className="h-5 w-5" /></button>
                <button type="button" onClick={() => void remove(member.id)} className="rounded-2xl p-2 text-[var(--rz-gray-500)] transition-all hover:bg-red-50 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
              </div>
              <div className="mb-8 flex items-center space-x-6">
                <div className="flex h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] shadow-inner">
                  <img
                    src={staffPhotoSrc(member.name, member.image)}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-[var(--rz-navy)]">{member.name}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">{member.role}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={clsx("h-3 w-3", i < Math.round(member.rating || 0) ? "fill-amber-400 text-amber-400" : "text-[var(--rz-gray-200)]")} />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-[var(--rz-gray-700)]">{member.rating || 0}</span>
                    <span className="text-[10px] font-bold text-[var(--rz-gray-500)]">({member.reviews || 0})</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center rounded-2xl bg-[var(--rz-gray-050)] p-4 text-xs font-bold text-[var(--rz-gray-500)]">
                    <Clock className="mr-3 h-4 w-4 shrink-0 text-[var(--rz-gray-500)]" />
                    {formatAvailabilityDisplay(member.availability)}
                  </div>
                  <div className="flex items-center rounded-2xl bg-[var(--rz-gray-050)] p-4 text-xs font-bold text-[var(--rz-gray-500)]">
                    <Users className="mr-3 h-4 w-4 shrink-0 text-[var(--rz-gray-500)]" />
                    {member.clients || 0} {member.clients === 1 ? 'Client' : 'Clients'}
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                  {member.serviceIds?.length
                    ? `${member.serviceIds.length} service${member.serviceIds.length === 1 ? '' : 's'} on profile`
                    : 'All services (not restricted)'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-[var(--rz-gray-100)] bg-white shadow-xl shadow-[color:rgba(231,234,239,0.5)]">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[var(--rz-gray-050)] bg-[var(--rz-gray-050)] text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]"><th className="px-8 py-5">Professional</th><th className="px-8 py-5">Specialist</th><th className="px-8 py-5">Availability</th><th className="px-8 py-5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-[var(--rz-gray-050)] text-sm font-bold">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-primary/5">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[var(--rz-gray-050)]">
                        <img
                          src={staffPhotoSrc(member.name, member.image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-black text-[var(--rz-navy)]">{member.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-black text-[var(--rz-gray-600)]">{member.rating || 0}</span>
                          <span className="text-[10px] font-bold text-[var(--rz-gray-500)] ml-1">({member.reviews || 0} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-primary">{member.role}</td>
                  <td className="px-8 py-5 text-[var(--rz-gray-500)]">{formatAvailabilityDisplay(member.availability)}</td>
                  <td className="px-8 py-5 text-right"><button type="button" onClick={() => openEdit(member)} className="rounded-xl p-2 text-[var(--rz-gray-300)] hover:bg-[var(--rz-gray-100)] hover:text-[var(--rz-gray-700)]"><Edit className="h-5 w-5" /></button><button type="button" onClick={() => void remove(member.id)} className="rounded-xl p-2 text-[var(--rz-gray-300)] hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-5 w-5" /></button></td>
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
