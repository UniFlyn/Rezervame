export default function VenueRouteLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-white px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff5a5f] border-t-transparent"
        role="status"
        aria-label="Loading"
      />
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Loading…</p>
    </div>
  );
}
