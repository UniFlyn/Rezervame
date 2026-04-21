'use client';

import React, { useMemo, useState } from 'react';
import { useReviewsStore, Review } from '../../../store/reviewsStore';
import { Star, MessageSquare, Reply, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';

export default function ReviewsPage() {
  const reviews = useReviewsStore((state) => state.reviews);
  const addReply = useReviewsStore((state) => state.addReply);
  const deleteReview = useReviewsStore((state) => state.deleteReview);

  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Replied'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews === 0 ? '0.0' : (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      const matchesRating = filterRating === 'all' || r.rating === filterRating;
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchesSearch =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q);
      return matchesRating && matchesStatus && matchesSearch;
    });
  }, [reviews, filterRating, filterStatus, search]);

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    addReply(id, replyText);
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Reseñas y calificaciones</h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Gestiona la reputación de tu negocio
        </p>
      </div>

      {/* Summary row — stars measure on top */}
      <div className="rounded-[32px] border border-slate-100 bg-white p-10 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col items-center justify-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calificación global</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-6xl font-black tracking-tighter text-slate-900">{averageRating}</span>
              <span className="pb-2 text-sm font-bold text-slate-400">/ 5</span>
            </div>
            <div className="mt-2 flex justify-center md:justify-start">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={24}
                  className={clsx(
                    s <= Math.round(Number(averageRating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200',
                  )}
                />
              ))}
            </div>
          </div>
          <div className="w-full max-w-md space-y-3 md:max-w-lg">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter((r) => r.rating === rating).length;
              const percentage = totalReviews ? (count / totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-4 text-[10px] font-bold text-slate-500">{rating}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-50">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-8 text-[10px] font-bold text-slate-400">{count}</span>
                </div>
              );
            })}
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 md:text-right">
              {totalReviews} reseñas totales
            </p>
          </div>
        </div>
      </div>

      <BusinessFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Buscar reseñas…">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
          <select
            className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none"
            value={filterRating === 'all' ? 'all' : String(filterRating)}
            onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">Todas las estrellas</option>
            <option value="5">5 estrellas</option>
            <option value="4">4 estrellas</option>
            <option value="3">3 estrellas</option>
            <option value="2">2 estrellas</option>
            <option value="1">1 estrella</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
          <MessageSquare size={14} className="text-slate-400" />
          <select
            className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Pending' | 'Replied')}
          >
            <option value="all">Todos los estados</option>
            <option value="Pending">Pendientes de respuesta</option>
            <option value="Replied">Respondidas</option>
          </select>
        </div>
      </BusinessFilterToolbar>

      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="rounded-[32px] border-2 border-dashed border-slate-100 bg-white p-20 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              No se encontraron reseñas con estos filtros
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="animate-in fade-in rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 duration-500 slide-in-from-bottom-4"
            >
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex shrink-0 flex-col items-center">
                  <div className="h-16 w-16 overflow-hidden rounded-[24px] border-4 border-slate-50 shadow-sm">
                    <img src={review.avatar} alt={review.customerName} className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-tighter text-emerald-600">
                    Verificado
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h4 className="mb-1 text-lg font-black leading-none text-slate-800">{review.customerName}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {new Date(review.date).toLocaleDateString()} · {review.serviceName} con {review.staffName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={clsx(s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100')}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="font-medium italic leading-relaxed text-slate-600">&ldquo;{review.comment}&rdquo;</p>

                  {review.reply ? (
                    <div className="relative mt-4 rounded-[24px] border border-slate-100 bg-slate-50 p-6">
                      <div className="absolute -top-3 left-6 rounded-full bg-slate-900 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                        Tu respuesta
                      </div>
                      <p className="text-sm font-bold italic text-slate-600">{review.reply}</p>
                    </div>
                  ) : (
                    <div className="pt-2">
                      {replyingTo === review.id ? (
                        <div className="animate-in zoom-in-95 space-y-4 duration-300 fade-in">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe tu respuesta…"
                            className="min-h-[120px] w-full rounded-[24px] border border-slate-100 bg-slate-50 p-6 text-sm font-bold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-primary/10"
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setReplyingTo(null)}
                              className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:text-slate-600"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReply(review.id)}
                              className="rounded-2xl bg-slate-900 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition hover:bg-primary"
                            >
                              Enviar respuesta
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReplyingTo(review.id)}
                          className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-transform hover:translate-x-1"
                        >
                          <Reply size={14} /> Responder
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => deleteReview(review.id)}
                    className="rounded-2xl p-3 text-slate-200 transition-colors hover:bg-rose-50 hover:text-rose-500"
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
  );
}
