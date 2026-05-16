'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '../../../store/businessStore';
import clsx from 'clsx';
import { toastError, toastSuccess } from '@/lib/toast';
import { Menu, LayoutDashboard, Users, List, Calendar, Settings } from 'lucide-react';

export default function SettingsPage() {
  const business = useBusinessStore((state) => state.business);
  const updateBusiness = useBusinessStore((state) => state.updateBusiness);
  const [pending, setPending] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notifyBooking = business?.notifyBookingEmail ?? true;
  const notifyCancellation = business?.notifyCancellationEmail ?? true;
  const notifyDaily = business?.notifyDailySummary ?? false;

  async function savePatch(patch: Partial<Parameters<typeof updateBusiness>[0]>, key: string) {
    setPending(key);
    setBanner(null);
    try {
      await updateBusiness(patch);
      setBanner({ type: 'success', text: 'Settings saved.' });
      toastSuccess('Settings saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed.';
      setBanner({ type: 'error', text: msg });
      toastError('Save failed', msg);
    } finally {
      setPending(null);
    }
  }

  async function toggle(
    key:
      | 'notifyBookingEmail'
      | 'notifyCancellationEmail'
      | 'notifyDailySummary',
    value: boolean,
  ) {
    await savePatch({ [key]: value }, key);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl uppercase">Settings</h2>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">Manage your portal preferences and configurations.</p>
        </div>
      </div>

      {banner ? (
        <div
          className={clsx(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            banner.type === 'success' &&
              'border-emerald-200 bg-emerald-50 text-emerald-900',
            banner.type === 'error' &&
              'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          {banner.text}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-xl shadow-slate-200/50">
        <div className="border-b border-gray-100 p-10">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-slate-800">Notifications</h3>
          <p className="mb-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Choose what we email you about. Changes apply immediately.
          </p>

          <ul className="space-y-6">
            <li className="-mx-4 flex cursor-default items-center justify-between rounded-2xl border-b border-slate-50 px-4 py-4 last:border-0 hover:bg-slate-50">
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-slate-800">Booking alerts</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  New appointments and confirmations
                </p>
              </div>
              <Toggle
                pressed={notifyBooking}
                disabled={pending === 'notifyBookingEmail'}
                onToggle={() =>
                  toggle('notifyBookingEmail', !notifyBooking)
                }
              />
            </li>
            <li className="-mx-4 flex cursor-default items-center justify-between rounded-2xl border-b border-slate-50 px-4 py-4 last:border-0 hover:bg-slate-50">
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-slate-800">Cancellations</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  When a client cancels or reschedules
                </p>
              </div>
              <Toggle
                pressed={notifyCancellation}
                disabled={pending === 'notifyCancellationEmail'}
                onToggle={() =>
                  toggle('notifyCancellationEmail', !notifyCancellation)
                }
              />
            </li>
            <li className="-mx-4 flex cursor-default items-center justify-between rounded-2xl px-4 py-4 hover:bg-slate-50">
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-slate-800">Daily summary</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  End-of-day digest of bookings
                </p>
              </div>
              <Toggle
                pressed={notifyDaily}
                disabled={pending === 'notifyDailySummary'}
                onToggle={() =>
                  toggle('notifyDailySummary', !notifyDaily)
                }
              />
            </li>
          </ul>
        </div>

        <div className="p-10">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-slate-800">Tax Settings</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
            Set the tax percentage applied to your services.
          </p>
          <div className="flex items-center gap-4 max-w-xs">
            <TaxInput 
              initialValue={business?.taxPercentage ?? 0} 
              onSave={(val) => savePatch({ taxPercentage: val }, 'taxPercentage')} 
            />
            <span className="text-xl font-black text-slate-400">%</span>
          </div>
        </div>

        <div className="p-10 border-t border-gray-100">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-slate-800">Public profile hints</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Your brand name appears on receipts and confirmations.
          </p>
          <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">
            <span className="font-black text-slate-900">{business?.name}</span>
          </p>
          <p className="mt-4 text-[10px] font-bold uppercase text-slate-400">
            Manage address and contacts from Profile.
          </p>
        </div>
      </div>
    </div>
  );
}

function Toggle(props: {
  pressed: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={() => props.onToggle()}
      className={clsx(
        'relative h-9 w-[52px] shrink-0 rounded-full border transition-colors',
        props.pressed
          ? 'border-primary bg-primary'
          : 'border-slate-200 bg-slate-100',
        props.disabled ? 'opacity-50' : 'cursor-pointer hover:brightness-105',
      )}
      aria-pressed={props.pressed}
    >
      <span
        className={clsx(
          'absolute top-1 inline-block h-7 w-7 rounded-full bg-white shadow transition-[left]',
          props.pressed ? 'left-8' : 'left-1',
        )}
      />
    </button>
  );
}

function TaxInput({ initialValue, onSave }: { initialValue: number; onSave: (val: number) => void }) {
  const [localValue, setLocalValue] = useState(String(initialValue));

  useEffect(() => {
    setLocalValue(String(initialValue));
  }, [initialValue]);

  return (
    <input
      type="number"
      min="0"
      max="100"
      step="0.1"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const val = parseFloat(localValue) || 0;
        if (val !== initialValue) {
          onSave(val);
        }
      }}
      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
    />
  );
}
