"use client";

import React, { useState } from "react";
import { 
  Bell, 
  Send, 
  Users, 
  Store, 
  MessageSquare,
  AlertTriangle,
  History,
  Trash2,
  Inbox,
  CheckCircle2,
  Clock,
  ShieldAlert,
  CreditCard,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

const systemAlerts = [
  {
    id: 1,
    type: 'security',
    title: 'New Admin Login Attempt',
    description: 'Suspicious login attempt from IP 192.168.1.105 (London, UK).',
    time: '5 mins ago',
    icon: ShieldAlert,
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    id: 2,
    type: 'finance',
    title: 'High Value Withdrawal',
    description: 'Zen Spa & Wellness requested a withdrawal of $5,400.00.',
    time: '25 mins ago',
    icon: CreditCard,
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    id: 3,
    type: 'merchant',
    title: 'New Merchant Signup',
    description: '"Urban Kicks Store" has completed their business profile.',
    time: '1h ago',
    icon: UserPlus,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    id: 4,
    type: 'system',
    title: 'Server Load Advisory',
    description: 'CPU usage exceeded 85% on Node EU-West-1 for 10 minutes.',
    time: '2h ago',
    icon: AlertTriangle,
    color: 'text-rose-500 bg-rose-500/10'
  }
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("feed");
  const [target, setTarget] = useState("all_users");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setMessage("");
      alert("Notification sent successfully!");
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase tracking-tighter italic">Notification Center</h1>
          <p className="text-slate-500 text-sm mt-1">Manage system-wide alerts and outgoing broadcast communications.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab("feed")}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === "feed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Inbox className="w-3 h-3" /> System Feed
          </button>
          <button 
            onClick={() => setActiveTab("broadcast")}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === "broadcast" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Send className="w-3 h-3" /> Broadcast Tool
          </button>
        </div>
      </div>

      {activeTab === "feed" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-blue-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", alert.color)}>
                    <alert.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 uppercase tracking-tight italic">{alert.title}</h3>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {alert.time}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{alert.description}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Take Action</button>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
               <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                 <Bell className="w-4 h-4" /> Global Subscriptions
               </h3>
               <div className="space-y-4">
                 {[
                   { label: 'Admin Alerts', count: '12 today', status: 'Active' },
                   { label: 'Merchant Requests', count: '4 pending', status: 'Active' },
                   { label: 'Error Logging', count: '0 issues', status: 'Healthy' }
                 ].map((sub, i) => (
                   <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                     <div>
                       <p className="text-sm font-black">{sub.label}</p>
                       <p className="text-[10px] font-bold text-white/40 uppercase">{sub.count}</p>
                     </div>
                     <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">
                       {sub.status}
                     </span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 italic">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Archive Statistics
              </h3>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                   <p className="text-2xl font-black text-slate-900 leading-none">1,284</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Alerts Managed (MTD)</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                   <p className="text-2xl font-black text-slate-900 leading-none">99.8%</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Response Efficiency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs italic">
              <Send className="w-4 h-4 text-blue-600" />
              Compose Broadcast
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Target Audience</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'all_users', label: 'All Users', icon: Users },
                  { id: 'all_businesses', label: 'All Businesses', icon: Store },
                  { id: 'pro_users', label: 'Pro Subscriptions', icon: Bell },
                  { id: 'new_merchants', label: 'New Merchants', icon: AlertTriangle },
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setTarget(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all active:scale-95",
                      target === item.id 
                        ? "border-blue-500 bg-blue-50 text-blue-600 shadow-lg shadow-blue-500/10" 
                        : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message Content</label>
              <textarea 
                className="w-full h-48 p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition font-medium placeholder:text-slate-300 resize-none leading-relaxed"
                placeholder="Type your message here... (Markdown supported)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button 
              onClick={handleSend}
              disabled={!message || isSending}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSending ? "Sending Broadcast..." : (
                 <span className="flex items-center justify-center gap-2">
                   Dispatch Notification
                   <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </span>
              )}
            </button>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="space-y-8">
              <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-xs text-blue-400 italic">
                <History className="w-4 h-4" />
                Transmission History
              </h3>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl group hover:bg-white/10 transition-colors">
                     <div className="flex items-start justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Sent to Businesses</span>
                       <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter italic">2h ago</span>
                     </div>
                     <p className="text-sm text-white/80 line-clamp-2 leading-relaxed font-medium">Important: New commission structure starting June 1st. Please review the updated terms...</p>
                     <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                           <span className="flex items-center gap-2"><Users className="w-4 h-4" /> 845 Reach</span>
                           <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> 92% Read</span>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-6 text-xs font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors border-t border-white/5 mt-6">
               View Full Communications Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
