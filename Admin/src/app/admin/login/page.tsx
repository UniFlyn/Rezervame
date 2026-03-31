"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center space-y-4 mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-600/20 animate-bounce-slow">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Rezervame</h1>
            <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Access restricted to super admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Security ID / Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="email" 
                  required
                  defaultValue="admin@rezervame.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition"
                  placeholder="Enter admin identifier"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Encryption Key / Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="password" 
                  required
                  defaultValue="password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="hidden" />
                <div className="w-4 h-4 rounded bg-white/5 border border-white/10 flex items-center justify-center transition group-hover:border-blue-500/50">
                  <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-20 transition"></div>
                </div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Remember session</span>
              </label>
              <button type="button" className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition">Reset Access</button>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-400 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5 disabled:opacity-50 group flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : (
                <>
                  Engage Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-6 text-[10px] font-black text-white/20 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-emerald-500" /> SSL Active</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-blue-500" /> AES-256</span>
          </div>
        </div>
      </div>
    </div>
  );
}
