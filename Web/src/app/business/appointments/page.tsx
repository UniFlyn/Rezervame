'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import type { CalendarApi, DatesSetArg, EventInput, DayCellContentArg, DayHeaderContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useBusinessStore } from '../../../store/businessStore';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useBookingsStore, Booking } from '../../../store/bookingsStore';
import { useServicesStore, Service } from '../../../store/servicesStore';
import { useStaffStore } from '../../../store/staffStore';
import { Pagination } from '@/components/ui/pagination';
import {
  X,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  MessageCircle,
  Sparkles,
  Hand,
  RefreshCw,
  Lock,
  LayoutDashboard,
  Settings,
  Users,
  List,
  CalendarDays,
  Check,
  Scissors,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';
import esLocale from '@fullcalendar/core/locales/es';
import enGbLocale from '@fullcalendar/core/locales/en-gb';
import { toastError, toastInfo, toastSuccess } from '@/lib/toast';

type Language = 'en' | 'es';

function L(lang: Language, en: string, es: string) {
  return lang === 'en' ? en : es;
}

function intlLocale(lang: Language) {
  return lang === 'en' ? 'en-US' : 'es';
}

/** Pastel fill + left accent (reference: soft fill + stronger edge) */
const APPT_PALETTE = [
  { fill: '#E1FBEB', accent: '#22C55E' },
  { fill: '#EDE9FE', accent: '#8B5CF6' },
  { fill: '#FCE7F3', accent: '#EC4899' },
  { fill: '#FEF3C7', accent: '#F59E0B' },
  { fill: '#FEE2E2', accent: '#EF4444' },
  { fill: '#E0F2FE', accent: '#0EA5E9' },
];

const timeFmt = {
  hour: 'numeric' as const,
  minute: '2-digit' as const,
  meridiem: 'short' as const,
  hour12: true,
};

function hashIdx(id: string, mod: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  return Math.abs(h) % mod;
}

function localDayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function bookingDayKey(iso: string) {
  const d = new Date(iso);
  return localDayKey(d);
}

function gmtOffsetLabel() {
  const offsetMin = -new Date().getTimezoneOffset();
  const hrs = offsetMin / 60;
  const sign = hrs >= 0 ? '+' : '';
  const num = Number.isInteger(hrs) ? String(hrs) : hrs.toFixed(1);
  return `GMT ${sign}${num}`;
}

type CalMode = 'day' | 'week' | 'month';

const viewMap: Record<CalMode, string> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
};

const VIEW_TO_MODE: Record<string, CalMode> = {
  timeGridDay: 'day',
  timeGridWeek: 'week',
  dayGridMonth: 'month',
};

