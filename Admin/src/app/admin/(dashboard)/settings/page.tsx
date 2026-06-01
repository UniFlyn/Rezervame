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
  Share2,
  Mail,
  CreditCard,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiGet, apiPost } from "@/lib/api";
import { publishVisitorSiteStatus } from "@/lib/publishSiteStatus";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  SettingsCheckbox,
  SettingsInput,
  StatusPill,
} from "@/components/admin/IntegrationSettingsFields";

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
    googleMapsApiKey: "",
    wompiEnabled: true,
    wompiPublicKey: "",
    wompiPrivateKey: "",
    wompiEnv: "sandbox",
    wompiWebhookSecret: "",
    yappyEnabled: true,
    yappyMerchantId: "",
    yappySecretToken: "",
    cashPayEnabled: true,
    cardPayEnabled: true,
    postmarkApiKey: "",
    postmarkFromEmail: "noreply@rezervame.com",
    postmarkReplyTo: "soporte@rezervame.com",
    postmarkMessageStream: "outbound",
    postmarkWebhookToken: "",
    s3Region: "ap-southeast-2",
    s3BucketName: "rezervame-assets-abs",
    s3PublicBaseUrl: "https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com",
    s3UploadPrefix: "uploads",
    s3AccessKeyId: "",
    s3SecretAccessKey: "",
    integrationStatus: {
      postmark: false,
      s3: false,
      wompi: false,
      yappy: false,
    },
    adminNotifyEmail: "",
    smsEnabled: false,
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
    updatedAt: "",
    updatedBy: "System Admin"
  });
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["general", "security", "email", "payments", "aws", "notifications", "platform", "footer"].includes(tab)
    ) {
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
          wompiEnabled: data.wompiEnabled ?? data.cardPayEnabled ?? prev.wompiEnabled,
          wompiPublicKey: data.wompiPublicKey ?? prev.wompiPublicKey,
          wompiPrivateKey: data.wompiPrivateKey ?? prev.wompiPrivateKey,
          wompiEnv: data.wompiEnv ?? prev.wompiEnv,
          wompiWebhookSecret: data.wompiWebhookSecret ?? prev.wompiWebhookSecret,
          yappyEnabled: data.yappyEnabled ?? prev.yappyEnabled,
          yappyMerchantId: data.yappyMerchantId ?? prev.yappyMerchantId,
          yappySecretToken: data.yappySecretToken ?? prev.yappySecretToken,
          cashPayEnabled: data.cashPayEnabled ?? prev.cashPayEnabled,
        }));
      }
    } catch (err) {
      toastError("Failed to load settings", String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveAwsSettings() {
    try {
      setIsSaving(true);
      const payload = {
        ...settings,
        approvalMode: normalizeApprovalMode(settings.approvalMode),
        s3Region: settings.s3Region?.trim() || "ap-southeast-2",
        s3BucketName: settings.s3BucketName?.trim() || "rezervame-assets-abs",
        s3PublicBaseUrl:
          settings.s3PublicBaseUrl?.trim() ||
          "https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com",
        s3UploadPrefix: settings.s3UploadPrefix?.trim() || "uploads",
        ...(settings.s3AccessKeyId === "***" ? {} : { s3AccessKeyId: settings.s3AccessKeyId }),
        ...(settings.s3SecretAccessKey === "***" ? {} : { s3SecretAccessKey: settings.s3SecretAccessKey }),
      };
      const updated = await apiPost<any>("/admin/config", payload);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        approvalMode: normalizeApprovalMode(updated.approvalMode),
      }));
      toastSuccess("Media storage saved", "Your changes were applied.");
    } catch (err) {
      toastError("Failed to save settings", String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveEmailSettings() {
    try {
      setIsSaving(true);
      const payload = {
        ...settings,
        approvalMode: normalizeApprovalMode(settings.approvalMode),
        emailEnabled: false,
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: "",
        smtpPass: "",
        emailFrom: "",
        postmarkFromEmail: settings.postmarkFromEmail?.trim() || "noreply@rezervame.com",
        postmarkReplyTo: settings.postmarkReplyTo?.trim() || "soporte@rezervame.com",
        postmarkMessageStream: settings.postmarkMessageStream?.trim() || "outbound",
      };
      const updated = await apiPost<any>("/admin/config", payload);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        approvalMode: normalizeApprovalMode(updated.approvalMode),
      }));
      toastSuccess("Email settings saved", "Your changes were applied.");
    } catch (err) {
      toastError("Failed to save settings", String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePaymentSettings() {
    try {
      setIsSaving(true);
      const payload = {
        ...settings,
        approvalMode: normalizeApprovalMode(settings.approvalMode),
        wompiEnv: settings.wompiEnv?.trim() || "sandbox",
        ...(settings.wompiPrivateKey === "***" ? {} : { wompiPrivateKey: settings.wompiPrivateKey }),
        ...(settings.wompiWebhookSecret === "***" ? {} : { wompiWebhookSecret: settings.wompiWebhookSecret }),
        ...(settings.yappySecretToken === "***" ? {} : { yappySecretToken: settings.yappySecretToken }),
        stripeApiKey: "",
        stripePublishableKey: "",
        stripeWebhookSecret: "",
      };
      const updated = await apiPost<any>("/admin/config", payload);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        approvalMode: normalizeApprovalMode(updated.approvalMode),
      }));
      toastSuccess("Payment settings saved", "Your changes were applied.");
    } catch (err) {
      toastError("Failed to save settings", String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveSecuritySettings() {
    try {
      setIsSaving(true);
      const payload = {
        ...settings,
        approvalMode: normalizeApprovalMode(settings.approvalMode),
        minPasswordLength: Math.min(128, Math.max(4, Number(settings.minPasswordLength) || 8)),
        sessionTimeout: Math.min(10_080, Math.max(5, Number(settings.sessionTimeout) || 60)),
      };
      const updated = await apiPost<any>("/admin/config", payload);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        approvalMode: normalizeApprovalMode(updated.approvalMode),
      }));
      toastSuccess("Security settings saved", "Password rules, sessions, and admin verification are updated.");
    } catch (err) {
      toastError("Failed to save settings", String(err));
    } finally {
      setIsSaving(false);
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
      await publishVisitorSiteStatus({
        maintenanceMode: updated.maintenanceMode,
        platformBranding: updated.platformBranding,
      });
      toastSuccess("Settings saved", "Your changes were applied.");
    } catch (err) {
      toastError("Failed to save settings", String(err));
    } finally {
      setIsSaving(false);
    }
  }

  const integration = settings.integrationStatus ?? {
    postmark: false,
    s3: false,
    wompi: false,
    yappy: false,
  };

  const tabs = [
    { id: "general", name: "General", icon: Settings },
    { id: "security", name: "Security", icon: Lock },
    { id: "email", name: "Email", icon: Mail },
    { id: "payments", name: "Payments", icon: CreditCard },
    { id: "aws", name: "Media storage", icon: Cloud },
    { id: "notifications", name: "SMS & alerts", icon: Bell },
    { id: "platform", name: "Platform", icon: Database },
    { id: "footer", name: "Footer & Apps", icon: Share2 },
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
          <p className="text-slate-500 text-sm mt-1">
            Email, payments, media storage, security, and site content.
          </p>
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
                    <p className="text-[11px] font-medium text-slate-500">
                      Used when customers, businesses, and admins create or reset passwords.
                    </p>
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
                    <p className="text-[11px] font-medium text-slate-500">
                      Signed-in users are logged out after this many minutes of inactivity.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="text-xs font-medium text-slate-500">
                     Admin 2FA: {settings.twoFactorMandatory ? "On" : "Off"} · Min password: {settings.minPasswordLength} · Session: {settings.sessionTimeout} min
                   </div>
                   <button 
                    onClick={() => void handleSaveSecuritySettings()}
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                   >
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Update Security
                   </button>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <p className="text-sm text-slate-500">
                  Booking confirmations, password resets, receipts, and admin alerts send from rezervame.com.
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusPill ok={integration.postmark} label="Email" />
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6 space-y-4">
                  <h3 className="text-sm font-black text-slate-900">Email provider</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsInput
                      label="Server API token"
                      type="password"
                      mono
                      value={settings.postmarkApiKey || ""}
                      placeholder="Enter API token"
                      onChange={(v) => setSettings({ ...settings, postmarkApiKey: v })}
                      hint={settings.postmarkApiKey === "***" ? "Leave blank to keep the current token." : undefined}
                    />
                    <SettingsInput
                      label="From email"
                      value={settings.postmarkFromEmail || ""}
                      placeholder="noreply@rezervame.com"
                      onChange={(v) => setSettings({ ...settings, postmarkFromEmail: v })}
                    />
                    <SettingsInput
                      label="Reply-to"
                      value={settings.postmarkReplyTo || ""}
                      placeholder="soporte@rezervame.com"
                      onChange={(v) => setSettings({ ...settings, postmarkReplyTo: v })}
                    />
                    <SettingsInput
                      label="Message stream"
                      value={settings.postmarkMessageStream || ""}
                      placeholder="outbound"
                      onChange={(v) => setSettings({ ...settings, postmarkMessageStream: v })}
                    />
                    <SettingsInput
                      label="Webhook token"
                      type="password"
                      mono
                      value={settings.postmarkWebhookToken || ""}
                      placeholder="Optional"
                      onChange={(v) => setSettings({ ...settings, postmarkWebhookToken: v })}
                      hint={settings.postmarkWebhookToken === "***" ? "Leave blank to keep the current value." : undefined}
                    />
                    <SettingsInput
                      label="Admin notify email"
                      value={settings.adminNotifyEmail || ""}
                      placeholder="you@rezervame.com"
                      onChange={(v) => setSettings({ ...settings, adminNotifyEmail: v })}
                      hint="Receives support tickets and platform alerts."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-6">
                  <input placeholder="Test email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm" />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await apiPost<{ message?: string; provider?: string }>(
                          "/admin/email/test",
                          { to: testEmail },
                        );
                        toastSuccess(
                          "Test email sent",
                          res?.message || `Sent via ${res?.provider || "email"}. Check the inbox.`,
                        );
                      } catch (e) {
                        toastError("Test failed", String(e));
                      }
                    }}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase text-white"
                  >
                    Test email
                  </button>
                </div>
                <button onClick={() => void handleSaveEmailSettings()} disabled={isSaving} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save email settings
                </button>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <p className="text-sm text-slate-500">
                  Card payments (Wompi), Yappy wallet, and pay by visit at checkout.
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusPill ok={integration.wompi} label="Wompi (cards)" />
                  <StatusPill ok={integration.yappy} label="Yappy" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SettingsCheckbox
                    label="Enable Wompi (cards)"
                    checked={settings.wompiEnabled !== false && settings.cardPayEnabled !== false}
                    onChange={(v) => setSettings({ ...settings, wompiEnabled: v, cardPayEnabled: v })}
                  />
                  <SettingsCheckbox
                    label="Enable Yappy"
                    checked={!!settings.yappyEnabled}
                    onChange={(v) => setSettings({ ...settings, yappyEnabled: v })}
                  />
                  <SettingsCheckbox
                    label="Enable pay by visit"
                    checked={!!settings.cashPayEnabled}
                    onChange={(v) => setSettings({ ...settings, cashPayEnabled: v })}
                  />
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-6 space-y-4">
                  <h3 className="text-sm font-black text-slate-900">Wompi (cards)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsInput
                      label="Public key"
                      mono
                      value={settings.wompiPublicKey || ""}
                      placeholder="pub_test_..."
                      onChange={(v) => setSettings({ ...settings, wompiPublicKey: v })}
                    />
                    <SettingsInput
                      label="Private key"
                      type="password"
                      mono
                      value={settings.wompiPrivateKey || ""}
                      placeholder="prv_test_..."
                      onChange={(v) => setSettings({ ...settings, wompiPrivateKey: v })}
                      hint={settings.wompiPrivateKey === "***" ? "Leave blank to keep the current key." : undefined}
                    />
                    <SettingsInput
                      label="Environment"
                      value={settings.wompiEnv || "sandbox"}
                      placeholder="sandbox | production"
                      onChange={(v) => setSettings({ ...settings, wompiEnv: v })}
                    />
                    <SettingsInput
                      label="Webhook secret"
                      type="password"
                      mono
                      value={settings.wompiWebhookSecret || ""}
                      onChange={(v) => setSettings({ ...settings, wompiWebhookSecret: v })}
                      hint={settings.wompiWebhookSecret === "***" ? "Leave blank to keep the current value." : undefined}
                    />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-100 p-6 space-y-4">
                  <h3 className="text-sm font-black text-slate-900">Yappy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsInput
                      label="Merchant ID"
                      value={settings.yappyMerchantId || ""}
                      onChange={(v) => setSettings({ ...settings, yappyMerchantId: v })}
                    />
                    <SettingsInput
                      label="Secret token"
                      type="password"
                      mono
                      value={settings.yappySecretToken || ""}
                      onChange={(v) => setSettings({ ...settings, yappySecretToken: v })}
                      hint={settings.yappySecretToken === "***" ? "Leave blank to keep the current value." : undefined}
                    />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-100 p-6 space-y-4">
                  <h3 className="text-sm font-black text-slate-900">Maps (checkout / search)</h3>
                  <SettingsInput
                    label="Google Maps API key"
                    type="password"
                    mono
                    value={settings.googleMapsApiKey || ""}
                    onChange={(v) => setSettings({ ...settings, googleMapsApiKey: v })}
                  />
                </div>
                <button
                  onClick={() => void handleSavePaymentSettings()}
                  disabled={isSaving}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save payment gateways
                </button>
              </div>
            )}

            {activeTab === "aws" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <p className="text-sm text-slate-500">
                  Store venue logos, banners, gallery photos, and site images.
                </p>
                <StatusPill ok={integration.s3} label="Media storage" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingsInput label="AWS region" value={settings.s3Region || ""} placeholder="ap-southeast-2" onChange={(v) => setSettings({ ...settings, s3Region: v })} />
                  <SettingsInput label="Bucket name" value={settings.s3BucketName || ""} placeholder="rezervame-assets-abs" onChange={(v) => setSettings({ ...settings, s3BucketName: v })} />
                  <SettingsInput label="Public URL" value={settings.s3PublicBaseUrl || ""} placeholder="https://…" onChange={(v) => setSettings({ ...settings, s3PublicBaseUrl: v })} />
                  <SettingsInput label="Upload prefix" value={settings.s3UploadPrefix || ""} placeholder="uploads" onChange={(v) => setSettings({ ...settings, s3UploadPrefix: v })} />
                  <SettingsInput label="Access key ID" type="password" mono value={settings.s3AccessKeyId || ""} onChange={(v) => setSettings({ ...settings, s3AccessKeyId: v })} hint={settings.s3AccessKeyId === "***" ? "Leave blank to keep the current key." : undefined} />
                  <SettingsInput label="Secret access key" type="password" mono value={settings.s3SecretAccessKey || ""} onChange={(v) => setSettings({ ...settings, s3SecretAccessKey: v })} hint={settings.s3SecretAccessKey === "***" ? "Leave blank to keep the current secret." : undefined} />
                </div>
                <button onClick={() => void handleSaveAwsSettings()} disabled={isSaving} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save AWS settings
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <p className="text-sm text-slate-500">
                  SMS alerts and ticket notifications.
                </p>
                <SettingsCheckbox label="Enable SMS (Twilio)" checked={!!settings.smsEnabled} onChange={(v) => setSettings({ ...settings, smsEnabled: v })} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input placeholder="Twilio Account SID" value={settings.twilioAccountSid || ""} onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input type="password" placeholder="Twilio Auth Token" value={settings.twilioAuthToken || ""} onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold" />
                  <input placeholder="Twilio from number (+1...)" value={settings.twilioFromNumber || ""} onChange={(e) => setSettings({ ...settings, twilioFromNumber: e.target.value })} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold md:col-span-2" />
                </div>
                <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-6">
                  <input placeholder="Test phone +507..." value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm" />
                  <button type="button" onClick={async () => { try { await apiPost("/admin/sms/test", { to: testPhone }); toastSuccess("Test SMS sent"); } catch (e) { toastError("Test failed", String(e)); } }} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-white">Test SMS</button>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save SMS settings
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
