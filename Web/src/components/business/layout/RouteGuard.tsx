'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBusinessStore } from '../../../store/businessStore';
import { useBookingsStore } from '../../../store/bookingsStore';
import { useReviewsStore } from '../../../store/reviewsStore';
import { useServicesStore } from '../../../store/servicesStore';
import { useStaffStore } from '../../../store/staffStore';
import { useTransactionsStore } from '../../../store/transactionsStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** Route segments served by the salon/business dashboard (merchant auth). Everything else under `/business/[segment]` is a public storefront or booking UI. */
const MERCHANT_PANEL_SEGMENTS = new Set([
  'dashboard',
  'join',
  'login',
  'appointments',
  'bookings',
  'services',
  'settings',
  'profile',
  'users',
  'staff',
  'reviews',
  'transactions',
  'withdrawals',
  'support',
]);

function isMerchantPanelPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] !== 'business') return false;
  if (parts.length < 2) return true;
  return MERCHANT_PANEL_SEGMENTS.has(parts[1]);
}

function isMerchantPublicEntry(pathname: string): boolean {
  return pathname === '/business/join' || pathname === '/business/login';
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const business = useBusinessStore((state) => state.business);
  const bootstrapBusinessSession = useBusinessStore((state) => state.bootstrapBusinessSession);
  const hydrateBusiness = useBusinessStore((state) => state.hydrate);
  const hydrateBookings = useBookingsStore((state) => state.hydrate);
  const hydrateReviews = useReviewsStore((state) => state.hydrate);
  const hydrateServices = useServicesStore((state) => state.hydrate);
  const hydrateStaff = useStaffStore((state) => state.hydrate);
  const hydrateTransactions = useTransactionsStore((state) => state.hydrate);
  const [mounted, setMounted] = useState(false);
  /** Merchant session resolved from API (`/auth/business-session`), never from cached business snapshots. */
  const [businessSessionReady, setBusinessSessionReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const merchantPanel = isMerchantPanelPath(pathname);
  const merchantPublic = isMerchantPublicEntry(pathname);

  useEffect(() => {
    if (!mounted || !merchantPanel) return;
    if (merchantPublic) {
      setBusinessSessionReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      await bootstrapBusinessSession();
      if (!cancelled) setBusinessSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, merchantPanel, merchantPublic, bootstrapBusinessSession]);

  useEffect(() => {
    if (typeof window === 'undefined' || !businessSessionReady) return;
    if (business && !localStorage.getItem('business_token')) {
      useBusinessStore.getState().logout();
    }
  }, [businessSessionReady, business]);

  useEffect(() => {
    if (!mounted || !businessSessionReady || !merchantPanel) return;
    if (!business && !merchantPublic) {
      router.replace('/business/login');
    } else if (business && merchantPublic) {
      router.replace('/business/dashboard');
    }
  }, [mounted, businessSessionReady, merchantPanel, merchantPublic, business, router]);

  /** Hydrate panel stores once the merchant session exists. Use `business?.id` — not `business` — so a fresh object from `hydrateBusiness()` does not retrigger this effect (that caused infinite refetch + profile form resets). */
  useEffect(() => {
    if (!mounted || !businessSessionReady || !merchantPanel || !business?.id) return;
    void hydrateBusiness();
    void hydrateBookings();
    void hydrateReviews();
    void hydrateServices();
    void hydrateStaff();
    void hydrateTransactions();
  }, [
    mounted,
    businessSessionReady,
    merchantPanel,
    business?.id,
    hydrateBookings,
    hydrateBusiness,
    hydrateReviews,
    hydrateServices,
    hydrateStaff,
    hydrateTransactions,
  ]);

  if (!merchantPanel) {
    return <>{children}</>;
  }

  if (!mounted && merchantPublic) {
    return <div className="min-h-screen bg-slate-50 flex flex-col">{children}</div>;
  }

  if (merchantPublic) {
    return <div className="min-h-screen bg-slate-50 flex flex-col">{children}</div>;
  }

  if (!mounted || !businessSessionReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center text-sm font-semibold text-slate-600">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-primary" aria-hidden />
        <span>Loading workspace…</span>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <p className="text-sm font-semibold text-slate-600">Sign in to open the business panel.</p>
        <a
          href="/business/login"
          className="rounded-2xl bg-slate-900 px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-primary"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen w-[calc(100%-16rem)]">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
