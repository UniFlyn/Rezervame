'use client';

import React from 'react';
import {
  BankPayoutFields,
  LocationDetailFields,
  LocationRegionFields,
  OperationsStepFields,
  OwnerIdentityFields,
  type JoinExtendedState,
} from '@/components/business/BusinessJoinExtendedFields';
import type { BusinessRegistrationDetails } from '@/lib/businessJoinConfig';

export const EMPTY_REGISTRATION_EXTENDED: JoinExtendedState = {
  businessType: '',
  country: 'PA',
  state: '',
  city: '',
  yearsOperating: '',
  locationAccess: '',
  buildingName: '',
  floor: '',
  localNumber: '',
  locationReferences: '',
  specialDirections: '',
  parking: '',
  personType: 'natural',
  companyName: '',
  companyType: '',
  ownerId: '',
  ownerPhone: '',
  ownerEmail: '',
  bank: '',
  accountType: '',
  accountNumber: '',
  accountHolder: '',
  offeredServices: [],
  priceRange: '',
  openTime: '09:00',
  closeTime: '18:00',
  operatingDays: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
  appointments: '',
  staffCount: '',
  additionalInfo: '',
  marketingOptIn: false,
  latitude: null,
  longitude: null,
};

export function mergeRegistrationExtended(
  businessType: string,
  rd: BusinessRegistrationDetails | null | undefined,
  business?: {
    latitude?: number | null;
    longitude?: number | null;
    contactPhone?: string;
    contactEmail?: string;
  },
): JoinExtendedState {
  const base = { ...EMPTY_REGISTRATION_EXTENDED, businessType: businessType || rd?.businessType || '' };
  if (!rd) {
    return {
      ...base,
      latitude: business?.latitude ?? null,
      longitude: business?.longitude ?? null,
      ownerPhone: business?.contactPhone || '',
      ownerEmail: business?.contactEmail || '',
    };
  }
  return {
    ...base,
    ...rd,
    businessType: businessType || rd.businessType || '',
    offeredServices: Array.isArray(rd.offeredServices) ? [...rd.offeredServices] : [],
    operatingDays: Array.isArray(rd.operatingDays) ? [...rd.operatingDays] : base.operatingDays,
    latitude: rd.latitude ?? business?.latitude ?? null,
    longitude: rd.longitude ?? business?.longitude ?? null,
    marketingOptIn: Boolean(rd.marketingOptIn),
  };
}

export function BusinessProfileRegistrationFields({
  lang,
  extended,
  setExtended,
}: {
  lang: 'en' | 'es';
  extended: JoinExtendedState;
  setExtended: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const sectionTitle = 'text-sm font-black uppercase tracking-tight text-[var(--rz-navy-800)]';
  const sectionSub =
    'mt-2 text-[10px] font-bold uppercase leading-relaxed tracking-widest text-[var(--rz-gray-500)]';

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
        <h4 className={sectionTitle}>Location & region</h4>
        <p className={sectionSub}>Same fields as partner registration — country, city, and access.</p>
        <div className="mt-6">
          <LocationRegionFields lang={lang} details={extended} setDetails={setExtended} />
        </div>
      </section>

      <section className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
        <h4 className={sectionTitle}>Location details</h4>
        <p className={sectionSub}>Building, parking, and directions for customers.</p>
        <div className="mt-6">
          <LocationDetailFields lang={lang} details={extended} setDetails={setExtended} />
        </div>
      </section>

      <section className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
        <h4 className={sectionTitle}>Owner & legal</h4>
        <p className={sectionSub}>Identity and company information from your application.</p>
        <div className="mt-6">
          <OwnerIdentityFields lang={lang} details={extended} setDetails={setExtended} />
        </div>
      </section>

      <section className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
        <h4 className={sectionTitle}>Payout bank</h4>
        <p className={sectionSub}>Bank account used for withdrawals (from registration).</p>
        <div className="mt-6">
          <BankPayoutFields lang={lang} details={extended} setDetails={setExtended} />
        </div>
      </section>

      <section className="rounded-2xl border-2 border-[var(--rz-gray-100)] bg-[#f7f8fa]/90 p-5 sm:rounded-[28px] sm:p-6 md:p-8">
        <h4 className={sectionTitle}>Operations</h4>
        <p className={sectionSub}>Services offered, hours template, appointments, and team size.</p>
        <div className="mt-6">
          <OperationsStepFields lang={lang} details={extended} setDetails={setExtended} />
        </div>
      </section>
    </div>
  );
}
