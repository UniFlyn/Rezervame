"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  CalendarDays, 
  MapPin, 
  DollarSign, 
  Edit2, 
  Trash2, 
  X,
  Save,
  Loader2,
  Calendar as CalendarIcon
} from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatDate, cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  body: string;
  startAt: string;
  location: string;
  price: number;
  imageKey: string | null;
  active: boolean;
  createdAt: string;
}

export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Event[]>("/admin/events");
      setEvents(data);
    } catch (err) {
      toastError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleCreate = () => {
    setEditingEvent({
      title: "",
      body: "",
      startAt: new Date().toISOString().slice(0, 16),
      location: "",
      price: 0,
      imageKey: "",
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent({
      ...event,
      startAt: new Date(event.startAt).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await apiDelete(`/admin/events/${id}`);
      toastSuccess("Event deleted");
      void loadEvents();
    } catch (err) {
      toastError("Failed to delete event");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);
    try {
      const payload = {
        ...editingEvent,
        price: Number(editingEvent.price || 0),
        startAt: new Date(editingEvent.startAt).toISOString(),
      };

      if (editingEvent.id) {
        await apiPut(`/admin/events/${editingEvent.id}`, payload);
        toastSuccess("Event updated");
      } else {
        await apiPost("/admin/events", payload);
        toastSuccess("Event created");
      }
      setIsModalOpen(false);
      void loadEvents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save event";
      toastError("Save failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Events Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage platform-wide events, workshops, and seminars.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>New Event</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">Event Details</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Price</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-sm text-slate-500 font-medium tracking-tight">Loading events...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                    No events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                          {event.imageKey ? (
                            <img 
                              src={event.imageKey.startsWith('http') ? event.imageKey : `https://images.unsplash.com/photo-${event.imageKey.replace(/^photo-/, '')}?q=80&w=200&fit=crop`} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CalendarDays className="w-6 h-6 text-slate-400 m-3" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{event.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{event.body}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{new Date(event.startAt).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-500">{new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{event.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {event.price > 0 ? `$${event.price.toFixed(2)}` : <span className="text-emerald-600">Free</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        event.active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {event.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => void handleDelete(event.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 flex justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-200 h-fit my-auto animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingEvent.id ? "Edit Event" : "Create New Event"}</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Event configuration</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Event Title</label>
                  <input
                    required
                    type="text"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900"
                    placeholder="e.g. Masterclass Hair Styling 2026"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={editingEvent.body}
                    onChange={(e) => setEditingEvent({ ...editingEvent, body: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
                    placeholder="Describe the event details..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={editingEvent.startAt}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startAt: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      required
                      type="text"
                      value={editingEvent.location}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900"
                      placeholder="e.g. Panama City, Sortis Hotel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingEvent.price}
                      onChange={(e) => setEditingEvent({ ...editingEvent, price: parseFloat(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Event Banner Image</label>
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden shrink-0 group relative hover:border-blue-400 transition-colors cursor-pointer">
                      {editingEvent.imageKey ? (
                        <>
                          <img 
                            src={editingEvent.imageKey.startsWith('http') || editingEvent.imageKey.startsWith('data:') ? editingEvent.imageKey : `https://images.unsplash.com/photo-${editingEvent.imageKey.replace(/^photo-/, '')}?q=80&w=400&fit=crop`} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white w-6 h-6" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Plus className="text-slate-300 w-6 h-6 group-hover:text-blue-500 transition-colors" />
                          <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">Upload</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (rev) => {
                            setEditingEvent({ ...editingEvent, imageKey: rev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-3 pt-1">
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
                        Drop a high-quality banner for your event. <br/>
                        <span className="text-blue-600 font-black">Recommendation:</span> 1200x600px for optimal display on web and mobile.
                      </p>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Or URL:</span>
                         <input
                          type="text"
                          value={editingEvent.imageKey?.startsWith('data:') ? editingEvent.imageKey.slice(0, 30) + '...' : (editingEvent.imageKey || "")}
                          onChange={(e) => setEditingEvent({ ...editingEvent, imageKey: e.target.value })}
                          className="flex-1 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none text-[11px] font-medium text-slate-600 py-1"
                          placeholder="Unsplash ID or external https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="event-active"
                    checked={editingEvent.active}
                    onChange={(e) => setEditingEvent({ ...editingEvent, active: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  <label htmlFor="event-active" className="text-sm font-bold text-slate-700">Active and visible to public</label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{editingEvent.id ? "Update Event" : "Create Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
