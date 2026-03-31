"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";

export const LoginForm = ({ 
  onSuccess,
  title,
  subtitle
}: { 
  onSuccess?: () => void,
  title?: string,
  subtitle?: string
}) => {
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const displayTitle = title || "REZERVAME";
  const displaySubtitle = subtitle || t('signupSub');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-10 text-center">
          {/* Logo / Title */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 uppercase italic italic shadow-primary/20">{displayTitle}</h1>
            <p className="text-slate-400 font-medium text-sm">{displaySubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button type="button" className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-black text-slate-700 tracking-wider">GOOGLE</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group">
                <svg className="w-6 h-6 text-[#1877F2] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                <span className="text-xs font-black text-slate-700 tracking-wider">FACEBOOK</span>
              </button>
            </div>

            <div className="flex items-center gap-4 my-8">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('o')}</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-2 block">{t('email')}</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  required
                />
              </div>
              <div className="text-left">
                <div className="flex justify-between items-center mb-2 px-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">{t('password')}</label>
                  <button type="button" className="text-[10px] font-black text-rose-500 tracking-wider hover:text-rose-600 transition-colors uppercase">{t('forgotPass')}</button>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-16 mt-8 bg-rose-500 text-white rounded-2xl font-black tracking-widest text-sm shadow-xl shadow-rose-200 hover:bg-rose-600 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : t('btnSignIn').toUpperCase()}
            </button>
          </form>

          <p className="mt-10 text-sm font-bold text-slate-400">
            {t('signupSub').split(',')[0]}?{' '}
            <button className="text-rose-500 hover:text-rose-600 transition-colors">{t('signUp')}</button>
          </p>
          
          <p className="mt-8 text-[10px] text-slate-300 font-medium px-4 leading-relaxed">
            {t('termsAgree')}
          </p>
        </div>
      </div>
    </div>
  );
};
