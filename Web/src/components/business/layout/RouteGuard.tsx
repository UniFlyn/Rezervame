'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBusinessStore } from '../../../store/businessStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const business = useBusinessStore((state) => state.business);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isJoinPage = pathname === '/business/join';

  useEffect(() => {
    if (!mounted) return;
    // Auth check: redirect unauthenticated users to /business/join
    if (!business && !isJoinPage) {
      router.push('/business/join');
    } else if (business && isJoinPage) {
      router.push('/business/dashboard');
    }
  }, [mounted, business, isJoinPage, router]);

  // Server render & First client render must match to avoid Hydration Error
  if (!mounted) {
    if (isJoinPage) {
       return <div className="min-h-screen bg-slate-50 flex flex-col">{children}</div>;
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

  // After hydrate
  if (isJoinPage) {
     return <div className="min-h-screen bg-slate-50 flex flex-col">{children}</div>;
  }

  // Prevent flashing content while redirect happens
  if (!business) return null;

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
