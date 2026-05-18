"use client";
import React, { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toastError } from "@/lib/toast";
import { apiPost } from "@/lib/api";

type Step = "EMAIL" | "PASSWORD" | "SIGNUP";

export const LoginModal = () => {
  const { t, language, setLanguage } = useI18n();
  const { isLoginModalOpen, setIsLoginModalOpen, login, register, setPendingAfterLogin, runPendingAfterLogin } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isLoginModalOpen) {
      setStep("EMAIL");
      setEmail("");
      setChecking(false);
    }
  }, [isLoginModalOpen]);

  const closeModal = () => {
    setPendingAfterLogin(null);
    setIsLoginModalOpen(false);
  };

  const finishSuccess = async () => {
    setIsLoginModalOpen(false);
    if (!runPendingAfterLogin()) {
      router.push("/profile");
    }
  };

  const onCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toastError(t("authLoginFailedTitle"), t("authLoginFailedBody"));
      return;
    }
    setChecking(true);
    try {
      const { exists } = await apiPost<{ exists: boolean }>("/auth/check-email", { email: trimmed });
      setEmail(trimmed);
      setStep(exists ? "PASSWORD" : "SIGNUP");
    } catch (err) {
      toastError(
        t("authLoginFailedTitle"),
        err instanceof Error ? err.message : t("authLoginFailedBody"),
      );
    } finally {
      setChecking(false);
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="presentation"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row min-h-[550px]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Brand/Image */}
        <div className="hidden md:flex md:w-5/12 bg-slate-900 relative p-10 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-40" alt="Beauty Services" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-black tracking-tighter text-white leading-none">
              RE<span className="text-[#ff5a5f]">ZER</span>VAME
            </span>
            <p className="text-slate-200 font-bold text-sm mt-4 leading-relaxed max-w-[220px]">
              {t("signupSub")}
            </p>
          </div>
          <div className="relative z-10">
            <div className="flex -space-x-3 mb-4">
              <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User" />
              <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User" />
              <img src="https://i.pravatar.cc/100?img=3" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User" />
            </div>
            <p className="text-white font-bold text-sm">Join over 10,000 users today</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 relative flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={closeModal}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition p-2 bg-slate-50 hover:bg-slate-100 rounded-full z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full max-w-[380px] mx-auto flex flex-col h-full justify-center">
            {step !== "SIGNUP" && (
              <div className="mb-8 text-center md:text-left">
                <div className="md:hidden mb-6 text-center">
                  <span className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                    RE<span className="text-[#ff5a5f]">ZER</span>VAME
                  </span>
                </div>
                <h2 className="font-extrabold text-2xl text-slate-900">{t("authUnifiedTitle")}</h2>
                <p className="text-slate-500 font-bold text-[11px] mt-2 uppercase tracking-widest">{t("authNeedAccount") || "Log in or sign up"}</p>
              </div>
            )}

            {step === "EMAIL" && (
              <form onSubmit={onCheckEmail} className="w-full space-y-4">
                <div className="space-y-1.5 w-full text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t("email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="name@example.com"
                    required
                    className="w-full border border-slate-200 p-3.5 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:ring-4 focus:ring-[#ff5a5f]/5 transition-all font-bold text-sm placeholder:text-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checking}
                  className="w-full bg-[#ff5a5f] text-white font-black py-4 rounded-2xl hover:bg-[#e0484d] transition-all shadow-xl shadow-[#ff5a5f]/20 mt-2 disabled:opacity-60 text-xs uppercase tracking-widest"
                >
                  {checking ? t("authChecking") : t("authContinue")}
                </button>
                <p className="text-[10px] text-slate-400 font-bold text-center pt-2 leading-relaxed">{t("termsAgree")}</p>
              </form>
            )}

            {step === "PASSWORD" && (
              <form
                className="w-full space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const password = formData.get("password") as string;
                  try {
                    await login(email, password);
                    await finishSuccess();
                  } catch (err) {
                    toastError(
                      t("authLoginFailedTitle"),
                      err instanceof Error ? err.message : t("authLoginFailedBody"),
                    );
                  }
                }}
              >
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-slate-700 truncate">{email}</p>
                  <button
                    type="button"
                    className="text-[10px] font-black uppercase tracking-widest text-[#ff5a5f] hover:underline whitespace-nowrap ml-4"
                    onClick={() => setStep("EMAIL")}
                  >
                    {t("bookingChange")}
                  </button>
                </div>
                
                <div className="space-y-1 w-full text-left">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase ml-1 opacity-70">{t("password")}</label>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a5f]/20 transition font-medium text-sm"
                  />
                </div>
                <div className="w-full text-right">
                  <Link
                    href="/customer-service"
                    onClick={closeModal}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition underline"
                  >
                    {t("forgotPass")}
                  </Link>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#ff5a5f] text-white font-extrabold py-3.5 rounded-full hover:bg-[#e0484d] transition shadow-sm mt-2"
                >
                  {t("btnSignIn")}
                </button>
              </form>
            )}

            {step === "SIGNUP" && (
              <form
                className="w-full"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const password = formData.get("password") as string;
                  const name = (formData.get("name") as string)?.trim();
                  const address = (formData.get("address") as string)?.trim();
                  const phone = (formData.get("phone") as string)?.trim();
                  const gender = (formData.get("gender") as string)?.trim();
                  const ageRaw = formData.get("age") as string;
                  const age = ageRaw ? parseInt(ageRaw, 10) : undefined;
                  if (!name) {
                    toastError(t("authRegisterFailedTitle"), t("authRegisterFailedBody"));
                    return;
                  }
                  try {
                    await register({
                      email,
                      password,
                      name,
                      address: address || undefined,
                      phone: phone || undefined,
                      gender: gender || undefined,
                      age: Number.isFinite(age) ? age : undefined,
                    });
                    await finishSuccess();
                  } catch (err) {
                    toastError(
                      t("authRegisterFailedTitle"),
                      err instanceof Error ? err.message : t("authRegisterFailedBody"),
                    );
                  }
                }}
              >
                <div className="md:hidden mb-6 text-center">
                  <span className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                    RE<span className="text-[#ff5a5f]">ZER</span>VAME
                  </span>
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-black text-xl text-slate-900 tracking-tight">{t("authCreateAccount")}</h3>
                    <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                      {email} 
                    </p>
                  </div>
                  <button type="button" className="text-[9px] font-black uppercase tracking-widest text-[#ff5a5f] bg-[#ff5a5f]/5 px-3 py-1.5 rounded-xl ml-4 hover:bg-[#ff5a5f]/10 transition-colors" onClick={() => setStep("EMAIL")}>
                    {t("bookingChange")}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <div className="space-y-1 w-full text-left col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t("fullName")}</label>
                    <input
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-[#ff5a5f] transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1 w-full text-left col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t("password")}</label>
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-[#ff5a5f] transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1 w-full text-left col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t("authAddress")}</label>
                    <input
                      name="address"
                      type="text"
                      placeholder={t("authAddressPlaceholder")}
                      autoComplete="street-address"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-[#ff5a5f] transition-all font-bold text-sm placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t("authGender")}</label>
                    <select
                      name="gender"
                      defaultValue="male"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-[#ff5a5f] font-bold text-sm bg-white"
                    >
                      <option value="male">{t("genderMale")}</option>
                      <option value="female">{t("genderFemale")}</option>
                      <option value="other">{t("genderOther")}</option>
                    </select>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t("authAge")}</label>
                    <input
                      name="age"
                      type="number"
                      min={0}
                      max={130}
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-[#ff5a5f] font-bold text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ff5a5f] text-white font-black py-3.5 rounded-2xl hover:bg-[#e0484d] transition-all shadow-xl shadow-[#ff5a5f]/20 mt-5 text-[11px] uppercase tracking-widest"
                >
                  {t("authCreateAccount")}
                </button>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed pt-3 text-center">{t("termsAgree")}</p>
              </form>
            )}

            {step !== "SIGNUP" && (
              <div className="mt-8 w-full pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition font-bold text-[11px]"
                  >
                    <img
                      src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                      className="w-4 h-4"
                      alt=""
                    />
                    <span className="hidden sm:inline">{t("contGoogle")}</span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition font-bold text-[11px]"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                    <span className="hidden sm:inline">{t("contFacebook")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
