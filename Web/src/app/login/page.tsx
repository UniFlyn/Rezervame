import React from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage your appointments</p>
        </div>
        <form className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Email address</label>
            <input type="email" required className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="john@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" required className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="••••••••" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary border-slate-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">Remember me</label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary-dark">Forgot password?</a>
            </div>
          </div>
          <button type="button" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
