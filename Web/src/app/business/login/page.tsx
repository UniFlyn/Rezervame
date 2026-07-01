"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBusinessStore } from "@/store/businessStore";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const loginBusiness = useBusinessStore((state) => state.login);

  const handleLoginSuccess = async (email: string, password: string) => {
    const ok = await loginBusiness(email, password);
    if (ok) {
      router.push('/business/dashboard');
      return;
    }
    throw new Error('Invalid email or password, or this account is not a business user.');
  };

  return (
    <div className="min-h-screen bg-[var(--rz-gray-050)] flex flex-col justify-center py-12 px-6 lg:px-8">
      <LoginForm 
        onSuccess={handleLoginSuccess} 
        title="Business Login"
        subtitle="Manage your salon, staff, and appointments with REZERVAME"
        useAuthLogin={false}
        hideSocialLogin
        signUpHref="/business/join"
      />
    </div>
  );
}
