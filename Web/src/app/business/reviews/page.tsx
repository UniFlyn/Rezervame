"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useReviewsStore, Review } from '../../../store/reviewsStore';
import { Star, MessageSquare, Reply, Trash2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';
import { BusinessFilterToolbar } from '../../../components/business/BusinessFilterToolbar';
import { useBusinessStore } from '../../../store/businessStore';
import { apiGet } from '@/lib/api';
import { Pagination } from '@/components/ui/pagination';

export default function ReviewsPage() {
  const reviews = useReviewsStore((state) => state.reviews);
  const hydrateReviews = useReviewsStore((state) => state.hydrate);
  const addReply = useReviewsStore((state) => state.addReply);
  const deleteReview = useReviewsStore((state) => state.deleteReview);
  const business = useBusinessStore((state) => state.business);

  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Replied'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [paginatedReviews, setPaginatedReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  const fetchReviews = useCallback(async () => {
    if (!business) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: search,
        rating: String(filterRating),
        status: filterStatus,
      });
      const response = await apiGet<{ data: Review[]; total: number; totalPages: number }>(
        `/business/${business.id}/reviews?${query.toString()}`,
        'BUSINESS'
      );
      setPaginatedReviews(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setIsLoading(false);
    }
  }, [business, page, search, filterRating, filterStatus]);

  useEffect(() => {
    void hydrateReviews();
  }, [hydrateReviews]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReviews();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  useEffect(() => {
    setPage(1);
  }, [search, filterRating, filterStatus]);

  const totalReviews = reviews.length;
  const averageRating = totalReviews === 0 ? '0.0' : (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) {
      toastWarning('Reply empty', 'Write a reply before posting.');
      return;
    }
    setMessage(null);
    try {
      await addReply(id, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
      setMessage({ type: 'success', text: 'Reply posted.' });
      toastSuccess('Reply posted');
      void fetchReviews();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Reply failed.';
      setMessage({ type: 'error', text: msg });
      toastError('Reply failed', msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    setMessage(null);
    try {
      await deleteReview(id);
      setMessage({ type: 'success', text: 'Review deleted.' });
      toastSuccess('Review deleted');
      void fetchReviews();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Delete failed.';
      setMessage({ type: 'error', text: msg });
      toastError('Delete failed', msg);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Reviews & ratings</h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Manage your reputation from real customer feedback</p>
      </div>

      {message && <div className={clsx('rounded-2xl border px-4 py-3 text-sm font-semibold', message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900')}>{message.text}</div>}

      <div className="rounded-[32px] border border-slate-100 bg-white p-10 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col items-center justify-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall rating</p>
            <div className="mt-2 flex items-end gap-3"><span className="text-6xl font-black tracking-tighter text-slate-900">{averageRating}</span><span className="pb-2 text-sm font-bold text-slate-400">/ 5</span></div>
            <div className="mt-2 flex justify-center md:justify-start">{[1,2,3,4,5].map((s)=><Star key={s} size={24} className={clsx(s<=Math.round(Number(averageRating))?'fill-amber-400 text-amber-400':'text-slate-200')} />)}</div>
          </div>
          <div className="w-full max-w-md space-y-3 md:max-w-lg">
            {[5,4,3,2,1].map((rating)=>{const count=reviews.filter((r)=>r.rating===rating).length; const percentage=totalReviews?(count/totalReviews)*100:0; return <div key={rating} className="flex items-center gap-3"><span className="w-4 text-[10px] font-bold text-slate-500">{rating}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-50"><div className="h-full rounded-full bg-amber-400" style={{width:`${percentage}%`}} /></div><span className="w-8 text-[10px] font-bold text-slate-400">{count}</span></div>;})}
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 md:text-right">{totalReviews} total reviews</p>
          </div>
        </div>
      </div>

      <BusinessFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search reviews...">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2"><select className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none" value={filterRating==='all'?'all':String(filterRating)} onChange={(e)=>setFilterRating(e.target.value==='all'?'all':Number(e.target.value))}><option value="all">All stars</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2"><MessageSquare size={14} className="text-slate-400" /><select className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value as 'all'|'Pending'|'Replied')}><option value="all">All statuses</option><option value="Pending">Pending reply</option><option value="Replied">Replied</option></select></div>
      </BusinessFilterToolbar>

      <div className="space-y-4 relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}
        {paginatedReviews.length===0 && !isLoading ? <div className="rounded-[32px] border-2 border-dashed border-slate-100 bg-white p-20 text-center"><MessageSquare size={48} className="mx-auto mb-4 text-slate-200" /><p className="text-sm font-bold uppercase tracking-widest text-slate-400">No reviews matched your filters</p></div> : paginatedReviews.map((review)=>(
          <div key={review.id} className="animate-in fade-in rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 duration-500 slide-in-from-bottom-4">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex shrink-0 flex-col items-center"><div className="h-16 w-16 overflow-hidden rounded-[24px] border-4 border-slate-50 shadow-sm"><img src={review.avatar} alt={review.customerName} className="h-full w-full object-cover" /></div><div className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-tighter text-emerald-600">Verified</div></div>
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h4 className="mb-1 text-lg font-black leading-none text-slate-800">{review.customerName}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(review.date).toLocaleDateString()} · {review.serviceName} with {review.staffName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-black uppercase text-slate-300 mr-1">Overall</span>
                      {[1,2,3,4,5].map((s)=><Star key={s} size={16} className={clsx(s<=review.rating?'fill-amber-400 text-amber-400':'text-slate-100')} />)}
                    </div>
                    {review.staffRating && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black uppercase text-slate-300 mr-1">Staff</span>
                        {[1,2,3,4,5].map((s)=><Star key={s} size={12} className={clsx(s<=(review.staffRating||0)?'fill-blue-400 text-blue-400':'text-slate-100')} />)}
                      </div>
                    )}
                    {review.businessRating && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black uppercase text-slate-300 mr-1">Venue</span>
                        {[1,2,3,4,5].map((s)=><Star key={s} size={12} className={clsx(s<=(review.businessRating||0)?'fill-purple-400 text-purple-400':'text-slate-100')} />)}
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-medium italic leading-relaxed text-slate-600">&ldquo;{review.comment}&rdquo;</p>
                {review.reply ? <div className="relative mt-4 rounded-[24px] border border-slate-100 bg-slate-50 p-6"><div className="absolute -top-3 left-6 rounded-full bg-slate-900 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-white shadow-lg">Your reply</div><p className="text-sm font-bold italic text-slate-600">{review.reply}</p></div> : <div className="pt-2">{replyingTo===review.id ? <div className="animate-in zoom-in-95 space-y-4 duration-300 fade-in"><textarea value={replyText} onChange={(e)=>setReplyText(e.target.value)} placeholder="Write your response..." className="min-h-[120px] w-full rounded-[24px] border border-slate-100 bg-slate-50 p-6 text-sm font-bold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-primary/10" /><div className="flex justify-end gap-3"><button type="button" onClick={()=>setReplyingTo(null)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:text-slate-600">Cancel</button><button type="button" onClick={()=>void handleReply(review.id)} className="rounded-2xl bg-slate-900 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition hover:bg-primary">Send reply</button></div></div> : <button type="button" onClick={()=>setReplyingTo(review.id)} className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-transform hover:translate-x-1"><Reply size={14} /> Reply</button>}</div>}
              </div>
              <div className="shrink-0"><button type="button" onClick={()=>void handleDelete(review.id)} className="rounded-2xl p-3 text-slate-200 transition-colors hover:bg-rose-50 hover:text-rose-500"><Trash2 size={18} /></button></div>
            </div>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
