"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api";
import { usePageHeaderMeta } from "@/contexts/PageHeaderMetaContext";
import { isBookingConfirmationPath } from "@/lib/bookingConfirmation";
import { Header as DSHeader } from "@/ds";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

import { appPath } from "@/lib/publicBasePath";

const LOGO_COLOR = appPath("/ds/logos/rezervame-color.png");

function relativeTime(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return t("timeNow");
  if (diffMins < 60) return t("timeMinutesAgo").replace("{n}", String(diffMins));
  if (diffHours < 24) return t("timeHoursAgo").replace("{n}", String(diffHours));
  return t("timeDaysAgo").replace("{n}", String(diffDays));
}

function iconForType(type: string): string {
  const t = type.toUpperCase();
  if (t.includes("BOOKING") || t.includes("RESERV")) return "calendar";
  if (t.includes("PAYMENT") || t.includes("REFUND") || t.includes("INVOICE")) return "creditCard";
  if (t.includes("REVIEW")) return "star";
  if (t.includes("OFFER") || t.includes("PROMOT") || t.includes("BUSINESS")) return "heart";
  return "bell";
}

/**
 * Customer header — rendered with the Rezervame Design System `Header`.
 *  - Logged out → "home" variant (logo · search · Iniciar sesión).
 *  - Logged in  → "business" variant (logo · search · notifications · favourites · account menu).
 * Hidden on the business panel and the booking-confirmation screen.
 */
export const Header = () => {
  const { t } = useI18n();
  const { isLoggedIn, user, setIsLoginModalOpen, isHydrated, hasStoredSession, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { meta } = usePageHeaderMeta();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const showSearch =
    pathname === "/" || pathname.startsWith("/search") || pathname.startsWith("/venue");

  const loadNotifications = async () => {
    try {
      const data = await apiGet<NotificationRow[]>("/notifications", "USER");
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(
      unread.map((n) => apiPatch(`/notifications/${n.id}/read`, {}, "USER").catch(() => null)),
    );
  };

  const openNotification = async (n: NotificationRow) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await apiPatch(`/notifications/${n.id}/read`, {}, "USER").catch(() => null);
    }
    const ty = (n.type || "").toUpperCase();
    if (ty.includes("PAYMENT") || ty.includes("REFUND") || ty.includes("INVOICE")) {
      router.push("/profile?tab=invoices");
    } else if (ty.includes("REVIEW")) {
      router.push("/profile?tab=notifications");
    } else {
      router.push("/profile?tab=bookings");
    }
  };

  const notificationItems = useMemo(
    () =>
      notifications.slice(0, 6).map((n) => ({
        icon: iconForType(n.type),
        title: n.title,
        time: relativeTime(n.createdAt, t),
        unread: !n.read,
        onClick: () => void openNotification(n),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, t],
  );

  const accountMenu = useMemo(
    () => [
      { label: t("myAccount"), icon: "user", onClick: () => router.push("/profile") },
      { label: t("myReservationsMenu"), icon: "calendar", onClick: () => router.push("/profile?tab=bookings") },
      { label: t("favoritesMenu"), icon: "heart", onClick: () => router.push("/profile?tab=favorites") },
      { label: t("paymentMethodsMenu"), icon: "creditCard", onClick: () => router.push("/profile?tab=payments") },
      { label: t("helpCenterMenu"), icon: "helpCircle", divider: true, onClick: () => router.push("/support") },
      { label: t("profileSettings"), icon: "settings", onClick: () => router.push("/profile?tab=settings") },
      { label: t("logout"), icon: "logOut", danger: true, divider: true, onClick: () => { logout(); router.push("/"); } },
    ],
    [router, logout, t],
  );

  if (pathname.startsWith("/business") || isBookingConfirmationPath(pathname)) return null;

  const onSearch = (q: { service?: string; location?: string }) => {
    const params = new URLSearchParams();
    if (q?.service) params.set("q", q.service);
    if (q?.location) params.set("location", q.location);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  const contextTitle = meta.title || undefined;
  const contextSubtitle = meta.subtitle || undefined;

  const showLoggedInHeader = Boolean(isLoggedIn && user) || (!isHydrated && hasStoredSession);
  const headerUser = user ?? {
    name: t("myAccount"),
    email: "",
    avatar: undefined as string | undefined,
  };

  if (showLoggedInHeader) {
    return (
      <DSHeader
        logoSrc={LOGO_COLOR}
        sticky
        showSearch={showSearch}
        onSearch={onSearch}
        onLogoClick={() => router.push("/")}
        contextTitle={contextTitle}
        contextSubtitle={contextSubtitle}
        user={{ name: headerUser.name, email: headerUser.email, avatar: headerUser.avatar || undefined }}
        onFavorites={() => router.push("/profile?tab=favorites")}
        accountMenu={accountMenu}
        notificationItems={notificationItems}
        onSeeAllNotifications={() => router.push("/profile?tab=notifications")}
        onMarkAllRead={markAllRead}
      />
    );
  }

  return (
    <DSHeader
      variant="home"
      logoSrc={LOGO_COLOR}
      sticky
      showSearch={showSearch}
      onSearch={onSearch}
      onLogoClick={() => router.push("/")}
      loginLabel={t("btnSignIn")}
      onLogin={() => setIsLoginModalOpen(true)}
    />
  );
};
