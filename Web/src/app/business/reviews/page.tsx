'use client';

import React, { useState } from 'react';
import { useReviewsStore, Review } from '../../../store/reviewsStore';
import { Star, MessageSquare, Filter, ChevronDown, Check, Reply, Trash2, Search } from 'lucide-react';
import clsx from 'clsx';

export default function ReviewsPage() {
  const reviews = useReviewsStore((state) => state.reviews);
  const addReply = useReviewsStore((state) => state.addReply);
  const deleteReview = useReviewsStore((state) => state.deleteReview);

  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Replied'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  const totalReviews = reviews.length;

  const filteredReviews = reviews.filter((r) => {
    const matchesRating = filterRating === 'all' || r.rating === filterRating;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesRating && matchesStatus;
  });

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    addReply(id, replyText);
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Reseñas y Calificaciones</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestiona la reputación de tu negocio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Rating Summary Card */}
        <div className="lg:col-span-1 bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-black text-slate-900 mb-2">{averageRating}</div>
            <div className="flex mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={20} className={clsx(s <= Math.round(Number(averageRating)) ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                ))}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalReviews} Reseñas Totales</div>
            <div className="w-full mt-8 space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter(r => r.rating === rating).length;
                    const percentage = (count / totalReviews) * 100;
                    return (
                        <div key={rating} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 w-4">{rating}</span>
                            <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 w-8">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Filters and List */}
        <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[32px] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                        <option value="all">Todas las Estrellas</option>
                        <option value="5">5 Estrellas</option>
                        <option value="4">4 Estrellas</option>
                        <option value="3">3 Estrellas</option>
                        <option value="2">2 Estrellas</option>
                        <option value="1">1 Estrella</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <MessageSquare size={14} className="text-slate-400" />
                    <select 
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="Pending">Pendientes de Respuesta</option>
                        <option value="Replied">Respondidas</option>
                    </select>
                </div>
                
                <div className="ml-auto relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="BUSCAR RESEÑA..." className="bg-slate-50 border border-slate-100 rounded-2xl py-2 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" />
                </div>
            </div>

            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-slate-100">
                        <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron reseñas con estos filtros</p>
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="shrink-0 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-[24px] overflow-hidden border-4 border-slate-50 shadow-sm">
                                        <img src={review.avatar} alt={review.customerName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="mt-3 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Verificado</div>
                                </div>
                                
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="font-black text-slate-800 text-lg leading-none mb-1">{review.customerName}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()} • {review.serviceName} con {review.staffName}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} size={16} className={clsx(s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-100")} />
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-slate-600 font-medium leading-relaxed italic">"{review.comment}"</p>

                                    {review.reply ? (
                                        <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 relative mt-4">
                                            <div className="absolute -top-3 left-6 bg-slate-900 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">TU RESPUESTA</div>
                                            <p className="text-slate-600 font-bold text-sm italic">{review.reply}</p>
                                        </div>
                                    ) : (
                                        <div className="pt-2">
                                            {replyingTo === review.id ? (
                                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                                    <textarea 
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="ESCRIBE TU RESPUESTA AQUÍ..."
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px]"
                                                    />
                                                    <div className="flex justify-end gap-3">
                                                        <button 
                                                            onClick={() => setReplyingTo(null)}
                                                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReply(review.id)}
                                                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition shadow-xl shadow-slate-200"
                                                        >
                                                            Enviar Respuesta
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setReplyingTo(review.id)}
                                                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform bg-primary/5 px-4 py-2 rounded-xl"
                                                >
                                                    <Reply size={14} /> Responder a Maria
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    <button 
                                        onClick={() => deleteReview(review.id)}
                                        className="p-3 text-slate-200 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-2xl"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
