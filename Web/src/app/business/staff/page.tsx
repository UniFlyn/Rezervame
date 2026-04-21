'use client';

import { useMemo, useRef, useState } from 'react';
import { useStaffStore } from '../../../store/staffStore';
import { Plus, Edit, Trash2, X, User, Clock, LayoutGrid, List } from 'lucide-react';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';
import clsx from 'clsx';

export default function StaffPage() {
  const staff = useStaffStore((state) => state.staff);
  const addStaff = useStaffStore((state) => state.addStaff);
  const deleteStaff = useStaffStore((state) => state.deleteStaff);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [newMember, setNewMember] = useState({ name: '', role: '', availability: '', image: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roles = useMemo(() => {
    const r = new Set(staff.map((s) => s.role));
    return ['all', ...Array.from(r)];
  }, [staff]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.availability.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || s.role === roleFilter;
      return matchQ && matchRole;
    });
  }, [staff, search, roleFilter]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewMember((m) => ({ ...m, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    addStaff({
      id: `staff-${Date.now()}`,
      ...newMember,
      skills: [],
    });
    setIsModalOpen(false);
    setNewMember({ name: '', role: '', availability: '', image: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Gestión de staff</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400',
              )}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400',
              )}
            >
              <List size={14} /> Lista
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-dark"
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar staff
          </button>
        </div>
      </div>

      <BusinessFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar por nombre, rol…">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'Todos' : r}
              </option>
            ))}
          </select>
        </div>
      </BusinessFilterToolbar>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md fade-in duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-md overflow-hidden rounded-[40px] bg-white shadow-2xl duration-300">
            <div className="relative flex items-center justify-between border-b border-slate-50 p-8">
              <h3 className="w-full text-center text-xl font-black uppercase tracking-tight text-slate-800">
                Nuevo profesional
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-8 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-8 p-10">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

              <div className="flex flex-col items-center space-y-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300 shadow-inner transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  {newMember.image ? (
                    <img src={newMember.image} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <>
                      <User size={32} className="transition-transform group-hover:scale-110" />
                      <span className="mt-2 text-[8px] font-black uppercase tracking-widest">Foto</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] font-bold text-slate-400">Toca para subir desde tu dispositivo</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cargo / especialidad
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Disponibilidad
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.availability}
                    onChange={(e) => setNewMember({ ...newMember, availability: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 font-bold transition-all focus:border-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-900 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-primary"
              >
                Registrar miembro
              </button>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="group relative rounded-[40px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="absolute right-6 top-6 flex space-x-1">
                <button
                  type="button"
                  className="rounded-2xl p-2 text-slate-400 transition-all hover:bg-primary/5 hover:text-primary"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteStaff(member.id)}
                  className="rounded-2xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-8 flex items-center space-x-6">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 text-2xl font-black text-slate-800 shadow-inner">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-slate-900">{member.name}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">{member.role}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-500">
                  <Clock className="mr-3 h-4 w-4 text-slate-400" />
                  {member.availability}
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((s: string) => (
                    <span
                      key={s}
                      className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Profesional</th>
                <th className="px-8 py-5">Rol</th>
                <th className="px-8 py-5">Disponibilidad</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-primary/5">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 font-black text-slate-700">
                        {member.image ? (
                          <img src={member.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <span className="font-black text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-primary">{member.role}</td>
                  <td className="px-8 py-5 text-slate-500">{member.availability}</td>
                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => deleteStaff(member.id)}
                      className="rounded-xl p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
