"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Settings, 
  Percent, 
  Clock, 
  MapPin, 
  Globe, 
  Save, 
  ShieldCheck, 
  Bell, 
  Database,
  Lock,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["general", "security", "notifications", "platform"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Alerts', icon: Bell },
    { id: 'platform', name: 'Platform', icon: Database },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure global platform parameters and security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-blue-400" : "text-slate-400")} />
                <span className="text-sm font-black uppercase tracking-widest">{tab.name}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === tab.id ? "translate-x-1" : "opacity-0")} />
            </button>
          ))}
        </div>

        <div className="lg:col-span-9 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-10 space-y-12 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
           
           {activeTab === 'general' && (
             <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Globe className="w-3 h-3" />
                     Platform Branding
                   </label>
                   <input 
                    type="text" 
                    defaultValue="Rezervame" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                   />
                 </div>
                 
                 <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Percent className="w-3 h-3" />
                     Default Commission (%)
                   </label>
                   <div className="relative">
                     <input 
                      type="number" 
                      defaultValue="15" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition pr-12"
                     />
                     <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Clock className="w-3 h-3" />
                     Slot Hold Time (Minutes)
                   </label>
                   <div className="relative">
                     <input 
                      type="number" 
                      defaultValue="5" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition pr-16"
                     />
                     <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[10px] text-slate-400 uppercase tracking-widest">MIN</span>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck className="w-3 h-3" />
                     Approval Mode
                   </label>
                   <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition appearance-none cursor-pointer">
                      <option>Manual Verification</option>
                      <option>AI-Assisted (Auto)</option>
                      <option>Fully Automatic</option>
                   </select>
                 </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 italic">Last updated: 2 days ago by System Admin</div>
                  <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Commit Changes
                  </button>
               </div>
             </div>
           )}
           
           {activeTab === 'security' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck className="w-3 h-3" />
                       Two-Factor Auth (2FA)
                    </label>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="2fa-toggle" className="w-5 h-5 accent-blue-600 rounded cursor-pointer" defaultChecked />
                      <span className="text-sm font-bold text-slate-800 italic uppercase">Mandatory for all admins</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Minimum Password Length
                    </label>
                    <input 
                     type="number" 
                     defaultValue="12" 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Session Timeout (Minutes)
                    </label>
                    <input 
                     type="number" 
                     defaultValue="60" 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="text-xs font-bold text-slate-400 italic">Security status: Robust</div>
                   <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center gap-2">
                     <Save className="w-4 h-4" />
                     Update Security
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="space-y-6">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4 italic">System Event Alerts</h3>
                   <div className="space-y-4">
                     {[
                       { id: 'nbf', label: 'New Business Signup', desc: 'Notify when a merchant register their shop.' },
                       { id: 'lbr', label: 'Low Balance Warning', desc: 'Alert admins of insufficient platform buffer.' },
                       { id: 'srq', label: 'System Recovery Requests', desc: 'Notify on critical error reports.' }
                     ].map((item) => (
                       <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="space-y-1">
                           <p className="text-sm font-bold text-slate-800">{item.label}</p>
                           <p className="text-xs text-slate-400 font-medium italic">{item.desc}</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Email</span>
                            <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer" defaultChecked />
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="text-xs font-bold text-slate-400 italic">Connected to SMTP: mail.rezervame.com</div>
                   <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-2">
                     <Save className="w-4 h-4" />
                     Confirm Config
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'platform' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Database className="w-3 h-3" />
                       Maintenance Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="maint-toggle" className="w-5 h-5 accent-rose-600 rounded cursor-pointer" />
                      <span className="text-sm font-bold text-slate-800 italic uppercase">Redirect visitors to offline page</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-3 h-3" />
                      Database Retention (Days)
                    </label>
                    <input 
                     type="number" 
                     defaultValue="90" 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                     Platform Connectivity (API Keys)
                  </label>
                  <div className="space-y-3">
                    <div className="relative group">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Stripe</span>
                       <input 
                        type="password" 
                        defaultValue="sk_test_••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-20 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                       />
                    </div>
                    <div className="relative group">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">G-Maps</span>
                       <input 
                        type="password" 
                        defaultValue="AIzaSy••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-20 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                       />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="text-xs font-bold text-slate-400 italic">Environment: Production (v2.1.0)</div>
                   <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-2">
                     <Save className="w-4 h-4" />
                     Commit changes
                   </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
