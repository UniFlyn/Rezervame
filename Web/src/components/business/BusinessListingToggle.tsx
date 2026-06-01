'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useBusinessStore } from '@/store/businessStore';
import { apiPatch } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { resolveSetupStatus } from '@/lib/businessSetup';
import Link from 'next/link';

export function BusinessListingToggle() {
  const business = useBusinessStore((s) => s.business);
  const hydrate = useBusinessStore((s) => s.hydrate);
  const [pending, setPending] = useState(false);

  if (!business) return null;

  const setup = resolveSetupStatus(business);
  const status = (business.status || '').toLowerCase();
  const isActive = status === 'active';
  const visible = Boolean(business.listingVisible);
  const toggleDisabled = pending || !isActive || !setup.canEnableListing;

  async function setVisible(next: boolean) {
    if (!business) return;
    setPending(true);
    try {
      await apiPatch(`/business/${business.id}/listing-visibility`, { visible: next }, 'BUSINESS');
      await hydrate();
      toastSuccess(next ? 'Your business is now visible on the app and web' : 'Your business is hidden from discovery');
    } catch (e) {
      toastError('Could not update visibility', e instanceof Error ? e.message : 'Request failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Home & search</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">
            Public visibility
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-500">
            When visible, customers can find and book you on the website and mobile app. When hidden, your
            storefront stays off discovery lists.
          </p>
          {!isActive ? (
            <p className="mt-3 text-xs font-bold text-amber-700">
              Your account must be approved by platform admin before you can go live.
            </p>
          ) : null}
          {isActive && !setup.complete ? (
            <p className="mt-3 text-xs font-bold text-amber-700">
              Complete{' '}
              <Link href="/business/setup" className="underline">
                business setup
              </Link>{' '}
              to unlock this toggle.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={clsx(
              'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest',
              visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
            )}
          >
            {visible ? 'Visible' : 'Hidden'}
          </span>
          <button
            type="button"
            disabled={toggleDisabled}
            onClick={() => void setVisible(!visible)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest transition',
              toggleDisabled && 'cursor-not-allowed opacity-50',
              visible
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-primary text-white hover:opacity-90',
            )}
            aria-pressed={visible}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {visible ? 'Hide' : 'Go visible'}
          </button>
        </div>
      </div>
    </div>
  );
}
