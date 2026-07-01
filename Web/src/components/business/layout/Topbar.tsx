'use client';

import Link from 'next/link';
import { Bell, UserCircle } from 'lucide-react';
import { useBusinessStore } from '../../../store/businessStore';

export function Topbar() {
  const business = useBusinessStore((state) => state.business);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full shadow-sm">
      <h1 className="text-lg font-semibold text-gray-800">Welcome, {business?.name || 'Partner'}</h1>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          title="Notifications"
          className="text-gray-500 hover:text-gray-700 relative p-2 rounded-xl hover:bg-[var(--rz-gray-050)]"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" aria-hidden />
        </button>
        <Link
          href="/business/profile"
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 p-2 rounded-xl hover:bg-[var(--rz-gray-050)]"
        >
          <UserCircle className="h-6 w-6" />
          <span className="text-sm font-medium">Profile</span>
        </Link>
      </div>
    </header>
  );
}
