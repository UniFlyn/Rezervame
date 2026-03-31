'use client';

import { useState } from 'react';
import { useServicesStore, Service } from '../../../store/servicesStore';
import { useStaffStore } from '../../../store/staffStore';
import { Plus, Edit, Trash2, X, Scissors } from 'lucide-react';

export default function ServicesPage() {
  const services = useServicesStore((state) => state.services);
  const addService = useServicesStore((state) => state.addService);
  const deleteService = useServicesStore((state) => state.deleteService);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', category: '', duration: '30' });

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    addService({
      id: `srv-${Date.now()}`,
      name: newService.name,
      price: Number(newService.price),
      category: newService.category,
      duration: Number(newService.duration),
      staff: [] 
    });
    setIsModalOpen(false);
    setNewService({ name: '', price: '', category: '', duration: '30' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Gestión de Servicios</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl flex items-center font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Agregar Servicio
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center relative">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center w-full">Nuevo Servicio</h3>
              <button onClick={() => setIsModalOpen(false)} className="absolute right-8 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddService} className="p-10 space-y-8">
              <div className="flex flex-col items-center space-y-4">
                 <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Scissors size={32} />
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalles del Servicio</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nombre del Servicio</label>
                  <input type="text" required value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} placeholder="e.g. Corte Clásico" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Precio ($)</label>
                    <input type="number" required value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} placeholder="30" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Duración (min)</label>
                    <input type="number" required value={newService.duration} onChange={(e) => setNewService({...newService, duration: e.target.value})} placeholder="30" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Categoría</label>
                  <input type="text" required value={newService.category} onChange={(e) => setNewService({...newService, category: e.target.value})} placeholder="e.g. Cabello" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all" />
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-slate-200">
                Guardar Servicio
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5">Servicio</th>
              <th className="px-8 py-5">Categoría</th>
              <th className="px-8 py-5 text-center">Precio</th>
              <th className="px-8 py-5 text-center">Duración</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-bold">
            {services.map((service: Service) => (
              <tr key={service.id} className="hover:bg-primary/5 transition-all group">
                <td className="px-8 py-6 text-slate-900 font-black">{service.name}</td>
                <td className="px-8 py-6 text-slate-500 font-medium">{service.category}</td>
                <td className="px-8 py-6 text-center text-emerald-600 font-black">${service.price}</td>
                <td className="px-8 py-6 text-center text-slate-400 font-medium">{service.duration} min</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end space-x-2">
                    <button className="p-3 text-slate-300 hover:text-primary hover:bg-white rounded-2xl transition-all shadow-sm group-hover:shadow-md"><Edit className="h-5 w-5" /></button>
                    <button onClick={() => deleteService(service.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-white rounded-2xl transition-all shadow-sm group-hover:shadow-md"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
