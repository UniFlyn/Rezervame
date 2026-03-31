'use client';

import { useState } from 'react';
import { useBookingsStore, Booking } from '../../../store/bookingsStore';
import { useServicesStore } from '../../../store/servicesStore';
import { useStaffStore, Staff } from '../../../store/staffStore';
import { Eye, X, Mail, Phone, MapPin, Calendar, Clock, CreditCard, ChevronRight } from 'lucide-react';

export default function UsersPage() {
  const bookings = useBookingsStore((state) => state.bookings);
  const services = useServicesStore((state) => state.services);
  const staffMembers = useStaffStore((state) => state.staff);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Extract unique customers from bookings
  const customers = Array.from(new Set(bookings.map(b => b.userId))).map(id => {
    const userBookings = bookings.filter(b => b.userId === id);
    return {
      id,
      name: userBookings[0].customerName,
      totalSpent: userBookings.reduce((sum, b) => sum + (b.price || 0), 0),
      bookingsCount: userBookings.length,
      lastVisit: new Date(Math.max(...userBookings.map(b => new Date(b.date).getTime()))).toLocaleDateString(),
      // Mocked detailed info
      email: `${userBookings[0].customerName.toLowerCase().replace(' ', '.')}@example.com`,
      phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      location: 'New York, USA',
      joinedDate: 'Jan 2024'
    };
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedUserBookings = bookings.filter(b => b.userId === selectedCustomerId);

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Unknown Service';
  const getStaffName = (id: string) => staffMembers.find((s: Staff) => s.id === id)?.name || 'Unknown Staff';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Directorio de Clientes</h2>
      </div>
      
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5">Nombre del Cliente</th>
              <th className="px-8 py-5 text-center">Citas Totales</th>
              <th className="px-8 py-5 text-center">Gasto Total</th>
              <th className="px-8 py-5 text-center">Última Visita</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-bold">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-primary/5 transition-all group">
                <td className="px-8 py-6 text-slate-800 flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black transition-all group-hover:bg-primary hover:scale-110">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <span className="block">{customer.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">ID: {customer.id}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center text-slate-600">
                  <span className="bg-slate-100 px-3 py-1 rounded-full">{customer.bookingsCount}</span>
                </td>
                <td className="px-8 py-6 text-center text-emerald-600 font-black">${customer.totalSpent}</td>
                <td className="px-8 py-6 text-center text-slate-400 font-medium">{customer.lastVisit}</td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="bg-slate-50 hover:bg-primary hover:text-white p-3 rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedCustomerId && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedCustomerId(null)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedCustomer.name}</h3>
                  <div className="flex space-x-3 mt-1">
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Miembro Premium</span>
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Activo</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomerId(null)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary shadow-sm hover:shadow-md transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {/* Profile Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto Directo</p>
                    <div className="flex items-center space-x-3 text-slate-800 font-bold">
                       <Mail size={16} className="text-primary" />
                       <span className="text-sm">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-800 font-bold">
                       <Phone size={16} className="text-primary" />
                       <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vistas Totales</p>
                    <div className="flex items-baseline space-x-2">
                       <span className="text-4xl font-black text-slate-900">{selectedCustomer.bookingsCount}</span>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Citas Registradas</span>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Total</p>
                    <div className="flex items-baseline space-x-2">
                       <span className="text-4xl font-black text-emerald-600">${selectedCustomer.totalSpent}</span>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dólares</span>
                    </div>
                 </div>
              </div>

              {/* Booking History */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Historial de Citas</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citas en este establecimiento</span>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/20">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5 text-center">Fecha</th>
                        <th className="px-8 py-5">Servicio</th>
                        <th className="px-8 py-5">Profesional</th>
                        <th className="px-8 py-5 text-center">Estado</th>
                        <th className="px-8 py-5 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {selectedUserBookings.map((b: Booking) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-5 text-center">
                            <span className="text-slate-800 font-black block">{new Date(b.date).toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="px-8 py-5 font-black text-slate-900">{getServiceName(b.serviceId)}</td>
                          <td className="px-8 py-5 font-bold text-slate-600">{getStaffName(b.staffId)}</td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              b.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                              b.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                              b.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-900">${b.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
               <button 
                onClick={() => setSelectedCustomerId(null)}
                className="px-8 py-4 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg"
               >
                 Cerrar Expediente
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
