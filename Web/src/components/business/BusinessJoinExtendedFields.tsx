"use client";

import React from "react";
import {
  ACCOUNT_TYPE_OPTIONS,
  APPOINTMENT_MODE_OPTIONS,
  BANK_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
  LOCATION_ACCESS_OPTIONS,
  OFFERED_SERVICE_OPTIONS,
  PARKING_OPTIONS,
  PERSON_TYPE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  STAFF_COUNT_OPTIONS,
  WEEKDAY_OPTIONS,
  YEARS_OPERATING_OPTIONS,
  labelForOption,
  type BusinessRegistrationDetails,
} from "@/lib/businessJoinConfig";

const inputClass =
  "w-full bg-[var(--rz-gray-050)] border border-[var(--rz-gray-200)] rounded-2xl px-4 py-3.5 text-sm font-semibold text-[var(--rz-navy-800)] transition-all focus:outline-none focus:border-[#ff5757] focus:bg-white focus:ring-2 focus:ring-[#ff5757]/10";
const labelClass = "text-[11px] font-bold text-[var(--rz-gray-500)] uppercase tracking-wide";

type Lang = "en" | "es";

function SelectField({
  label,
  value,
  onChange,
  options,
  lang,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; labelEn: string; labelEs: string }[];
  lang: Lang;
  required?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className={labelClass}>{label}</label>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {labelForOption(options, o.value, lang) || (lang === "es" ? o.labelEs : o.labelEn)}
          </option>
        ))}
      </select>
    </div>
  );
}

export type JoinExtendedState = BusinessRegistrationDetails & {
  businessType: string;
  country: string;
  state: string;
  city: string;
  yearsOperating: string;
  locationAccess: string;
  buildingName: string;
  floor: string;
  localNumber: string;
  locationReferences: string;
  specialDirections: string;
  parking: string;
  personType: string;
  companyName: string;
  companyType: string;
  ownerId: string;
  ownerPhone: string;
  ownerEmail: string;
  bank: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  offeredServices: string[];
  priceRange: string;
  openTime: string;
  closeTime: string;
  operatingDays: string[];
  appointments: string;
  staffCount: string;
  additionalInfo: string;
  marketingOptIn: boolean;
};

