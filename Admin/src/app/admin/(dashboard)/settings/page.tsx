"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Settings, 
  Percent, 
  Clock, 
  Globe, 
  Save, 
  ShieldCheck, 
  Bell, 
  Database,
  Lock,
  ChevronRight,
  Loader2,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";

type FooterLinkItem = {
  label: string;
  urlKey: string | null;
  showKey: string;
  placeholder: string;
  fixedUrl?: string;
};

type ApprovalMode = "Manual" | "Automatic";

function normalizeApprovalMode(value: unknown): ApprovalMode {
  const v = String(value ?? "").toLowerCase();
  if (v.includes("auto") || v.includes("full")) return "Automatic";
  return "Manual";
}

function FooterLinkEditor<T extends Record<string, unknown>>({
  title,
  items,
  settings,
  setSettings,
}: {
  title: string;
  items: FooterLinkItem[];
  settings: T;
  setSettings: React.Dispatch<React.SetStateAction<T>>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const show = settings[item.showKey] !== false;
          const urlValue =
            item.fixedUrl ??
            (typeof settings[item.urlKey ?? ""] === "string" ? (settings[item.urlKey!] as string) : "");
          return (
            <div
              key={item.showKey}
              className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-[1fr_2fr_auto]"
            >
              <span className="text-sm font-bold text-slate-800 self-center">{item.label}</span>
              <input
                placeholder={item.placeholder}
                value={urlValue}
                disabled={!!item.fixedUrl}
                onChange={(e) => {
                  if (!item.urlKey) return;
                  setSettings((prev) => ({ ...prev, [item.urlKey!]: e.target.value }));
                }}
                className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold disabled:opacity-60"
              />
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 self-center whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={show}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [item.showKey]: e.target.checked }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                Show
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    platformBranding: "Rezervame",
    defaultCommission: 15,
    slotHoldTime: 5,
    approvalMode: "Manual" as ApprovalMode,
    twoFactorMandatory: true,
    minPasswordLength: 12,
    sessionTimeout: 60,
    maintenanceMode: false,
    databaseRetention: 90,
    stripeApiKey: "",
    googleMapsApiKey: "",
    yappyEnabled: true,
    yappyMerchantId: "",
    emailEnabled: false,
    smsEnabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    emailFrom: "",
    adminNotifyEmail: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioFromNumber: "",
    notifyNewTicketEmail: true,
    notifyNewTicketSms: false,
    socialFacebookUrl: "",
    socialInstagramUrl: "",
    socialLinkedinUrl: "",
    appStoreUrl: "",
    playStoreUrl: "",
    showFooterDownloadApp: true,
    footerAboutUrl: "/about",
    showFooterAbout: true,
    footerJobsUrl: "/jobs",
    showFooterJobs: true,
    footerPrivacyUrl: "/privacy",
    showFooterPrivacy: true,
    footerTermsUrl: "/terms",
    showFooterTerms: true,
    footerHowUrl: "/how-it-works",
    showFooterHow: true,
    footerSupportUrl: "/customer-service",
    showFooterSupport: true,
    footerEventsUrl: "/events",
    showFooterEvents: true,
    footerJoinUrl: "/business/join",
    showFooterJoin: true,
    footerBizLoginUrl: "/business/login",
    showFooterBizLogin: true,
    footerPricingUrl: "/pricing",
    showFooterPricing: true,
    footerBizSupportUrl: "/business/support",
    showFooterBizSupport: true,
    homeHeroEnabled: true,
    homeHeroTitle: "",
    homeHeroSubtitle: "",
    homeHeroDealText: "",
    homeHeroImageUrl: "",
    homeHeroCtaText: "",
    homeHeroCtaUrl: "",
    updatedAt: "",
    updatedBy: "System Admin"
  });
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["general", "security", "notifications", "platform", "footer"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setIsLoading(true);
      const data = await apiGet<any>("/admin/config");
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          approvalMode: normalizeApprovalMode(data.approvalMode),
        }));
      }
    } catch (err) {
      toastError("Failed to load settings", String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      const payload = {
        ...settings,
        approvalMode: normalizeApprovalMode(settings.approvalMode),
      };
      const updated = await apiPost<any>("/admin/config", payload);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        approvalMode: normalizeApprovalMode(updated.approvalMode),
      }));
      toastSuccess("Settings saved", "Your changes were applied.");
    } catch (err) {
      toastError("Failed to save settings", String(err));
    } finally {
      setIsSaving(false);
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Email & SMS', icon: Bell },
    { id: 'platform', name: 'Platform', icon: Database },
    { id: 'footer', name: 'Footer & Apps', icon: Share2 },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage platform defaults, security, notifications, and footer links.</p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-blue-600 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Saving changes...</span>
          </div>
        )}
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
                    value={settings.platformBranding}
                    onChange={(e) => setSettings({...settings, platformBranding: e.target.value})}
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
                      value={settings.defaultCommission}
                      onChange={(e) => setSettings({...settings, defaultCommission: Number(e.target.value)})}
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
                      value={settings.slotHoldTime}
                      onChange={(e) => setSettings({...settings, slotHoldTime: Number(e.target.value)})}
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
                   <select 
                    value={settings.approvalMode}
                    onChange={(e) => setSettings({ ...settings, approvalMode: e.target.value as ApprovalMode })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition appearance-none cursor-pointer"
                   >
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                   </select>
                 </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500">
                    Last updated: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : "Never"}
                    {settings.updatedBy ? ` · ${settings.updatedBy}` : ""}
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save changes
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
                      <input 
                        type="checkbox" 
                        id="2fa-toggle" 
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer" 
                        checked={settings.twoFactorMandatory}
                        onChange={(e) => setSettings({...settings, twoFactorMandatory: e.target.checked})}
                      />
                      <span className="text-sm font-bold text-slate-800">Required for all admin accounts</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Minimum Password Length
                    </label>
                    <input 
                     type="number" 
                     value={settings.minPasswordLength}
                     onChange={(e) => setSettings({...settings, minPasswordLength: Number(e.target.value)})}
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
                     value={settings.sessionTimeout}
                     onChange={(e) => setSettings({...settings, sessionTimeout: Number(e.target.value)})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="text-xs font-medium text-slate-500">
                     Two-factor authentication: {settings.twoFactorMandatory ? "Required" : "Optional"}
                   </div>
                   <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                   >
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Update Security
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <p className="text-sm text-slate-500">
                  Email and SMS settings for booking confirmations, receipts, and support alerts.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <input type="checkbox" checked={settings.emailEnabled} onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })} className="h-5 w-5 accent-blue-600" />
                    Enable outbound email
                  </label>
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <input type="checkbox" checked={settings.smsEnabled} onChange={(e) => setSettings({ ...settings, smsEnabled: e.target.checked })} className="h-5 w-5 accent-blue-600" />
                    Enable SMS (Twilio)
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input placeholder="SMTP host" value={settings.smtpHost || ""} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input type="number" placeholder="SMTP port" value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input placeholder="SMTP user" value={settings.smtpUser || ""} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input type="password" placeholder="SMTP password" value={settings.smtpPass || ""} onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input placeholder="From address" value={settings.emailFrom || ""} onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input placeholder="Admin notify email" value={settings.adminNotifyEmail || ""} onChange={(e) => setSettings({ ...settings, adminNotifyEmail: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input placeholder="Twilio Account SID" value={settings.twilioAccountSid || ""} onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold md:col-span-2" />
                  <input type="password" placeholder="Twilio Auth Token" value={settings.twilioAuthToken || ""} onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input placeholder="Twilio from number (+1...)" value={settings.twilioFromNumber || ""} onChange={(e) => setSettings({ ...settings, twilioFromNumber: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                </div>
                <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-6">
                  <input placeholder="Test email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm" />
                  <button type="button" onClick={async () => { try { await apiPost("/admin/email/test", { to: testEmail }); toastSuccess("Test email sent", "Check the inbox for the recipient you entered."); } catch (e) { toastError("Test failed", String(e)); } }} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase text-white">Test email</button>
                  <input placeholder="Test phone +507..." value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm" />
                  <button type="button" onClick={async () => { try { await apiPost("/admin/sms/test", { to: testPhone }); toastSuccess("Test SMS sent"); } catch (e) { toastError("Test failed", String(e)); } }} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-white">Test SMS</button>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save email & SMS
                </button>
              </div>
            )}

            {activeTab === 'footer' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <p className="text-sm text-slate-500">
                  Social links, app store buttons, and footer navigation for the customer site.
                </p>
                <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showFooterDownloadApp !== false}
                    onChange={(e) => setSettings({ ...settings, showFooterDownloadApp: e.target.checked })}
                    className="h-5 w-5 accent-blue-600"
                  />
                  Show Download App in the footer
                </label>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Social media</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      placeholder="Facebook URL (https://facebook.com/...)"
                      value={settings.socialFacebookUrl || ""}
                      onChange={(e) => setSettings({ ...settings, socialFacebookUrl: e.target.value })}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold"
                    />
                    <input
                      placeholder="Instagram URL (https://instagram.com/...)"
                      value={settings.socialInstagramUrl || ""}
                      onChange={(e) => setSettings({ ...settings, socialInstagramUrl: e.target.value })}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold"
                    />
                    <input
                      placeholder="LinkedIn URL (https://linkedin.com/...)"
                      value={settings.socialLinkedinUrl || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinkedinUrl: e.target.value })}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold"
                    />
                  </div>
                </div>
                <FooterLinkEditor
                  title="Legal"
                  items={[
                    { label: "About us", urlKey: "footerAboutUrl", showKey: "showFooterAbout", placeholder: "/about" },
                    { label: "Careers", urlKey: "footerJobsUrl", showKey: "showFooterJobs", placeholder: "/jobs" },
                    { label: "Privacy Policy", urlKey: "footerPrivacyUrl", showKey: "showFooterPrivacy", placeholder: "/privacy" },
                    { label: "Terms of Service", urlKey: "footerTermsUrl", showKey: "showFooterTerms", placeholder: "/terms" },
                  ]}
                  settings={settings}
                  setSettings={setSettings}
                />
                <FooterLinkEditor
                  title="For clients"
                  items={[
                    { label: "Download App", urlKey: null, showKey: "showFooterDownloadApp", placeholder: "/download", fixedUrl: "/download" },
                    { label: "How it works", urlKey: "footerHowUrl", showKey: "showFooterHow", placeholder: "/how-it-works" },
                    { label: "Customer Support", urlKey: "footerSupportUrl", showKey: "showFooterSupport", placeholder: "/customer-service" },
                    { label: "Events", urlKey: "footerEventsUrl", showKey: "showFooterEvents", placeholder: "/events" },
                  ]}
                  settings={settings}
                  setSettings={setSettings}
                />
                <FooterLinkEditor
                  title="For business"
                  items={[
                    { label: "Join as business", urlKey: "footerJoinUrl", showKey: "showFooterJoin", placeholder: "/business/join" },
                    { label: "Business login", urlKey: "footerBizLoginUrl", showKey: "showFooterBizLogin", placeholder: "/business/login" },
                    { label: "Pricing", urlKey: "footerPricingUrl", showKey: "showFooterPricing", placeholder: "/pricing" },
                    { label: "Business support", urlKey: "footerBizSupportUrl", showKey: "showFooterBizSupport", placeholder: "/business/support" },
                  ]}
                  settings={settings}
                  setSettings={setSettings}
                />
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">App stores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="App Store URL"
                      value={settings.appStoreUrl || ""}
                      onChange={(e) => setSettings({ ...settings, appStoreUrl: e.target.value })}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold"
                    />
                    <input
                      placeholder="Google Play URL"
                      value={settings.playStoreUrl || ""}
                      onChange={(e) => setSettings({ ...settings, playStoreUrl: e.target.value })}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500">
                    Leave a URL empty to hide that footer link.
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save footer
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
                      <input 
                        type="checkbox" 
                        id="maint-toggle" 
                        className="w-5 h-5 accent-rose-600 rounded cursor-pointer" 
                        checked={settings.maintenanceMode}
                        onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                      />
                      <span className="text-sm font-bold text-slate-800">Show maintenance page to visitors</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-3 h-3" />
                      Database Retention (Days)
                    </label>
                    <input 
                     type="number" 
                     value={settings.databaseRetention}
                     onChange={(e) => setSettings({...settings, databaseRetention: Number(e.target.value)})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-wide">Home Master Banner</h3>
                      <p className="text-sm font-medium text-slate-500">
                        Controls the top banner on Web and the first promo banner on Mobile.
                      </p>
                    </div>
                    <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={settings.homeHeroEnabled !== false}
                        onChange={(e) => setSettings({ ...settings, homeHeroEnabled: e.target.checked })}
                        className="h-5 w-5 accent-rose-600"
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Title</label>
                      <input
                        value={settings.homeHeroTitle || ""}
                        onChange={(e) => setSettings({ ...settings, homeHeroTitle: e.target.value })}
                        placeholder="Beauty bookings, instant"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Subtitle</label>
                      <input
                        value={settings.homeHeroSubtitle || ""}
                        onChange={(e) => setSettings({ ...settings, homeHeroSubtitle: e.target.value })}
                        placeholder="Find and book with top local experts"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Deal pill (optional)</label>
                      <input
                        value={settings.homeHeroDealText || ""}
                        onChange={(e) => setSettings({ ...settings, homeHeroDealText: e.target.value })}
                        placeholder="30% OFF · This week only"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Banner image URL</label>
                      <input
                        value={settings.homeHeroImageUrl || ""}
                        onChange={(e) => setSettings({ ...settings, homeHeroImageUrl: e.target.value })}
                        placeholder="https://... (or /relative)"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
                      />
                      <p className="text-[11px] font-semibold text-slate-500">
                        Tip: use an https image URL for fastest loading.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">CTA text</label>
                      <input
                        value={settings.homeHeroCtaText || ""}
                        onChange={(e) => setSettings({ ...settings, homeHeroCtaText: e.target.value })}
                        placeholder="Book now"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">CTA URL</label>
                      <input
                        value={settings.homeHeroCtaUrl || ""}
                        onChange={(e) => setSettings({ ...settings, homeHeroCtaUrl: e.target.value })}
                        placeholder="/search?categoryKey=hairService (or https://...)"
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     Payments & maps
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                      <input type="checkbox" checked={!!settings.yappyEnabled} onChange={(e) => setSettings({ ...settings, yappyEnabled: e.target.checked })} className="h-5 w-5 accent-blue-600" />
                      Enable Yappy payments
                    </label>
                    <input
                      placeholder="Yappy merchant ID (optional)"
                      value={settings.yappyMerchantId || ""}
                      onChange={(e) => setSettings({ ...settings, yappyMerchantId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold"
                    />
                    <div className="relative group">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Stripe</span>
                       <input 
                        type="password" 
                        value={settings.stripeApiKey || ""}
                        onChange={(e) => setSettings({...settings, stripeApiKey: e.target.value})}
                        placeholder="sk_test_••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-20 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                       />
                    </div>
                    <div className="relative group">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">G-Maps</span>
                       <input 
                        type="password" 
                        value={settings.googleMapsApiKey || ""}
                        onChange={(e) => setSettings({...settings, googleMapsApiKey: e.target.value})}
                        placeholder="AIzaSy••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-20 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
                       />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                   >
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Save platform settings
                   </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
