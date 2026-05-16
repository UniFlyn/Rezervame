"use client";
import React, { useState } from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle, Heart, Bell, Search, MapPin, User as UserIcon, ShoppingBag, Clock, Tag } from "lucide-react";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { useVenueBookingCartStore } from "@/store/venueBookingCartStore";
import { apiGet, apiPatch } from "@/lib/api";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const HOME_SEARCH_SCROLL_PX = 260;

export const Header = () => {
  const { t, language } = useI18n();
  const { isLoggedIn, user, setIsLoginModalOpen } = useAuth() as any;
  const router = useRouter();
  const pathname = usePathname();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(() => pathname !== "/");
  const [searchVal, setSearchVal] = useState("");
  const [locationVal, setLocationVal] = useState("");

  const { businessId, serviceIds } = useVenueBookingCartStore();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await apiGet<NotificationRow[]>('/notifications', 'USER');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiPatch('/notifications/read-all', {}, 'USER');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiPatch(`/notifications/${id}/read`, {}, 'USER');
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  React.useEffect(() => {
    if (isLoggedIn) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  React.useEffect(() => {
    setMounted(true);
    if (pathname !== "/") {
      setShowHeaderSearch(true);
      return;
    }
    const onScroll = () => setShowHeaderSearch(typeof window !== "undefined" && window.scrollY > HOME_SEARCH_SCROLL_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname.startsWith('/business')) return null;

  const notificationTitle = language === "en" ? "Notifications" : "Notificaciones";

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return language === "en" ? "Just now" : "Ahora";
    if (diffMins < 60) return language === "en" ? `${diffMins} min ago` : `hace ${diffMins} min`;
    if (diffHours < 24) return language === "en" ? `${diffHours} hour ago` : `hace ${diffHours} h`;
    return language === "en" ? `${diffDays} day ago` : `hace ${diffDays} d`;
  };

  const getIcon = (type: string) => {
    if (type.includes('BOOKING')) return <CheckCircle size={16} className="text-green-500" />;
    if (type.includes('OFFER') || type.includes('PROMOTION')) return <Tag size={16} className="text-amber-500" />;
    return <Bell size={16} className="text-slate-400" />;
  };

  return (
    <header className="bg-white px-8 py-4 flex justify-between items-center z-50 sticky top-0 border-b border-gray-100 shadow-sm">
      <div className="flex items-center group">
        <div className="relative cursor-pointer flex items-center gap-2" onClick={() => router.push('/')}>
          <img 
            src="/logo.png" 
            alt="Rezervame" 
            className="h-8 w-auto object-contain transform group-hover:scale-105 transition duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).classList.add('hidden');
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
          <span className="hidden text-2xl font-black tracking-tighter text-slate-900 group-hover:text-[#ff5a5f] transition-colors leading-none">
            RE<span className="text-[#ff5a5f]">ZER</span>VAME
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-8">
        {(pathname !== "/" || showHeaderSearch) && (
         <div className="hidden lg:flex bg-slate-50 border border-slate-200 rounded-2xl py-2 px-5 items-center w-[450px] shadow-inner focus-within:border-[#ff5a5f] transition-all animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="flex-1 flex items-center border-r border-slate-200 pr-4 mr-4">
              <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <input 
                type="text" 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${encodeURIComponent(searchVal)}`)}
                placeholder={t('searchPlaceholder')} 
                className="bg-transparent text-xs outline-none w-full font-bold text-slate-700 placeholder:text-slate-300" 
              />
           </div>
           <div className="flex-1 flex items-center min-w-0">
              <MapPin className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <input 
                type="text" 
                value={locationVal}
                onChange={(e) => setLocationVal(e.target.value)}
                placeholder={t('locationPlaceholder')} 
                className="bg-transparent text-xs outline-none w-full font-bold text-slate-700 placeholder:text-slate-300" 
              />
           </div>
           <button
             type="button"
             onClick={() => router.push(`/search?q=${encodeURIComponent(searchVal)}`)}
             className="bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl ml-2 hover:bg-[#e0454a] transition shadow-lg shrink-0"
           >
             {t('searchBtn')}
           </button>
        </div>
        )}

        <div className="flex items-center space-x-6">
          <div className="relative">
             <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`p-2 rounded-2xl transition-all relative ${isNotificationsOpen ? 'bg-[#ff5a5f]/10 text-[#ff5a5f]' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
             >
                <Bell size={24} strokeWidth={1.5} />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff5a5f] rounded-full border-2 border-white ring-4 ring-[#ff5a5f]/20"></div>
             </button>
             
             {isNotificationsOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                 <div className="absolute right-0 mt-4 w-[360px] bg-white rounded-[32px] shadow-2xl z-50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{notificationTitle}</h3>
                       <button className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest hover:underline">Marcar como leído</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                       {notifications.map((n) => (
                         <div key={n.id} className="p-5 border-b border-slate-50 hover:bg-slate-50/80 transition cursor-pointer flex gap-4 items-start group">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                               {n.icon}
                            </div>
                            <div className="flex-1">
                               <h4 className="text-sm font-black text-slate-800 mb-1">{n.title}</h4>
                               <p className="text-xs font-bold text-slate-400 leading-relaxed mb-2">{n.desc}</p>
                               <span className="text-[10px] font-black text-slate-300 uppercase">{n.time}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                    <button 
                      onClick={() => { router.push('/profile?tab=bookings'); setIsNotificationsOpen(false); }}
                      className="w-full py-4 text-xs font-black text-white bg-slate-900 hover:bg-[#ff5a5f] transition border-t border-slate-100 uppercase tracking-[0.1em]"
                    >
                       VER TODAS LAS NOTIFICACIONES
                    </button>
                 </div>
               </>
             )}
          </div>

          <button 
            onClick={() => router.push('/profile?tab=favorites')}
            className="p-2 rounded-2xl text-slate-400 hover:text-[#ff5a5f] hover:bg-[#ff5a5f]/5 transition-all transform active:scale-95"
          >
             <Heart size={24} strokeWidth={1.5} />
          </button>
          
          {mounted && isLoggedIn && businessId && serviceIds.length > 0 && (
            <button
              onClick={() => router.push(`/venue/${businessId}`)}
              className="p-2 rounded-2xl text-[#ff5a5f] bg-[#ff5a5f]/10 hover:bg-[#ff5a5f]/20 transition-all relative transform active:scale-95"
              title={language === "en" ? "Continue booking" : "Continuar reserva"}
            >
              <ShoppingBag size={24} strokeWidth={1.5} />
              <div className="absolute top-0 right-0 bg-[#ff5a5f] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 shadow-sm border border-white">
                {serviceIds.length}
              </div>
            </button>
          )}

          <div className="w-[1px] h-8 bg-slate-200 mx-2"></div>

          {isLoggedIn ? (
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => router.push('/profile')} title="Go to Profile">
               <div className="relative">
                  <img src={user?.avatar || PLACEHOLDER_IMAGE_DATA_URI} alt="Profile" className="w-11 h-11 rounded-[1.2rem] object-cover border-2 border-white shadow-md group-hover:scale-105 transition duration-500" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"></div>
               </div>
               <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-sm font-black text-slate-800 group-hover:text-[#ff5a5f] transition leading-none">{user?.name || "User"}</span>
                  <span className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest mt-1.5">
                    {t("profileDashboardLink")}
                  </span>
               </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)} 
              className="bg-[#ff5a5f] text-white font-black py-2.5 px-8 rounded-2xl hover:bg-[#e0484d] transition shadow-lg shadow-[#ff5a5f]/20 transform hover:-translate-y-1 active:translate-y-0"
            >
              <span>{t('btnSignIn')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
