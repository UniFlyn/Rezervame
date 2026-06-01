"use client";

export type VenueDetailSection = {
  title: string;
  rows: { label: string; value: string }[];
};

export function VenueDetailSections({ sections }: { sections: VenueDetailSection[] }) {
  if (!sections?.length) return null;
  return (
    <div className="space-y-4 mt-4">
      {sections.map((sec) => (
        <div key={sec.title}>
          <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-wide mb-2">{sec.title}</p>
          <dl className="space-y-2">
            {sec.rows.map((row) => (
              <div key={`${sec.title}-${row.label}`} className="flex justify-between gap-3 text-[13px] border-b border-slate-100 pb-2 last:border-0">
                <dt className="font-semibold text-slate-600 shrink-0">{row.label}</dt>
                <dd className="font-bold text-slate-900 text-right break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