export function LocationRegionFields({
  lang,
  details,
  setDetails,
}: {
  lang: Lang;
  details: JoinExtendedState;
  setDetails: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const patch = (p: Partial<JoinExtendedState>) => setDetails((d) => ({ ...d, ...p }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SelectField
        label={lang === "es" ? "País" : "Country"}
        value={details.country}
        onChange={(v) => patch({ country: v })}
        options={COUNTRY_OPTIONS}
        lang={lang}
        required
      />
      <div className="space-y-2">
        <label className={labelClass}>{lang === "es" ? "Provincia / estado" : "State / province"}</label>
        <input
          className={inputClass}
          value={details.state}
          onChange={(e) => patch({ state: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label className={labelClass}>{lang === "es" ? "Ciudad" : "City"}</label>
        <input
          className={inputClass}
          value={details.city}
          onChange={(e) => patch({ city: e.target.value })}
          required
        />
      </div>
    </div>
  );
}

export function LocationDetailFields({
  lang,
  details,
  setDetails,
}: {
  lang: Lang;
  details: JoinExtendedState;
  setDetails: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const patch = (p: Partial<JoinExtendedState>) => setDetails((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-6">
      <SelectField
        label={lang === "es" ? "Años en operación" : "Years operating"}
        value={details.yearsOperating}
        onChange={(v) => patch({ yearsOperating: v })}
        options={YEARS_OPERATING_OPTIONS}
        lang={lang}
        required
      />
      <div className="space-y-3">
        <p className={labelClass}>{lang === "es" ? "Acceso al local" : "Location access"}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LOCATION_ACCESS_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer text-sm ${
                details.locationAccess === o.value
                  ? "border-[#ff5757] bg-[#ff5757]/5"
                  : "border-[var(--rz-gray-200)]"
              }`}
            >
              <input
                type="radio"
                name="locationAccess"
                checked={details.locationAccess === o.value}
                onChange={() => patch({ locationAccess: o.value })}
                required={!details.locationAccess}
                className="mt-0.5"
              />
              <span className="font-semibold text-[var(--rz-gray-700)]">
                {lang === "es" ? o.labelEs : o.labelEn}
              </span>
            </label>
          ))}
        </div>
      </div>
      {details.locationAccess === "edificio" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>{lang === "es" ? "Edificio / plaza" : "Building / mall"}</label>
            <input
              className={inputClass}
              value={details.buildingName}
              onChange={(e) => patch({ buildingName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>{lang === "es" ? "Piso" : "Floor"}</label>
            <input className={inputClass} value={details.floor} onChange={(e) => patch({ floor: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>{lang === "es" ? "Número de local" : "Unit / suite"}</label>
            <input
              className={inputClass}
              value={details.localNumber}
              onChange={(e) => patch({ localNumber: e.target.value })}
            />
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        <label className={labelClass}>{lang === "es" ? "Referencias" : "Landmarks"}</label>
        <textarea
          className={`${inputClass} min-h-[72px] resize-none`}
          rows={2}
          value={details.locationReferences}
          onChange={(e) => patch({ locationReferences: e.target.value })}
        />
      </div>
      <div className="space-y-3">
        <p className={labelClass}>{lang === "es" ? "Estacionamiento" : "Parking"}</p>
        <div className="flex flex-wrap gap-2">
          {PARKING_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                details.parking === o.value
                  ? "border-[#ff5757] bg-[#ff5757]/5 text-[#ff5757]"
                  : "border-[var(--rz-gray-200)] text-[var(--rz-gray-600)]"
              }`}
            >
              <input
                type="radio"
                name="parking"
                checked={details.parking === o.value}
                onChange={() => patch({ parking: o.value })}
                className="sr-only"
              />
              {lang === "es" ? o.labelEs : o.labelEn}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BusinessStepExtendedFields({
  lang,
  details,
  setDetails,
}: {
  lang: Lang;
  details: JoinExtendedState;
  setDetails: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const patch = (p: Partial<JoinExtendedState>) => setDetails((d) => ({ ...d, ...p }));
  const toggleDay = (day: string) => {
    setDetails((d) => ({
      ...d,
      operatingDays: d.operatingDays.includes(day)
        ? d.operatingDays.filter((x) => x !== day)
        : [...d.operatingDays, day],
    }));
  };
  const toggleOffered = (svc: string) => {
    setDetails((d) => ({
      ...d,
      offeredServices: d.offeredServices.includes(svc)
        ? d.offeredServices.filter((x) => x !== svc)
        : [...d.offeredServices, svc],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectField
          label={lang === "es" ? "País" : "Country"}
          value={details.country}
          onChange={(v) => patch({ country: v })}
          options={COUNTRY_OPTIONS}
          lang={lang}
          required
        />
        <div className="space-y-3">
          <label className={labelClass}>{lang === "es" ? "Provincia / estado" : "State / province"}</label>
          <input
            className={inputClass}
            value={details.state}
            onChange={(e) => patch({ state: e.target.value })}
            required
          />
        </div>
        <div className="space-y-3">
          <label className={labelClass}>{lang === "es" ? "Ciudad" : "City"}</label>
          <input
            className={inputClass}
            value={details.city}
            onChange={(e) => patch({ city: e.target.value })}
            required
          />
        </div>
      </div>
      <SelectField
        label={lang === "es" ? "Años en operación" : "Years operating"}
        value={details.yearsOperating}
        onChange={(v) => patch({ yearsOperating: v })}
        options={YEARS_OPERATING_OPTIONS}
        lang={lang}
        required
      />
      <div className="space-y-4">
        <p className={labelClass}>{lang === "es" ? "Acceso al local" : "Location access"}</p>
        <div className="grid gap-3">
          {LOCATION_ACCESS_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-start gap-3 rounded-2xl border-2 p-4 cursor-pointer ${
                details.locationAccess === o.value
                  ? "border-[#ff5757] bg-[#ff5757]/5"
                  : "border-[var(--rz-gray-100)]"
              }`}
            >
              <input
                type="radio"
                name="locationAccess"
                checked={details.locationAccess === o.value}
                onChange={() => patch({ locationAccess: o.value })}
                required={!details.locationAccess}
              />
              <span className="text-sm font-bold text-[var(--rz-gray-700)]">
                {lang === "es" ? o.labelEs : o.labelEn}
              </span>
            </label>
          ))}
        </div>
      </div>
      {details.locationAccess === "edificio" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className={labelClass}>{lang === "es" ? "Edificio / plaza" : "Building / mall"}</label>
            <input
              className={inputClass}
              value={details.buildingName}
              onChange={(e) => patch({ buildingName: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <label className={labelClass}>{lang === "es" ? "Piso" : "Floor"}</label>
            <input className={inputClass} value={details.floor} onChange={(e) => patch({ floor: e.target.value })} />
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className={labelClass}>{lang === "es" ? "Número de local" : "Unit / suite"}</label>
            <input
              className={inputClass}
              value={details.localNumber}
              onChange={(e) => patch({ localNumber: e.target.value })}
            />
          </div>
        </div>
      ) : null}
      <div className="space-y-3">
        <label className={labelClass}>{lang === "es" ? "Referencias" : "Landmarks"}</label>
        <textarea
          className={`${inputClass} min-h-[88px]`}
          rows={3}
          value={details.locationReferences}
          onChange={(e) => patch({ locationReferences: e.target.value })}
        />
      </div>
      <div className="space-y-3">
        <label className={labelClass}>{lang === "es" ? "Indicaciones especiales" : "Special directions"}</label>
        <textarea
          className={`${inputClass} min-h-[88px]`}
          rows={3}
          value={details.specialDirections}
          onChange={(e) => patch({ specialDirections: e.target.value })}
        />
      </div>
      <div className="space-y-4">
        <p className={labelClass}>{lang === "es" ? "Estacionamiento" : "Parking"}</p>
        <div className="flex flex-wrap gap-3">
          {PARKING_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm font-bold text-[var(--rz-gray-600)]">
              <input
                type="radio"
                name="parking"
                checked={details.parking === o.value}
                onChange={() => patch({ parking: o.value })}
              />
              {lang === "es" ? o.labelEs : o.labelEn}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OwnerIdentityFields({
  lang,
  details,
  setDetails,
}: {
  lang: Lang;
  details: JoinExtendedState;
  setDetails: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const patch = (p: Partial<JoinExtendedState>) => setDetails((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className={labelClass}>{lang === "es" ? "Tipo de titular" : "Owner type"}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PERSON_TYPE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer ${
                details.personType === o.value ? "border-[#ff5757] bg-[#ff5757]/5" : "border-[var(--rz-gray-200)]"
              }`}
            >
              <input
                type="radio"
                name="personType"
                checked={details.personType === o.value}
                onChange={() => patch({ personType: o.value })}
                required={!details.personType}
              />
              <span className="text-sm font-semibold">{lang === "es" ? o.labelEs : o.labelEn}</span>
            </label>
          ))}
        </div>
      </div>
      {details.personType === "juridica" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-[var(--rz-gray-100)] bg-[#f7f8fa]/80 p-4">
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>{lang === "es" ? "Razón social" : "Legal company name"}</label>
            <input
              className={inputClass}
              value={details.companyName}
              onChange={(e) => patch({ companyName: e.target.value })}
            />
          </div>
          <SelectField
            label={lang === "es" ? "Tipo de empresa" : "Company type"}
            value={details.companyType}
            onChange={(v) => patch({ companyType: v })}
            options={COMPANY_TYPE_OPTIONS}
            lang={lang}
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <label className={labelClass}>{lang === "es" ? "Documento del titular" : "Owner ID document"}</label>
        <input
          className={inputClass}
          value={details.ownerId}
          onChange={(e) => patch({ ownerId: e.target.value })}
          placeholder={lang === "es" ? "Cédula / DNI / pasaporte" : "National ID / passport"}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>{lang === "es" ? "Teléfono del titular" : "Owner phone"}</label>
          <input
            className={inputClass}
            type="tel"
            value={details.ownerPhone}
            onChange={(e) => patch({ ownerPhone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>{lang === "es" ? "Email del titular" : "Owner email"}</label>
          <input
            className={inputClass}
            type="email"
            value={details.ownerEmail}
            onChange={(e) => patch({ ownerEmail: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export function BankPayoutFields({
  lang,
  details,
  setDetails,
}: {
  lang: Lang;
  details: JoinExtendedState;
  setDetails: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const patch = (p: Partial<JoinExtendedState>) => setDetails((d) => ({ ...d, ...p }));

  return (
    <div className="rounded-2xl border border-[var(--rz-gray-100)] bg-[#f7f8fa]/50 p-5 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--rz-gray-500)]">
        {lang === "es" ? "Datos bancarios (pagos)" : "Bank details (payouts)"}
      </p>
      <SelectField
        label={lang === "es" ? "Banco" : "Bank"}
        value={details.bank}
        onChange={(v) => patch({ bank: v })}
        options={BANK_OPTIONS}
        lang={lang}
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label={lang === "es" ? "Tipo de cuenta" : "Account type"}
          value={details.accountType}
          onChange={(v) => patch({ accountType: v })}
          options={ACCOUNT_TYPE_OPTIONS}
          lang={lang}
          required
        />
        <div className="space-y-2">
          <label className={labelClass}>{lang === "es" ? "Número de cuenta" : "Account number"}</label>
          <input
            className={inputClass}
            value={details.accountNumber}
            onChange={(e) => patch({ accountNumber: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className={labelClass}>{lang === "es" ? "Titular de la cuenta" : "Account holder"}</label>
        <input
          className={inputClass}
          value={details.accountHolder}
          onChange={(e) => patch({ accountHolder: e.target.value })}
          required
        />
      </div>
    </div>
  );
}

export function OwnerBankStepFields({
  lang,
  details,
  setDetails,
}: {
  lang: Lang;
  details: JoinExtendedState;
  setDetails: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const patch = (p: Partial<JoinExtendedState>) => setDetails((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <p className={labelClass}>{lang === "es" ? "Tipo de titular" : "Owner type"}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {PERSON_TYPE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 cursor-pointer ${
                details.personType === o.value ? "border-[#ff5757] bg-[#ff5757]/5" : "border-[var(--rz-gray-100)]"
              }`}
            >
              <input
                type="radio"
                name="personType"
                checked={details.personType === o.value}
                onChange={() => patch({ personType: o.value })}
                required={!details.personType}
              />
              <span className="text-sm font-bold">{lang === "es" ? o.labelEs : o.labelEn}</span>
            </label>
          ))}
        </div>
      </div>
      {details.personType === "juridica" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-3xl border border-[var(--rz-gray-100)] bg-[#f7f8fa]/80 p-6">
          <div className="space-y-3 md:col-span-2">
            <label className={labelClass}>{lang === "es" ? "Razón social" : "Legal company name"}</label>
            <input
              className={inputClass}
              value={details.companyName}
              onChange={(e) => patch({ companyName: e.target.value })}
            />
          </div>
          <SelectField
            label={lang === "es" ? "Tipo de empresa" : "Company type"}
            value={details.companyType}
            onChange={(v) => patch({ companyType: v })}
            options={COMPANY_TYPE_OPTIONS}
            lang={lang}
          />
        </div>
      ) : null}
      <div className="space-y-3">
        <label className={labelClass}>{lang === "es" ? "Documento del titular" : "Owner ID document"}</label>
        <input
          className={inputClass}
          value={details.ownerId}
          onChange={(e) => patch({ ownerId: e.target.value })}
          placeholder={lang === "es" ? "Cédula / DNI / pasaporte" : "National ID / passport"}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className={labelClass}>{lang === "es" ? "Teléfono del titular" : "Owner phone"}</label>
          <input
            className={inputClass}
            type="tel"
            value={details.ownerPhone}
            onChange={(e) => patch({ ownerPhone: e.target.value })}
          />
        </div>
        <div className="space-y-3">
          <label className={labelClass}>{lang === "es" ? "Email del titular" : "Owner email"}</label>
          <input
            className={inputClass}
            type="email"
            value={details.ownerEmail}
            onChange={(e) => patch({ ownerEmail: e.target.value })}
          />
        </div>
      </div>
      <div className="rounded-3xl border border-[var(--rz-gray-100)] p-6 space-y-6">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
          {lang === "es" ? "Datos bancarios (pagos)" : "Bank details (payouts)"}
        </p>
        <SelectField
          label={lang === "es" ? "Banco" : "Bank"}
          value={details.bank}
          onChange={(v) => patch({ bank: v })}
          options={BANK_OPTIONS}
          lang={lang}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label={lang === "es" ? "Tipo de cuenta" : "Account type"}
            value={details.accountType}
            onChange={(v) => patch({ accountType: v })}
            options={ACCOUNT_TYPE_OPTIONS}
            lang={lang}
            required
          />
          <div className="space-y-3">
            <label className={labelClass}>{lang === "es" ? "Número de cuenta" : "Account number"}</label>
            <input
              className={inputClass}
              value={details.accountNumber}
              onChange={(e) => patch({ accountNumber: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-3">
          <label className={labelClass}>{lang === "es" ? "Titular de la cuenta" : "Account holder"}</label>
          <input
            className={inputClass}
            value={details.accountHolder}
            onChange={(e) => patch({ accountHolder: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
}

export function OperationsStepFields({
  lang,
  details,
  setDetails,
}: {
  lang: Lang;
  details: JoinExtendedState;
  setDetails: React.Dispatch<React.SetStateAction<JoinExtendedState>>;
}) {
  const patch = (p: Partial<JoinExtendedState>) => setDetails((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <p className={labelClass}>{lang === "es" ? "Servicios que ofreces" : "Services you offer"}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {OFFERED_SERVICE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-3 text-[11px] font-bold cursor-pointer ${
                details.offeredServices.includes(o.value)
                  ? "border-[#ff5757] bg-[#ff5757]/5 text-[#ff5757]"
                  : "border-[var(--rz-gray-100)] text-[var(--rz-gray-600)]"
              }`}
            >
              <input
                type="checkbox"
                checked={details.offeredServices.includes(o.value)}
                onChange={() =>
                  setDetails((d) => ({
                    ...d,
                    offeredServices: d.offeredServices.includes(o.value)
                      ? d.offeredServices.filter((x) => x !== o.value)
                      : [...d.offeredServices, o.value],
                  }))
                }
              />
              {lang === "es" ? o.labelEs : o.labelEn}
            </label>
          ))}
        </div>
      </div>
      <SelectField
        label={lang === "es" ? "Rango de precios" : "Price range"}
        value={details.priceRange}
        onChange={(v) => patch({ priceRange: v })}
        options={PRICE_RANGE_OPTIONS}
        lang={lang}
      />
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className={labelClass}>{lang === "es" ? "Apertura" : "Opens"}</label>
          <input
            type="time"
            className={inputClass}
            value={details.openTime}
            onChange={(e) => patch({ openTime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-3">
          <label className={labelClass}>{lang === "es" ? "Cierre" : "Closes"}</label>
          <input
            type="time"
            className={inputClass}
            value={details.closeTime}
            onChange={(e) => patch({ closeTime: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-3">
        <p className={labelClass}>{lang === "es" ? "Días de operación" : "Operating days"}</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() =>
                setDetails((prev) => ({
                  ...prev,
                  operatingDays: prev.operatingDays.includes(d.value)
                    ? prev.operatingDays.filter((x) => x !== d.value)
                    : [...prev.operatingDays, d.value],
                }))
              }
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${
                details.operatingDays.includes(d.value)
                  ? "bg-[var(--rz-navy)] text-white"
                  : "bg-[var(--rz-gray-100)] text-[var(--rz-gray-500)]"
              }`}
            >
              {lang === "es" ? d.labelEs : d.labelEn}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <p className={labelClass}>{lang === "es" ? "Tipo de citas" : "Appointments"}</p>
        {APPOINTMENT_MODE_OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-3 text-sm font-bold text-[var(--rz-gray-700)]">
            <input
              type="radio"
              name="appointments"
              checked={details.appointments === o.value}
              onChange={() => patch({ appointments: o.value })}
              required={!details.appointments}
            />
            {lang === "es" ? o.labelEs : o.labelEn}
          </label>
        ))}
      </div>
      <SelectField
        label={lang === "es" ? "Tamaño del equipo" : "Team size"}
        value={details.staffCount}
        onChange={(v) => patch({ staffCount: v })}
        options={STAFF_COUNT_OPTIONS}
        lang={lang}
      />
      <div className="space-y-3">
        <label className={labelClass}>{lang === "es" ? "Información adicional" : "Additional notes"}</label>
        <textarea
          className={`${inputClass} min-h-[120px]`}
          rows={4}
          value={details.additionalInfo}
          onChange={(e) => patch({ additionalInfo: e.target.value })}
        />
      </div>
    </div>
  );
}

export function ExtraDocumentUpload({
  title,
  hint,
  value,
  uploading,
  onPick,
  uploadLabel,
  okLabel,
}: {
  title: string;
  hint?: string;
  value: string;
  uploading: boolean;
  onPick: (file: File, input: HTMLInputElement | null) => void;
  uploadLabel: string;
  okLabel: string;
}) {
  const id = `doc-extra-${title.replace(/\s+/g, "-")}`;
  return (
    <div className="rounded-3xl border-2 border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-4">
      <p className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-[0.15em] mb-1">{title}</p>
      {hint ? <p className="text-xs text-[var(--rz-gray-500)] mb-3">{hint}</p> : null}
      {value ? (
        <img src={value} alt="" className="w-full h-28 rounded-2xl object-cover border mb-3" />
      ) : (
        <div className="h-28 rounded-2xl border border-dashed border-[var(--rz-gray-200)] mb-3 flex items-center justify-center text-[10px] font-black uppercase text-[var(--rz-gray-500)]">
          {uploadLabel}
        </div>
      )}
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onPick(file, e.currentTarget);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => (document.getElementById(id) as HTMLInputElement | null)?.click()}
        className="w-full rounded-2xl bg-white border border-[var(--rz-gray-200)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--rz-gray-600)] hover:border-[#ff5757] disabled:opacity-50"
      >
        {uploading ? "…" : value ? okLabel : uploadLabel}
      </button>
    </div>
  );
}
