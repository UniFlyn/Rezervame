"use client";
import React from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

export const LoginModal = () => {
  const { t, language, setLanguage } = useI18n();
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAuth() as any;
  const router = useRouter();

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-[800px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button 
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-10 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8">
            <img src="/logo.png" alt="rezervame" className="h-10 object-contain" />
            <p className="text-[#ff5a5f] text-[10px] font-bold text-center mt-1 tracking-tight px-1 text-wrap max-w-[200px]">
              {t('signupSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-[650px]">
            {/* Left Side: Register */}
            <div className="flex flex-col items-center text-center">
              <h3 className="font-extrabold text-lg mb-8">{t('signUp')}</h3>
              
              <div className="space-y-4 w-full">
                <button className="w-full flex items-center justify-center space-x-3 border border-slate-200 py-3 rounded-full hover:bg-slate-50 transition font-bold text-sm">
                  <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" className="w-5" alt="Google" />
                  <span>{t('contGoogle')}</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-3 border border-slate-200 py-3 rounded-full hover:bg-slate-50 transition font-bold text-sm">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                  <span>{t('contFacebook')}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 font-bold mt-12 leading-relaxed opacity-80">
                {t('termsAgree')}
              </p>
            </div>

            {/* Right Side: Login */}
            <div className="flex flex-col items-center">
              <h3 className="font-extrabold text-lg mb-8">{t('btnSignIn')}</h3>
              
              <form className="w-full space-y-4" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                const email = formData.get('email') as string;
                const password = formData.get('password') as string;
                await login(email, password); 
                setIsLoginModalOpen(false); 
                router.push('/profile');
              }}>
                <div className="space-y-1 w-full text-left">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase ml-1 opacity-70">{t('email')}</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a5f]/20 transition font-medium text-sm"
                  />
                </div>
                <div className="space-y-1 w-full text-left">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase ml-1 opacity-70">{t('password')}</label>
                  <input 
                    name="password"
                    type="password" 
                    required
                    className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a5f]/20 transition font-medium text-sm"
                  />
                </div>
                <div className="w-full text-right">
                  <a href="#" className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition underline">{t('forgotPass')}</a>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#ff5a5f] text-white font-extrabold py-3.5 rounded-full hover:bg-[#e0484d] transition shadow-sm mt-4"
                >
                  {t('btnSignIn')}
                </button>
              </form>
            </div>
          </div>

          {/* Language Selector Bottom */}
          <div className="mt-12 w-full pt-8 border-t border-slate-100 flex justify-center">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-500 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none cursor-pointer"
            >
              <option value="es">Español (Latinoamerica)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
