'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useBookingsStore, Booking } from '../../../store/bookingsStore';
import { useServicesStore, Service } from '../../../store/servicesStore';
import { useStaffStore, Staff } from '../../../store/staffStore';
import { Calendar as CalendarIcon, List as ListIcon, Check, X, Clock, User, Scissors, Plus, Search } from 'lucide-react';
import clsx from 'clsx';

export default function AppointmentsPage() {
  const bookings = useBookingsStore((state) => state.bookings);
  const services = useServicesStore((state) => state.services);
  const staff = useStaffStore((state) => state.staff);
  const updateBookingStatus = useBookingsStore((state) => state.updateBookingStatus);
  const addBooking = useBookingsStore((state) => state.addBooking);

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customerName: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '10:00'
  });

  // Extract unique existing customers for suggestions
  const existingCustomers = Array.from(new Set(bookings.map(b => b.customerName)));

  const events = bookings.map((b: Booking) => {
    const s = services.find((serv: Service) => serv.id === b.serviceId);
    return {
      id: b.id,
      title: `${b.customerName} - ${s?.name || 'Servicio'}`,
      date: b.date,
      backgroundColor: b.status === 'Approved' ? '#ff5a5f' : b.status === 'Pending' ? '#f59e0b' : '#94a3b8',
      borderColor: 'transparent',
      extendedProps: b
    }
  });

  const getServiceName = (id: string) => services.find((s: Service) => s.id === id)?.name || 'Desconocido';
  const getStaffName = (id: string) => staff.find((s: Staff) => s.id === id)?.name || 'Sin Asignar';

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const service = services.find(s => s.id === newAppointment.serviceId);
    
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      userId: 'offline-user', // For locally added ones
      customerName: newAppointment.customerName,
      serviceId: newAppointment.serviceId,
      staffId: newAppointment.staffId,
      date: `${newAppointment.date}T${newAppointment.time}:00Z`,
      status: 'Approved', // Auto-approved when added by the business
      price: service?.price || 0
    };

    addBooking(booking);
    setIsModalOpen(false);
    setNewAppointment({ customerName: '', serviceId: '', staffId: '', date: '', time: '10:00' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Agenda de Citas</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestiona tus reservas y horarios</p>
        </div>

        <div className="flex items-center space-x-4">
          <button 
             onClick={() => setIsModalOpen(true)}
             className="px-8 py-3 bg-slate-900 text-white rounded-2xl flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-200"
          >
             <Plus size={16} /> <span>Nueva Cita</span>
          </button>
          
          <div className="bg-slate-100 p-1.5 rounded-2xl flex self-start">
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`px-6 py-2 rounded-xl transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'calendar' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <CalendarIcon size={14} /> <span>Calendario</span>
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-6 py-2 rounded-xl transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon size={14} /> <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nueva Cita</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Agrega una reserva manualmente</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={20}/></button>
              </div>

              <form onSubmit={handleAddAppointment} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cliente</label>
                    <div className="relative">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input 
                          type="text" 
                          list="customer-suggestions"
                          placeholder="Nombre del cliente..." 
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 pl-14 font-bold text-slate-800 transition-all focus:bg-white focus:border-primary outline-none"
                          value={newAppointment.customerName}
                          onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                          required
                       />
                       <datalist id="customer-suggestions">
                          {existingCustomers.map(c => <option key={c} value={c} />)}
                       </datalist>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Servicio</label>
                       <select 
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold text-slate-800 transition-all focus:bg-white focus:border-primary outline-none"
                          value={newAppointment.serviceId}
                          onChange={(e) => setNewAppointment({ ...newAppointment, serviceId: e.target.value })}
                          required
                       >
                          <option value="">Seleccionar...</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Staff</label>
                       <select 
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold text-slate-800 transition-all focus:bg-white focus:border-primary outline-none"
                          value={newAppointment.staffId}
                          onChange={(e) => setNewAppointment({ ...newAppointment, staffId: e.target.value })}
                          required
                       >
                          <option value="">Asignar...</option>
                          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha</label>
                       <input 
                          type="date" 
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold text-slate-800 transition-all focus:bg-white focus:border-primary outline-none"
                          value={newAppointment.date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                          required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hora</label>
                       <input 
                          type="time" 
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold text-slate-800 transition-all focus:bg-white focus:border-primary outline-none"
                          value={newAppointment.time}
                          onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                          required
                       />
                    </div>
                 </div>

                 <div className="pt-6">
                    <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-2xl shadow-slate-200">
                       Confirmar Reservación
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {viewMode === 'calendar' ? (
          <div className="p-8 h-[700px] calendar-premium text-slate-900">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="es"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              height="100%"
              eventClick={(info) => {
                alert(`Cita: ${info.event.title}\nEstado: ${info.event.extendedProps.status}`);
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Servicio</th>
                  <th className="px-8 py-5">Staff</th>
                  <th className="px-8 py-5 text-center">Horario</th>
                  <th className="px-8 py-5 text-center">Estado</th>
                  <th className="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold">
                {bookings.map((booking: Booking) => (
                  <tr key={booking.id} className="hover:bg-primary/5 transition-all group">
                    <td className="px-8 py-6">
                       <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black uppercase">{booking.customerName.charAt(0)}</div>
                          <span className="text-slate-900 font-black">{booking.customerName}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center text-slate-500">
                          <Scissors size={14} className="mr-2 text-slate-300" />
                          <span>{getServiceName(booking.serviceId)}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center text-slate-500">
                          <User size={14} className="mr-2 text-slate-300" />
                          <span>{getStaffName(booking.staffId)}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-slate-900 font-black italic">{new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{new Date(booking.date).toLocaleDateString()}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        booking.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        booking.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                        booking.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end space-x-2">
                        {booking.status === 'Pending' && (
                          <>
                            <button onClick={() => updateBookingStatus(booking.id, 'Approved')} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm"><Check size={18}/></button>
                            <button onClick={() => updateBookingStatus(booking.id, 'Rejected')} className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm"><X size={18}/></button>
                          </>
                        )}
                        {booking.status === 'Approved' && (
                           <button onClick={() => updateBookingStatus(booking.id, 'Completed')} className="px-6 py-3 bg-slate-900 hover:bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">Completar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