function calendarTitle(lang: Language, viewType: string, start: Date, end: Date) {
  const loc = intlLocale(lang);
  if (viewType === 'dayGridMonth') {
    return new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(start).toUpperCase();
  }
  if (viewType === 'timeGridWeek') {
    const endInclusive = new Date(end.getTime() - 1);
    const a = new Intl.DateTimeFormat(loc, { month: 'short', day: 'numeric' }).format(start);
    const b = new Intl.DateTimeFormat(loc, { month: 'short', day: 'numeric', year: 'numeric' }).format(endInclusive);
    return `${a} – ${b}`.toUpperCase();
  }
  if (viewType === 'timeGridDay') {
    return new Intl.DateTimeFormat(loc, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      .format(start)
      .toUpperCase();
  }
  return new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(start).toUpperCase();
}

function weekdayShort(lang: Language, d: Date) {
  return new Intl.DateTimeFormat(intlLocale(lang), { weekday: 'short' }).format(d).toUpperCase();
}

function formatTimeRange12(lang: Language, start: Date, end: Date) {
  const o = { hour: 'numeric' as const, minute: '2-digit' as const, hour12: true };
  const loc = intlLocale(lang);
  return `${start.toLocaleTimeString(loc, o)}–${end.toLocaleTimeString(loc, o)}`;
}

function formatTime12(lang: Language, iso: string) {
  return new Date(iso).toLocaleTimeString(intlLocale(lang), { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateOnly(lang: Language, iso: string) {
  return new Date(iso).toLocaleDateString(intlLocale(lang), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function bookingStatusLabel(lang: Language, status: string) {
  switch (status) {
    case 'Pending':
      return L(lang, 'Pending', 'Pendiente');
    case 'Approved':
      return L(lang, 'Accept', 'Aceptar');
    case 'Completed':
      return L(lang, 'Paid', 'Pagado');
    case 'Rejected':
      return L(lang, 'Reject', 'Rechazar');
    case 'Cancelled':
      return L(lang, 'Cancel', 'Cancelar');
    default:
      return status;
  }
}

export default function AppointmentsPage() {
  const language: Language = 'en';
  const business = useBusinessStore((state) => state.business);
  const bookings = useBookingsStore((state) => state.bookings);
  const hydrateBookings = useBookingsStore((state) => state.hydrate);
  const services = useServicesStore((state) => state.services);
  const staff = useStaffStore((state) => state.staff);
  const addBooking = useBookingsStore((state) => state.addBooking);

  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const pageSize = 50;

  const [staffScope, setStaffScope] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleView, setScheduleView] = useState<'calendar' | 'list'>('calendar');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchPaginatedBookings = useCallback(async () => {
    if (!business) return;
    setIsLoadingList(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: searchQuery,
        status: statusFilter === 'all' ? '' : statusFilter,
        startDate,
        endDate,
      });
      if (staffScope !== 'all') query.append('staffId', staffScope);

      const response = await apiGet<{ data: any[]; total: number; totalPages: number }>(
        `/business/${business.id}/bookings?${query.toString()}`,
        'BUSINESS'
      );
      setPaginatedBookings(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to fetch paginated bookings', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [business, page, searchQuery, statusFilter, staffScope, startDate, endDate]);

  useEffect(() => {
    void hydrateBookings();
  }, [hydrateBookings]);

  useEffect(() => {
    if (scheduleView === 'list') {
      const timer = setTimeout(() => {
        void fetchPaginatedBookings();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scheduleView, fetchPaginatedBookings]);

  const calendarRef = useRef<FullCalendar>(null);
  const [calTitle, setCalTitle] = useState('');
  const [calMode, setCalMode] = useState<CalMode>('week');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    customerName: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '10:00',
    walkIn: false,
    recurring: false,
    locked: false,
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const tzLabel = useMemo(() => gmtOffsetLabel(), []);

  /** Waitlist = citas pendientes de confirmación (respects staff filter, not status filter). */
  const waitlistCount = useMemo(() => {
    let q = bookings;
    if (staffScope !== 'all') q = q.filter((b) => b.staffId === staffScope);
    return q.filter((b) => b.status === 'Pending').length;
  }, [bookings, staffScope]);

  const waitlistRows = useMemo(() => {
    let q = bookings.filter((b) => b.status === 'Pending');
    if (staffScope !== 'all') q = q.filter((b) => b.staffId === staffScope);
    return q.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings, staffScope]);

  const existingCustomers = Array.from(new Set(bookings.map((b) => b.customerName)));

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (staffScope !== 'all') list = list.filter((b) => b.staffId === staffScope);
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    return list;
  }, [bookings, staffScope, statusFilter]);

  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return filteredBookings.filter((b) => b.customerName.toLowerCase().includes(q)).slice(0, 12);
  }, [filteredBookings, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, staffScope, startDate, endDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStaffScope('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const listRows = useMemo(
    () =>
      scheduleView === 'list' 
        ? paginatedBookings 
        : [...filteredBookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [scheduleView, paginatedBookings, filteredBookings],
  );

  const groupedListRows = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    listRows.forEach((b) => {
      // Group by user (or customerName if no userId) and the date (YYYY-MM-DD)
      const dateOnly = new Date(b.date).toISOString().split('T')[0];
      const key = `${b.userId || b.customerName}_${dateOnly}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    // Sort services within each group by time
    Object.values(groups).forEach(group => {
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return Object.values(groups);
  }, [listRows]);

  const countBookingsOnDay = useCallback(
    (d: Date) => filteredBookings.filter((b) => bookingDayKey(b.date) === localDayKey(d)).length,
    [filteredBookings],
  );

  const getApi = useCallback((): CalendarApi | null => calendarRef.current?.getApi() ?? null, []);

  const applyCalMode = useCallback(
    (mode: CalMode) => {
      setCalMode(mode);
      const api = getApi();
      if (api) api.changeView(viewMap[mode]);
    },
    [getApi],
  );

  const onDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const mode = VIEW_TO_MODE[arg.view.type];
      if (mode) setCalMode(mode);
      setCalTitle(calendarTitle(language as Language, arg.view.type, arg.start, arg.end));
    },
    [language],
  );

  const dayCellClassNames = useCallback(
    (arg: DayCellContentArg) => {
      const key = arg.date.toDateString();
      const hasBooking = filteredBookings.some((b) => new Date(b.date).toDateString() === key);
      return hasBooking ? ['fc-day-has-booking'] : [];
    },
    [filteredBookings],
  );

  const events: EventInput[] = useMemo(() => {
    const lang = language as Language;
    return filteredBookings.map((b: Booking) => {
      const s = b.serviceId ? services.find((serv: Service) => serv.id === b.serviceId) : undefined;
      const idx = hashIdx(b.serviceId || b.id, APPT_PALETTE.length);
      const { fill, accent } = APPT_PALETTE[idx];
      const start = new Date(b.date);
      const end = new Date(start.getTime() + (s?.duration || 60) * 60 * 1000);
      return {
        id: b.id,
        title: b.customerName,
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: fill,
        textColor: '#0f172a',
        borderColor: 'transparent',
        classNames: ['fc-appt-block'],
        extendedProps: {
          booking: b,
          serviceName: s?.name || L(lang, 'Service', 'Servicio'),
          accent,
          fill,
          walkIn: Boolean(b.walkIn),
          recurring: Boolean(b.recurring),
          locked: Boolean(b.locked),
        },
      };
    });
  }, [filteredBookings, services, language]);

  const getServiceName = (id: string | null) =>
    id ? services.find((s: Service) => s.id === id)?.name || '—' : '—';
  const getStaffLabel = (id: string | null) =>
    id ? staff.find((s) => s.id === id)?.name || '—' : '—';

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const service = services.find((s) => s.id === newAppointment.serviceId);
    try {
      await addBooking({
        customerName: newAppointment.customerName,
        serviceId: newAppointment.serviceId || undefined,
        staffId: newAppointment.staffId || undefined,
        date: `${newAppointment.date}T${newAppointment.time}:00.000Z`,
        status: newAppointment.walkIn ? 'Pending' : 'Approved',
        price: service?.price || 0,
      });
      toastSuccess('Appointment added');
      setIsModalOpen(false);
      setNewAppointment({
        customerName: '',
        serviceId: '',
        staffId: '',
        date: '',
        time: '10:00',
        walkIn: false,
        recurring: false,
        locked: false,
      });
    } catch (err) {
      toastError(
        'Could not add appointment',
        err instanceof Error ? err.message : 'Please try again.',
      );
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await useBookingsStore.getState().bulkUpdateBookingStatus([id], status);
      // Update local state instantly
      setPaginatedBookings((prev) => 
        prev.map((b) => (b.id === id ? { ...b, status: status as any } : b))
      );
      toastSuccess('Status updated');
    } catch (err) {
      toastError(
        'Update failed',
        err instanceof Error ? err.message : 'Please try again.',
      );
    }
  };

  const handleBulkStatusChange = async (ids: string[], status: string) => {
    try {
      await useBookingsStore.getState().bulkUpdateBookingStatus(ids, status);
      setPaginatedBookings((prev) => 
        prev.map((b) => (ids.includes(b.id) ? { ...b, status: status as any } : b))
      );
      toastSuccess('Bulk status updated');
    } catch (err) {
      toastError('Bulk update failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleUpdateBooking = async (id: string, payload: any) => {
    try {
      const updated = await apiPatch<Booking>(`/bookings/${id}`, payload, 'BUSINESS');
      // Update global store
      useBookingsStore.setState((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updated } : b)),
      }));
      // Update local paginated state
      setPaginatedBookings((prev) => 
        prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
      );
      toastSuccess('Appointment updated');
      setEditingBooking(null);
    } catch (err) {
      toastError('Update failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleGroupPay = async (bookingIds: string[], paymentMethod: string) => {
    if (!business) return;
    try {
      await useBookingsStore.getState().payBookingGroup(bookingIds, paymentMethod);
      // Update local paginated state
      setPaginatedBookings((prev) => 
        prev.map((b) => (bookingIds.includes(b.id) ? { ...b, status: 'Completed' } : b))
      );
      toastSuccess(L(language as Language, 'Payment successful', 'Pago exitoso'));
    } catch (err) {
      toastError(
        L(language as Language, 'Payment failed', 'Fallo el pago'),
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  };

  const goToday = () => getApi()?.today();
  const goPrev = () => getApi()?.prev();
  const goNext = () => getApi()?.next();

  const isTodayCell = (d: Date) => localDayKey(d) === localDayKey(new Date());

  const dayHeaderContent = useCallback(
    (arg: DayHeaderContentArg) => {
      const lang = language as Language;
      if (arg.view.type === 'dayGridMonth') {
        return (
          <span className="fc-dual-weekday text-[10px] font-black leading-tight">{weekdayShort(lang, arg.date)}</span>
        );
      }

      const d = arg.date;
      const n = countBookingsOnDay(d);
      const today = isTodayCell(d);
      const closed = d.getDay() === 0;
      const apptWord =
        n === 1 ? L(lang, 'appointment', 'cita') : L(lang, 'appointments', 'citas');

      return (
        <div className="fc-ref-day-head flex w-full flex-col items-center gap-1 px-0.5 py-2 text-center">
          <div
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-black tabular-nums leading-none',
              today ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30' : 'bg-transparent text-slate-900',
            )}
          >
            {d.getDate()}
          </div>
          <div className="text-[9px] font-black leading-none tracking-wide text-slate-500">{weekdayShort(lang, d)}</div>
          <div className="text-[8px] font-semibold leading-tight text-slate-400">
            {n} {apptWord}
          </div>
          {closed ? (
            <div className="text-[8px] font-bold uppercase leading-none text-rose-400">
              {L(lang, 'Closed', 'Cerrado')}
            </div>
          ) : null}
        </div>
      );
    },
    [countBookingsOnDay, language],
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            {L(language as Language, 'Appointments', 'Citas')}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {L(language as Language, 'Team schedule and availability', 'Agenda y disponibilidad del equipo')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm outline-none ring-cyan-500/20 focus:ring-2"
          >
            <option value="all">{L(language as Language, 'All statuses', 'Todos los estados')}</option>
            <option value="Pending">{L(language as Language, 'Pending', 'Pendiente')}</option>
            <option value="Approved">{L(language as Language, 'Confirmed', 'Confirmada')}</option>
            <option value="Completed">{L(language as Language, 'Completed', 'Completada')}</option>
            <option value="Rejected">{L(language as Language, 'Rejected', 'Rechazada')}</option>
          </select>
          <select
            value={staffScope}
            onChange={(e) => setStaffScope(e.target.value)}
            className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm outline-none ring-cyan-500/20 focus:ring-2"
            title={L(language as Language, 'Filter appointments by professional', 'Filtrar citas por profesional')}
          >
            <option value="all">{L(language as Language, 'All staff', 'Todo el staff')}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none ring-cyan-500/20 focus:ring-2"
              title={L(language as Language, 'Start Date', 'Fecha inicio')}
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none ring-cyan-500/20 focus:ring-2"
              title={L(language as Language, 'End Date', 'Fecha fin')}
            />
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            title={L(language as Language, 'Clear filters', 'Limpiar filtros')}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-600"
          >
            <Plus className="h-4 w-4" />
            {L(language as Language, 'New appointment', 'Nueva cita')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {scheduleView === 'calendar' ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 hover:bg-white"
                aria-label={L(language as Language, 'Previous', 'Anterior')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-700 shadow-sm hover:border-cyan-300"
                title={L(language as Language, 'Today', 'Hoy')}
              >
                {L(language as Language, 'Today', 'Hoy')}
              </button>
              <button
                type="button"
                onClick={goNext}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 hover:bg-white"
                aria-label={L(language as Language, 'Next', 'Siguiente')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="min-w-0 max-w-full break-words text-center text-[11px] font-black uppercase leading-snug tracking-tight text-slate-800 md:min-w-[280px] md:text-left md:text-xs">
                {calTitle || '…'}
              </span>
            </>
          ) : (
            <span className="text-sm font-black text-slate-800">{L(language as Language, 'Appointments list', 'Lista de citas')}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setScheduleView('calendar')}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wide transition-colors',
                scheduleView === 'calendar' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {L(language as Language, 'Calendar', 'Calendario')}
            </button>
            <button
              type="button"
              onClick={() => setScheduleView('list')}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wide transition-colors',
                scheduleView === 'list' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <List className="h-3.5 w-3.5" />
              {L(language as Language, 'List', 'Lista')}
            </button>
          </div>
          {scheduleView === 'calendar' ? (
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(['day', 'week', 'month'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => applyCalMode(m)}
                  className={clsx(
                    'rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wide transition-colors',
                    calMode === m ? 'bg-[#f87171] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  )}
                  title={
                    m === 'day'
                      ? L(language as Language, 'Day view', 'Vista día')
                      : m === 'week'
                        ? L(language as Language, 'Week view', 'Vista semana')
                        : L(language as Language, 'Month view', 'Vista mes')
                  }
                >
                  {m === 'day' ? L(language as Language, 'Day', 'Día') : m === 'week' ? L(language as Language, 'Week', 'Semana') : L(language as Language, 'Month', 'Mes')}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {L(language as Language, 'New appointment', 'Nueva cita')}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">
                  {L(language as Language, 'Client', 'Cliente')}
                </label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    list="cust"
                    required
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm font-semibold outline-none ring-cyan-500/20 focus:ring-2"
                    value={newAppointment.customerName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                  />
                  <datalist id="cust">
                    {existingCustomers.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    {L(language as Language, 'Service', 'Servicio')}
                  </label>
                  <select
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold"
                    value={newAppointment.serviceId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, serviceId: e.target.value })}
                  >
                    <option value="">{L(language as Language, 'Choose…', 'Elegir…')}</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    {L(language as Language, 'Staff', 'Staff')}
                  </label>
                  <select
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold"
                    value={newAppointment.staffId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, staffId: e.target.value })}
                  >
                    <option value="">{L(language as Language, 'Choose…', 'Elegir…')}</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    {L(language as Language, 'Date', 'Fecha')}
                  </label>
                  <input
                    type="date"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">
                    {L(language as Language, 'Time', 'Hora')}
                  </label>
                  <input
                    type="time"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={newAppointment.walkIn}
                    onChange={(e) => setNewAppointment({ ...newAppointment, walkIn: e.target.checked })}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  {L(language as Language, 'Walk-in', 'Sin cita')}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={newAppointment.recurring}
                    onChange={(e) => setNewAppointment({ ...newAppointment, recurring: e.target.checked })}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  {L(language as Language, 'Recurring', 'Recurrente')}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={newAppointment.locked}
                    onChange={(e) => setNewAppointment({ ...newAppointment, locked: e.target.checked })}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  {L(language as Language, 'Locked', 'Bloqueado')}
                </label>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-500 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-600"
              >
                {L(language as Language, 'Save appointment', 'Guardar cita')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="relative overflow-visible rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="relative flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 md:px-4">
          <span className="text-[11px] font-bold tabular-nums text-slate-500">{tzLabel}</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((o) => !o);
                setSearchOpen(false);
              }}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-expanded={menuOpen}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-full z-40 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <Link
                  href="/business/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 text-cyan-600" />
                  Dashboard
                </Link>
                <Link
                  href="/business/staff"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Users className="h-4 w-4 text-cyan-600" />
                  Staff
                </Link>
                <Link
                  href="/business/settings"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-cyan-600" />
                  Settings
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className={clsx('relative', scheduleView === 'calendar' && 'pr-11 md:pr-14')}>
          {scheduleView === 'calendar' ? (
            <div className="calendar-modern calendar-ref-week h-[min(78vh,820px)] min-h-[560px] p-2 pb-14 md:p-4 md:pb-16">
              <FullCalendar
                key={language}
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={viewMap[calMode]}
                locales={[enGbLocale, esLocale]}
                locale={'en-gb'}
                headerToolbar={false}
                nowIndicator
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
                scrollTime="09:00:00"
                slotDuration="00:15:00"
                slotLabelInterval="01:00:00"
                slotLabelFormat={timeFmt}
                eventTimeFormat={timeFmt}
                allDaySlot={false}
                events={events}
                height="100%"
                datesSet={onDatesSet}
                dayHeaderContent={dayHeaderContent}
                dayCellClassNames={dayCellClassNames}
                eventDidMount={(info) => {
                  const accent = (info.event.extendedProps as { accent?: string }).accent;
                  if (!accent) return;
                  const el = info.el;
                  el.style.borderLeft = `4px solid ${accent}`;
                  el.style.borderTopColor = 'transparent';
                  el.style.borderRightColor = 'transparent';
                  el.style.borderBottomColor = 'transparent';
                }}
                eventContent={(arg) => {
                  const ep = arg.event.extendedProps as {
                    serviceName?: string;
                    accent?: string;
                    booking?: Booking;
                    walkIn?: boolean;
                    recurring?: boolean;
                    locked?: boolean;
                  };
                  const start = arg.event.start;
                  const end = arg.event.end;
                  const range =
                    start && end
                      ? formatTimeRange12(
                          language as Language,
                          start instanceof Date ? start : new Date(start),
                          end instanceof Date ? end : new Date(end),
                        )
                      : arg.timeText;
                  const accent = ep.accent ?? '#22c55e';
                  const service = ep.serviceName || '';
                  const title = arg.event.title || '';
                  const walkIn = ep.walkIn;
                  const recurring = ep.recurring;
                  const locked = ep.locked;
                  const primaryLabel = walkIn ? L(language as Language, 'Walk-in', 'Sin cita') : title;
                  const EventGlyph = walkIn ? Hand : recurring ? RefreshCw : locked ? Lock : User;
                  return (
                    <div className="relative flex h-full min-h-[2.25rem] flex-col px-1.5 pb-5 pt-1 text-left">
                      <p className="line-clamp-2 text-[11px] font-bold leading-snug text-slate-900">
                        {range} {primaryLabel}
                      </p>
                      {service ? <p className="mt-0.5 truncate text-[10px] font-normal leading-tight text-slate-600">{service}</p> : null}
                      <EventGlyph
                        className="pointer-events-none absolute bottom-0.5 right-0.5 h-3 w-3 shrink-0 opacity-60"
                        aria-hidden
                        strokeWidth={2.25}
                        style={{ color: accent }}
                      />
                    </div>
                  );
                }}
                eventClick={(info) => {
                  const b = (info.event.extendedProps as { booking?: Booking }).booking;
                  if (b && !b.locked) {
                    setEditingBooking(b);
                  } else if (b?.locked) {
                    toastInfo(b.customerName, L(language as Language, 'Appointment is locked.', 'Cita bloqueada.'));
                  }
                }}
              />
            </div>
          ) : (
            <div className="min-h-[min(60vh,560px)] overflow-x-auto p-2 pb-14 md:p-4 md:pb-16">
              {listRows.length === 0 ? (
                <p className="py-16 text-center text-sm font-semibold text-slate-400">{L(language as Language, 'No appointments match filters.', 'Sin citas con estos filtros.')}</p>
              ) : (
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/90">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{L(language as Language, 'Client', 'Cliente')}</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{L(language as Language, 'Service', 'Servicio')}</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {L(language as Language, 'Staff', 'Staff')}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{L(language as Language, 'Date', 'Fecha')}</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{L(language as Language, 'Time', 'Hora')}</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">{L(language as Language, 'Status', 'Estado')}</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{L(language as Language, 'Flags', 'Notas')}</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">{L(language as Language, 'Actions', 'Acciones')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 relative">
                  {isLoadingList && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  {groupedListRows.map((group) => {
                    const booking = group[0];
                    const isGroup = group.length > 1;
                    const dateOnly = new Date(booking.date).toISOString().split('T')[0];
                    const groupKey = `${booking.userId || booking.customerName}_${dateOnly}`;
                    const isExpanded = expandedGroups.has(groupKey);
                    
                    const groupIds = group.map((b) => b.id);
                    const allCompleted = group.every((b) => b.status === 'Completed');
                    const allApproved = group.every((b) => b.status === 'Approved');
                    const anyPending = group.some((b) => b.status === 'Pending');
                    const anyLocked = group.some((b) => b.locked);
                    const totalPrice = group.reduce((sum, b) => sum + b.price, 0);

                    const servicesText = group.map((b) => getServiceName(b.serviceId)).join(', ');
                    const staffText = Array.from(new Set(group.map((b) => getStaffLabel(b.staffId)))).join(', ');

                    return (
                      <Fragment key={groupKey}>
                        <tr 
                          className={clsx(
                            "transition-colors hover:bg-cyan-50/40 border-l-4",
                            isGroup ? "bg-slate-50/50 border-l-cyan-500/50" : "border-l-transparent"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isGroup && (
                                <button 
                                  onClick={() => toggleGroup(groupKey)}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                              )}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-black text-white">
                                {booking.customerName.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{booking.customerName}</span>
                                {isGroup && <span className="text-[10px] text-slate-400 font-bold uppercase">{group.length} {L(language as Language, 'Services', 'Servicios')}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="inline-flex items-center gap-1.5 line-clamp-1">
                              <Scissors className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                              {servicesText}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                              {staffText}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                            {formatDateOnly(language as Language, booking.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                            {isGroup ? (
                              <span className="flex flex-col">
                                <span>{formatTime12(language as Language, group[0].date)}</span>
                                <span className="text-[10px] text-slate-400 font-normal leading-none mt-0.5">
                                  to {formatTime12(language as Language, group[group.length - 1].date)}
                                </span>
                              </span>
                            ) : (
                              formatTime12(language as Language, booking.date)
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <select
                                value={allCompleted ? 'Completed' : anyPending ? 'Pending' : allApproved ? 'Approved' : 'Mixed'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Mixed') return;
                                  if (val === 'Reschedule') {
                                    setEditingBooking(booking);
                                    return;
                                  }
                                  if (val === 'PaidCash') {
                                    void handleGroupPay(groupIds, 'Cash');
                                    return;
                                  }
                                  if (val === 'PaidCard') {
                                    void handleGroupPay(groupIds, 'Card');
                                    return;
                                  }
                                  if (val === 'PaidOnline') {
                                    void handleGroupPay(groupIds, 'Online');
                                    return;
                                  }
                                  void handleBulkStatusChange(groupIds, val);
                                }}
                                disabled={anyLocked}
                                className={clsx(
                                  'appearance-none rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all focus:ring-2 focus:ring-offset-1 outline-none border-none',
                                  allApproved && 'bg-emerald-100 text-emerald-800 focus:ring-emerald-500',
                                  anyPending && 'bg-amber-100 text-amber-800 focus:ring-amber-500',
                                  allCompleted && 'bg-cyan-100 text-cyan-900 focus:ring-cyan-500',
                                  anyLocked && 'opacity-50 cursor-not-allowed'
                                )}
                              >
                                <option value="Pending">{L(language as Language, 'Pending', 'Pendiente')}</option>
                                <option value="Approved">{L(language as Language, 'Accept', 'Aceptar')}</option>
                                <option value="Rejected">{L(language as Language, 'Reject', 'Rechazar')}</option>
                                <option value="Cancelled">{L(language as Language, 'Cancel', 'Cancelar')}</option>
                                <option value="Reschedule">{L(language as Language, 'Schedule rechange', 'Reagendar')}</option>
                                <option value="PaidCash">{L(language as Language, 'Paid via Cash', 'Pagado Efectivo')}</option>
                                <option value="PaidCard">{L(language as Language, 'Paid via Card', 'Pagado Tarjeta')}</option>
                                <option value="PaidOnline">{L(language as Language, 'Paid via Online', 'Pagado Online')}</option>
                                <option value="Mixed" disabled>Mixed</option>
                              </select>
                              <span className="text-[10px] font-black text-slate-900">${totalPrice.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {booking.walkIn ? (
                                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                  {L(language as Language, 'Walk-in', 'Sin cita')}
                                </span>
                              ) : null}
                              {booking.recurring ? (
                                <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">↻</span>
                              ) : null}
                              {anyLocked ? (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                  <Lock className="inline h-3 w-3" />
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isGroup && !anyLocked && (
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleBulkStatusChange(groupIds, 'Approved');
                                  }}
                                  className="rounded-lg bg-emerald-500 px-2 py-1 text-[9px] font-black uppercase text-white hover:bg-emerald-600 shadow-sm transition-colors"
                                >
                                  {L(language as Language, 'Accept All', 'Aceptar Todo')}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleBulkStatusChange(groupIds, 'Rejected');
                                  }}
                                  className="rounded-lg bg-rose-500 px-2 py-1 text-[9px] font-black uppercase text-white hover:bg-rose-600 shadow-sm transition-colors"
                                >
                                  {L(language as Language, 'Reject All', 'Rechazar Todo')}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5 items-center">
                              {!allCompleted && !anyLocked && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => void handleGroupPay(groupIds, 'Cash')}
                                    className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-black uppercase text-white hover:bg-emerald-700"
                                    title="Pay with Cash"
                                  >
                                    Cash
                                  </button>
                                  <button
                                    onClick={() => void handleGroupPay(groupIds, 'Card')}
                                    className="rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-black uppercase text-white hover:bg-blue-700"
                                    title="Pay with Card"
                                  >
                                    Card
                                  </button>
                                </div>
                              )}
                              
                              {anyPending && !anyLocked ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => groupIds.forEach(id => void handleStatusChange(id, 'Approved'))}
                                    className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                    title={L(language as Language, 'Confirm All', 'Confirmar todo')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                </>
                              ) : null}

                              {!anyLocked && (
                                <button
                                  type="button"
                                  onClick={() => setEditingBooking(booking)}
                                  className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                                  title={L(language as Language, 'Edit', 'Editar')}
                                >
                                  <Settings className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(L(language as Language, 'Cancel this appointment?', '¿Cancelar esta cita?'))) {
                                    void handleBulkStatusChange(groupIds, 'Rejected');
                                  }
                                }}
                                className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && group.map((subBooking) => (
                          <tr key={subBooking.id} className="bg-slate-50/80 border-l-4 border-l-cyan-500 animate-in fade-in slide-in-from-left-1 duration-200">
                            <td className="px-4 py-2 pl-12 text-slate-500 text-xs italic">
                              ↳ {getServiceName(subBooking.serviceId)}
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-xs">
                              {getServiceName(subBooking.serviceId)}
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-xs">
                              {getStaffLabel(subBooking.staffId)}
                            </td>
                            <td className="px-4 py-2 text-slate-400 text-xs">
                              -
                            </td>
                            <td className="px-4 py-2 font-bold text-slate-700 text-xs">
                              {formatTime12(language as Language, subBooking.date)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <select
                                value={subBooking.status}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Reschedule') {
                                    setEditingBooking(subBooking);
                                    return;
                                  }
                                  if (val === 'PaidCash') {
                                    void handleGroupPay([subBooking.id], 'Cash');
                                    return;
                                  }
                                  if (val === 'PaidCard') {
                                    void handleGroupPay([subBooking.id], 'Card');
                                    return;
                                  }
                                  if (val === 'PaidOnline') {
                                    void handleGroupPay([subBooking.id], 'Online');
                                    return;
                                  }
                                  void handleStatusChange(subBooking.id, val as any);
                                }}
                                disabled={subBooking.locked}
                                className={clsx(
                                  'appearance-none rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide cursor-pointer transition-all outline-none border-none',
                                  subBooking.status === 'Approved' && 'bg-emerald-50 text-emerald-700',
                                  subBooking.status === 'Pending' && 'bg-amber-50 text-amber-700',
                                  subBooking.status === 'Completed' && 'bg-cyan-50 text-cyan-800',
                                  subBooking.locked && 'opacity-50 cursor-not-allowed'
                                )}
                              >
                                <option value="Pending">{L(language as Language, 'Pending', 'Pendiente')}</option>
                                <option value="Approved">{L(language as Language, 'Accept', 'Aceptar')}</option>
                                <option value="Rejected">{L(language as Language, 'Reject', 'Rechazar')}</option>
                                <option value="Cancelled">{L(language as Language, 'Cancel', 'Cancelar')}</option>
                                <option value="Reschedule">{L(language as Language, 'Schedule rechange', 'Reagendar')}</option>
                                <option value="PaidCash">{L(language as Language, 'Paid via Cash', 'Pagado Efectivo')}</option>
                                <option value="PaidCard">{L(language as Language, 'Paid via Card', 'Pagado Tarjeta')}</option>
                                <option value="PaidOnline">{L(language as Language, 'Paid via Online', 'Pagado Online')}</option>
                              </select>
                            </td>
                            <td className="px-4 py-2 text-xs font-bold text-slate-600">
                              ${subBooking.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {!subBooking.locked && (
                                <button
                                  onClick={() => setEditingBooking(subBooking)}
                                  className="text-slate-400 hover:text-cyan-600"
                                >
                                  <Settings className="h-3 w-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              )}
              {scheduleView === 'list' && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}

          {scheduleView === 'calendar' ? (
          <button
            type="button"
            onClick={() => setWaitlistOpen(true)}
            className="absolute -right-px top-1/2 z-20 flex -translate-y-1/2 cursor-pointer flex-col items-center justify-center gap-2 rounded-l-lg border border-slate-600 bg-slate-800 px-2.5 py-6 text-left text-white shadow-lg transition hover:bg-slate-700"
            style={{ writingMode: 'vertical-rl' }}
            title={L(language as Language, 'Waitlist (pending)', 'Lista de espera')}
          >
            <span className="flex items-center gap-1.5 font-black tracking-wide text-emerald-300">
              {waitlistCount}
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500 ring-2 ring-red-500/40" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/95">
              {L(language as Language, 'waitlist', 'espera')}
            </span>
          </button>
          ) : null}

          <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-2 shadow-xl shadow-slate-900/30">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((o) => !o);
                setMenuOpen(false);
              }}
              className="rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/business/support"
              className="rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Chat"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Tips"
            >
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>

          {searchOpen ? (
            <div className="pointer-events-auto absolute bottom-[4.25rem] left-1/2 z-30 w-[min(100%,22rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  placeholder={L(language as Language, 'Search client…', 'Buscar cliente…')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-semibold outline-none ring-cyan-500/20 focus:ring-2"
                />
              </div>
              {searchHits.length > 0 ? (
                <ul className="mt-2 max-h-48 overflow-auto text-left text-xs">
                  {searchHits.map((b) => (
                    <li key={b.id} className="border-b border-slate-50 py-2 last:border-0">
                      <span className="font-bold text-slate-800">{b.customerName}</span>
                      <span className="text-slate-500"> · {getServiceName(b.serviceId)}</span>
                      <div className="text-[10px] text-slate-400">{new Date(b.date).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              ) : searchQuery.trim() ? (
                <p className="mt-2 text-center text-[11px] text-slate-400">{L(language as Language, 'No matches', 'Sin resultados')}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {waitlistOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{L(language as Language, 'Waitlist', 'Lista de espera')}</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {waitlistCount} {L(language as Language, 'pending confirmation', 'pendientes de confirmar')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWaitlistOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto px-2 py-2">
              {waitlistRows.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-slate-500">{L(language as Language, 'No one on the waitlist.', 'Lista vacía.')}</li>
              ) : (
                waitlistRows.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-cyan-50/50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{b.customerName}</p>
                      <p className="text-[11px] text-slate-500">
                        {getServiceName(b.serviceId)} · {getStaffLabel(b.staffId)}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">{new Date(b.date).toLocaleString()}</p>
                    </div>
                    {b.walkIn ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800">
                        {L(language as Language, 'Walk-in', 'Sin cita')}
                      </span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {editingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">{L(language as Language, 'Edit Appointment', 'Editar Cita')}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{editingBooking.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="rounded-2xl bg-white p-3 text-slate-400 shadow-sm hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{L(language as Language, 'Date', 'Fecha')}</label>
                  <input
                    type="date"
                    defaultValue={new Date(editingBooking.date).toISOString().split('T')[0]}
                    onChange={(e) => {
                      const d = new Date(editingBooking.date);
                      const [y, m, day] = e.target.value.split('-').map(Number);
                      d.setFullYear(y, m - 1, day);
                      setEditingBooking({ ...editingBooking, date: d.toISOString() });
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{L(language as Language, 'Time', 'Hora')}</label>
                  <input
                    type="time"
                    defaultValue={new Date(editingBooking.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    onChange={(e) => {
                      const d = new Date(editingBooking.date);
                      const [h, m] = e.target.value.split(':').map(Number);
                      d.setHours(h, m);
                      setEditingBooking({ ...editingBooking, date: d.toISOString() });
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{L(language as Language, 'Staff', 'Staff')}</label>
                <select
                  value={editingBooking.staffId || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, staffId: e.target.value || null })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none"
                >
                  <option value="">{L(language as Language, 'Any Staff', 'Cualquier Staff')}</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{L(language as Language, 'Service', 'Servicio')}</label>
                <select
                  value={editingBooking.serviceId || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, serviceId: e.target.value || null })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 rounded-2xl border-2 border-slate-100 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                >
                  {L(language as Language, 'Cancel', 'Cancelar')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdateBooking(editingBooking.id, {
                    date: editingBooking.date,
                    staffId: editingBooking.staffId,
                    serviceId: editingBooking.serviceId,
                    status: editingBooking.status
                  })}
                  className="flex-1 rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                >
                  {L(language as Language, 'Save Changes', 'Guardar Cambios')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
