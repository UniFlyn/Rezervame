"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { apiPostOptional } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";

type LoginStep = "credentials" | "twoFactor";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("admin@rezervame.com");
  const [password, setPassword] = useState("password");
  const [verificationCode, setVerificationCode] = useState("");

  const finishSignIn = (token: string) => {
    localStorage.setItem("admin_token", token);
    toastSuccess("Signed in", "Welcome to the admin console.");
    router.push("/admin/dashboard");
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await apiPostOptional<{
        token?: string;
        user?: { role: string };
        twoFactorRequired?: boolean;
      }>("/auth/login", { email, password });
      if (!auth) {
        const msg = "Sign-in failed. Check your email and password.";
        setError(msg);
        toastError("Sign-in failed", msg);
        return;
      }
      if (auth.twoFactorRequired) {
        setStep("twoFactor");
        setVerificationCode("");
        toastSuccess("Check your email", "Enter the verification code we sent you.");
        return;
      }
      if (auth.token && auth.user?.role === "ADMIN") {
        finishSignIn(auth.token);
      } else {
        const msg = "Sign-in failed. Check your email and password.";
        setError(msg);
        toastError("Sign-in failed", msg);
      }
    } catch {
      const msg = "Unable to connect right now. Please try again.";
      setError(msg);
      toastError("Connection issue", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const auth = await apiPostOptional<{ token?: string; user?: { role: string } }>(
        "/auth/admin-verify-2fa",
        { email: email.trim().toLowerCase(), code: verificationCode.trim() },
      );
      if (auth?.token && auth.user?.role === "ADMIN") {
        finishSignIn(auth.token);
      } else {
        const msg = "Invalid or expired verification code.";
        setError(msg);
        toastError("Verification failed", msg);
      }
    } catch {
      const msg = "Unable to verify the code. Please try again.";
      setError(msg);
      toastError("Verification failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
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
            <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">
              {step === "twoFactor" ? "Verification required" : "Admin sign in"}
            </p>
          </div>

          {step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition"
                    placeholder="admin@rezervame.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTwoFactor} className="space-y-6">
              <p className="text-sm font-medium text-white/60 text-center">
                We sent a 6-digit code to your email. Enter it below to finish signing in.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-center text-lg font-black tracking-[0.4em] text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition"
                  placeholder="000000"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading || verificationCode.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & continue"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setVerificationCode("");
                }}
                className="w-full text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
              >
                Back to sign in
              </button>
            </form>
          )}

          <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-2 text-white/20">
            <Zap className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Secure admin access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
