"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle, Heart, Bell, User as UserIcon, Tag } from "lucide-react";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { apiGet, apiPatch } from "@/lib/api";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { usePageHeaderMeta } from "@/contexts/PageHeaderMetaContext";
import { isBookingConfirmationPath } from "@/lib/bookingConfirmation";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const Header = () => {
  const { t, language } = useI18n();
  const { isLoggedIn, user, setIsLoginModalOpen, isHydrated } = useAuth() as any;
  const router = useRouter();
  const pathname = usePathname();
  const { meta } = usePageHeaderMeta();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const headerRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsBtnRef = useRef<HTMLButtonElement>(null);

  const showSearchBar =
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/venue");

  const loadNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await apiGet<NotificationRow[]>("/notifications", "USER");
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiPatch(`/notifications/${id}/read`, {}, "USER");
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  React.useEffect(() => {
    if (isLoggedIn) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const syncHeaderHeight = useCallback(() => {
    const el = headerRef.current;
    if (!el) return;
    const h = Math.ceil(el.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--app-header-height", `${h}px`);
  }, []);

  useEffect(() => {
    syncHeaderHeight();
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => syncHeaderHeight());
    ro.observe(el);
    window.addEventListener("resize", syncHeaderHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, [syncHeaderHeight, pathname, meta.title, meta.subtitle, showSearchBar]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (notificationsRef.current?.contains(target)) return;
      if (notificationsBtnRef.current?.contains(target)) return;
      setIsNotificationsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isNotificationsOpen]);

  if (pathname.startsWith("/business") || isBookingConfirmationPath(pathname)) return null;

  const notificationTitle = t("notificationsTitle");

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour ago`;
    return `${diffDays} day ago`;
  };

  const getIcon = (type: string) => {
    if (type.includes("BOOKING")) return <CheckCircle size={16} className="text-green-500" />;
    if (type.includes("OFFER") || type.includes("PROMOTION")) return <Tag size={16} className="text-amber-500" />;
    return <Bell size={16} className="text-slate-400" />;
  };

  const submitSearch = () => router.push(`/search?q=${encodeURIComponent(searchVal)}`);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[100] isolate border-b border-slate-100 bg-white"
    >
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:gap-5 lg:px-10">
        <Link
          href="/"
          className="relative z-[120] flex shrink-0 items-center"
          aria-label="Rezervame home"
          onClick={(e) => {
            if (!pathname.startsWith("/venue/")) return;
            e.preventDefault();
            window.location.href = "/";
          }}
        >
          <img
            src="/logo.png"
            alt="Rezervame"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).classList.add("hidden");
            }}
          />
        </Link>

        {showSearchBar && (
          <HeaderSearchBar
            searchVal={searchVal}
            locationVal={locationVal}
            onSearchChange={setSearchVal}
            onLocationChange={setLocationVal}
            onSubmit={submitSearch}
            className="hidden min-w-[200px] flex-1 md:flex"
          />
        )}

        {(meta.title || meta.subtitle) && (
          <div className="hidden min-w-0 flex-col lg:flex lg:max-w-[280px]">
            {meta.title ? (
              <p className="truncate text-sm font-extrabold text-slate-900">{meta.title}</p>
            ) : null}
            {meta.subtitle ? (
              <p className="truncate text-[11px] font-bold text-[#ff5a5f]">{meta.subtitle}</p>
            ) : null}
          </div>
        )}

        <div className="relative z-[110] ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          <a
            href="/profile?tab=favorites"
            onClick={() => setIsNotificationsOpen(false)}
            className="relative z-[110] rounded-xl p-2 text-slate-500 transition hover:bg-slate-50 hover:text-[#ff5a5f]"
            aria-label="Favorites"
          >
            <Heart size={22} strokeWidth={1.5} />
          </a>

          {!isHydrated ? (
            <div
              className="h-10 w-[7.5rem] animate-pulse rounded-lg bg-slate-100 sm:w-32"
              aria-hidden
            />
          ) : isLoggedIn ? (
            <a
              href="/profile"
              onClick={() => setIsNotificationsOpen(false)}
              className="relative z-[110] flex items-center gap-2 rounded-xl border border-slate-100 py-1 pl-1 pr-3 transition hover:border-slate-200"
            >
              <img
                src={user?.avatar || PLACEHOLDER_IMAGE_DATA_URI}
                alt=""
                className="pointer-events-none h-9 w-9 rounded-lg object-cover"
              />
              <span className="pointer-events-none hidden text-sm font-bold text-slate-800 sm:inline">
                {user?.name || "User"}
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(false);
                setIsLoginModalOpen(true);
              }}
              className="rounded-lg bg-[#ff5a5f] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#e0454a]"
            >
              {t("btnSignIn")}
            </button>
          )}

          <div ref={notificationsRef} className="relative z-[110]">
            <button
              ref={notificationsBtnRef}
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative rounded-xl p-2 transition ${isNotificationsOpen ? "bg-[#ff5a5f]/10 text-[#ff5a5f]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
              aria-label={notificationTitle}
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={22} strokeWidth={1.5} />
              {notifications.some((n) => !n.read) && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ff5a5f] ring-2 ring-white" />
              )}
            </button>

            {isNotificationsOpen && (
                <div className="absolute right-0 z-[120] mt-3 w-[340px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">{notificationTitle}</h3>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-5 py-8 text-center text-xs font-semibold text-slate-400">—</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="flex w-full gap-3 border-b border-slate-50 px-5 py-4 text-left hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white">
                            {getIcon(n.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                            <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                              {getRelativeTime(n.createdAt)}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => {
                      router.push("/profile?tab=bookings");
                      setIsNotificationsOpen(false);
                    }}
                    className="w-full border-t border-slate-100 bg-slate-900 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#ff5a5f]"
                  >
                    {"View all"}
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
