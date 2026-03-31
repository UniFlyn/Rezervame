"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBusinessStore } from "@/store/businessStore";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const loginBusiness = useBusinessStore((state) => state.login);

  const handleLoginSuccess = () => {
    loginBusiness();
    router.push('/business/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <LoginForm 
        onSuccess={handleLoginSuccess} 
        title="Business Login"
        subtitle="Manage your salon, staff, and appointments with REZERVAME"
      />
    </div>
  );
}
