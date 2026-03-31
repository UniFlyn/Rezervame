'use client';

import { useBusinessStore } from '../../../store/businessStore';
import { useBookingsStore, Booking } from '../../../store/bookingsStore';
import { useTransactionsStore, Transaction } from '../../../store/transactionsStore';
import { Users, CalendarCheck, TrendingUp, Clock } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

function KPI({ title, value, icon: Icon, desc }: { title: string; value: string | number; icon: any; desc: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
      <div className="p-3 bg-primary/10 text-primary rounded-lg">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const business = useBusinessStore((state) => state.business);
  const bookings = useBookingsStore((state) => state.bookings);
  const transactions = useTransactionsStore((state) => state.transactions);

  const pendingCount = bookings.filter((b: Booking) => b.status === 'Pending').length;
  const todayCount = bookings.filter((b: Booking) => new Date(b.date).toDateString() === new Date().toDateString()).length;
  const totalRev = transactions.reduce((acc: number, tx: Transaction) => acc + (tx.type === 'Earning' ? tx.amount : 0), 0);

  // Prepare chart data for last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const dayBookings = bookings.filter(b => new Date(b.date).toDateString() === d.toDateString());
    return {
      name: dateStr,
      bookings: dayBookings.length,
      revenue: dayBookings.reduce((sum, b) => sum + (b.price || 0), 0)
    };
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Resumen del Negocio</h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Monitorea el rendimiento de {business?.name}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI title="Ingresos Totales" value={`$${totalRev}`} icon={TrendingUp} desc="Desde el inicio" />
        <KPI title="Citas Hoy" value={todayCount} icon={CalendarCheck} desc="Próximas visitas" />
        <KPI title="Aprobaciones" value={pendingCount} icon={Clock} desc="Pendientes de revisión" />
        <KPI title="Total Clientes" value={bookings.length} icon={Users} desc="Registrados" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Actividad Semanal</h3>
            <div className="flex space-x-2">
              <span className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> Tendencia Positiva
              </span>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a5f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff5a5f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ff5a5f" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Citas Recientes</h3>
          </div>
          <ul className="space-y-6">
            {bookings.slice(0, 5).map((b) => (
              <li key={b.id} className="flex justify-between items-center group">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                    {b.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{b.customerName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(b.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  b.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                  b.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
          <button className="w-full mt-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-slate-100 border-dashed">
            Ver Todas las Citas
          </button>
        </div>
      </div>
    </div>
  );
}
