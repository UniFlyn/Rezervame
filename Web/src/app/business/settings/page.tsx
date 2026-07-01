'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBusinessStore } from '../../../store/businessStore';
import clsx from 'clsx';
import { toastError, toastSuccess } from '@/lib/toast';
import { Menu, LayoutDashboard, Users, List, Calendar, Settings, ShieldCheck, Zap, Clock } from 'lucide-react';
import { formatCancellationPolicyMessage, normalizeCancellationPolicy } from "@/lib/cancellationPolicy";
import { BrowserPushSettings } from '@/components/BrowserPushSettings';

export default function SettingsPage() {
  const business = useBusinessStore((state) => state.business);
  const updateBusiness = useBusinessStore((state) => state.updateBusiness);
  const hydrate = useBusinessStore((state) => state.hydrate);
  const [pending, setPending] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const notifyBooking = business?.notifyBookingEmail ?? true;
  const notifyCancellation = business?.notifyCancellationEmail ?? true;
  const notifyDaily = business?.notifyDailySummary ?? false;
  const approvalMode = business?.appointmentApprovalMode ?? 'manual';
  const cancellationAllowed = business?.cancellationAllowed ?? true;
  const cancellationHoursBefore = business?.cancellationHoursBefore ?? 24;
  const policyPreview = formatCancellationPolicyMessage(
    normalizeCancellationPolicy(business),
    'en',
  );

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
          <p className="mt-0.5 text-sm text-[var(--rz-gray-500)] font-medium">Manage your portal preferences and configurations.</p>
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

      <div className="overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-xl shadow-[color:rgba(231,234,239,0.5)]">
        <div className="border-b border-gray-100 p-10">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Notifications</h3>
          <p className="mb-8 text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
            Choose what we email you about. Changes apply immediately.
          </p>
          <div className="mb-8">
            <BrowserPushSettings role="BUSINESS" language="en" />
          </div>

          <ul className="space-y-6">
            <li className="-mx-4 flex cursor-default items-center justify-between rounded-2xl border-b border-[var(--rz-gray-050)] px-4 py-4 last:border-0 hover:bg-[var(--rz-gray-050)]">
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Booking alerts</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
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
            <li className="-mx-4 flex cursor-default items-center justify-between rounded-2xl border-b border-[var(--rz-gray-050)] px-4 py-4 last:border-0 hover:bg-[var(--rz-gray-050)]">
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Cancellations</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
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
            <li className="-mx-4 flex cursor-default items-center justify-between rounded-2xl px-4 py-4 hover:bg-[var(--rz-gray-050)]">
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Daily summary</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
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

        <div className="border-t border-gray-100 p-10">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Appointment verification</h3>
          <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
            Choose whether new online bookings need your approval or are confirmed instantly.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              disabled={pending === 'appointmentApprovalMode'}
              onClick={() => void savePatch({ appointmentApprovalMode: 'manual' }, 'appointmentApprovalMode')}
              className={clsx(
                'rounded-2xl border-2 p-5 text-left transition-all',
                approvalMode === 'manual'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] hover:border-[var(--rz-gray-200)]',
                pending === 'appointmentApprovalMode' && 'opacity-60',
              )}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[var(--rz-gray-100)]">
                <ShieldCheck className="text-primary" size={20} />
              </div>
              <p className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Manual verification</p>
              <p className="mt-2 text-[10px] font-bold leading-relaxed text-[var(--rz-gray-500)]">
                New bookings stay pending until you approve them in Appointments.
              </p>
            </button>
            <button
              type="button"
              disabled={pending === 'appointmentApprovalMode'}
              onClick={() => void savePatch({ appointmentApprovalMode: 'automatic' }, 'appointmentApprovalMode')}
              className={clsx(
                'rounded-2xl border-2 p-5 text-left transition-all',
                approvalMode === 'automatic'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] hover:border-[var(--rz-gray-200)]',
                pending === 'appointmentApprovalMode' && 'opacity-60',
              )}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[var(--rz-gray-100)]">
                <Zap className="text-primary" size={20} />
              </div>
              <p className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Automatic verification</p>
              <p className="mt-2 text-[10px] font-bold leading-relaxed text-[var(--rz-gray-500)]">
                Bookings are confirmed immediately; customers can pay without waiting for approval.
              </p>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 p-10">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Cancellation policy</h3>
          <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
            Control when customers can cancel bookings. Paid cancellations reverse your wallet credit automatically.
          </p>
          <ul className="mb-8 space-y-6">
            <li className="-mx-4 flex cursor-default items-center justify-between rounded-2xl border-b border-[var(--rz-gray-050)] px-4 py-4 hover:bg-[var(--rz-gray-050)]">
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Allow cancellations</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                  When off, customers cannot cancel (except unpaid pending requests)
                </p>
              </div>
              <Toggle
                pressed={cancellationAllowed}
                disabled={pending === 'cancellationAllowed'}
                onToggle={() =>
                  void savePatch(
                    {
                      cancellationAllowed: !cancellationAllowed,
                      ...(cancellationAllowed ? { cancellationHoursBefore: 0 } : { cancellationHoursBefore: 24 }),
                    },
                    'cancellationAllowed',
                  )
                }
              />
            </li>
          </ul>
          {cancellationAllowed ? (
            <div className="max-w-md space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
                Minimum notice (hours before appointment)
              </label>
              <select
                value={cancellationHoursBefore}
                disabled={pending === 'cancellationHoursBefore'}
                onChange={(e) =>
                  void savePatch(
                    { cancellationHoursBefore: Number(e.target.value), cancellationAllowed: true },
                    'cancellationHoursBefore',
                  )
                }
                className="w-full rounded-2xl border border-[var(--rz-gray-200)] bg-[var(--rz-gray-050)] px-4 py-3 text-sm font-bold text-[var(--rz-navy-800)] outline-none focus:border-primary"
              >
                <option value={0}>Anytime before appointment</option>
                <option value={2}>2 hours</option>
                <option value={6}>6 hours</option>
                <option value={10}>10 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
              </select>
            </div>
          ) : null}
          <div className="mt-8 flex gap-3 rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-navy)] p-5 text-white">
            <Clock className="shrink-0 text-[#ff5757]" size={20} />
            <p className="text-xs font-medium leading-relaxed text-white/85">{policyPreview}</p>
          </div>
        </div>

        <div className="p-10 border-t border-gray-100">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Tax Settings</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)] mb-6">
            Set the tax percentage applied to your services.
          </p>
          <div className="flex items-center gap-4 max-w-xs">
            <TaxInput 
              initialValue={business?.taxPercentage ?? 0} 
              onSave={(val) => savePatch({ taxPercentage: val }, 'taxPercentage')} 
            />
            <span className="text-xl font-black text-[var(--rz-gray-500)]">%</span>
          </div>
        </div>

        <div className="p-10 border-t border-gray-100">
          <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-[var(--rz-navy-800)]">Public profile hints</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
            Your brand name appears on receipts and confirmations.
          </p>
          <p className="mt-4 rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-6 text-sm text-[var(--rz-gray-600)]">
            <span className="font-black text-[var(--rz-navy)]">{business?.name}</span>
          </p>
          <p className="mt-4 text-[10px] font-bold uppercase text-[var(--rz-gray-500)]">
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
          : 'border-[var(--rz-gray-200)] bg-[var(--rz-gray-100)]',
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
      className="w-full px-6 py-4 bg-[var(--rz-gray-050)] border-2 border-[var(--rz-gray-100)] rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-bold transition-all"
    />
  );
}
