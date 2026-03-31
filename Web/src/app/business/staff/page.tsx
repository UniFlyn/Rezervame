'use client';

import { useState } from 'react';
import { useStaffStore } from '../../../store/staffStore';
import { Plus, Edit, Trash2, X, User, Clock } from 'lucide-react';

export default function StaffPage() {
  const staff = useStaffStore((state) => state.staff);
  const addStaff = useStaffStore((state) => state.addStaff);
  const deleteStaff = useStaffStore((state) => state.deleteStaff);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', availability: '', image: '' });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    addStaff({
      id: `staff-${Date.now()}`,
      ...newMember,
      skills: []
    });
    setIsModalOpen(false);
    setNewMember({ name: '', role: '', availability: '', image: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Gestión de Staff</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl flex items-center font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Agregar Staff
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center relative">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center w-full">Nuevo Profesional</h3>
              <button onClick={() => setIsModalOpen(false)} className="absolute right-8 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-10 space-y-8">
              <div className="flex flex-col items-center space-y-4">
                 <div className="w-24 h-24 bg-slate-50 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all group overflow-hidden relative shadow-inner">
                    {newMember.image ? (
                        <img src={newMember.image} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                        <>
                            <User size={32} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest mt-2">Foto</span>
                        </>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">URL de la Foto (Opcional)</label>
                  <input type="url" value={newMember.image} onChange={(e) => setNewMember({...newMember, image: e.target.value})} placeholder="https://..." className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all placeholder:text-slate-300" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nombre Completo</label>
                  <input type="text" required value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Cargo / Especialidad</label>
                  <input type="text" required value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Disponibilidad</label>
                  <input type="text" required value={newMember.availability} onChange={(e) => setNewMember({...newMember, availability: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-slate-200">
                Registrar Miembro
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative group transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute top-6 right-6 flex space-x-1">
              <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"><Edit className="h-5 w-5" /></button>
              <button onClick={() => deleteStaff(member.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="h-5 w-5" /></button>
            </div>
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-20 h-20 bg-slate-50 text-slate-800 rounded-3xl flex items-center justify-center font-black text-2xl shadow-inner border border-slate-100 overflow-hidden">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{member.name}</h3>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{member.role}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl">
                <Clock className="h-4 w-4 mr-3 text-slate-400" />
                {member.availability}
              </div>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
