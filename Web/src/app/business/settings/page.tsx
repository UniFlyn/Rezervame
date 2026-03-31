'use client';

import { useState } from 'react';
import { useBusinessStore } from '../../../store/businessStore';
import { ToggleRight, BellOff } from 'lucide-react';
import { useI18n } from '../../../components/I18nProvider';

export default function SettingsPage() {
  const business = useBusinessStore((state) => state.business);
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="space-y-10 max-w-2xl mx-auto pb-20">
      <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">{t('settingsTitle' as any)}</h2>
      
      <div className="space-y-8">
        {/* Language Selection */}
        <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{t('panelLanguage' as any)}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{t('panelLanguageSub' as any)}</p>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'en', label: 'English', flag: '🇺🇸' },
              { id: 'es', label: 'Español', flag: '🇪🇸' }
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id as any)}
                className={`flex items-center justify-between p-6 rounded-3xl border-4 transition-all ${language === l.id ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-50 hover:border-slate-200 bg-slate-50'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{l.flag}</span>
                  <span className={`font-black uppercase tracking-widest text-sm ${language === l.id ? 'text-primary' : 'text-slate-500'}`}>{l.label}</span>
                </div>
                {language === l.id && <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
          <div className="p-10 border-b border-gray-100">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{t('subscriptionPlan' as any)}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{t('subscriptionPlanSub' as any)}</p>
            
            <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between shadow-2xl shadow-slate-900/20">
              <div>
                <p className="font-black text-white text-2xl uppercase tracking-tight italic">Premium Pro</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('activeUntil' as any)}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary">$49.00<span className="text-xs text-slate-400 font-bold">/mes</span></p>
                <button className="mt-2 text-[10px] font-black text-white hover:text-primary uppercase tracking-widest transition-colors">{t('changePlan' as any)}</button>
              </div>
            </div>
          </div>

          <div className="p-10">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{t('notifications' as any)}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{t('notificationsSub' as any)}</p>
            
            <ul className="space-y-6">
              {[
                { label: t('apptAlerts' as any), desc: t('apptAlertsDesc' as any) },
                { label: t('cancellations' as any), desc: t('cancellationsDesc' as any) },
                { label: t('dailySummary' as any), desc: t('dailySummaryDesc' as any) },
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors -mx-4 px-4 rounded-2xl">
                  <div>
                    <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                  </div>
                  <div className="cursor-pointer">
                    <ToggleRight className={`h-10 w-10 transition-colors ${i !== 2 ? 'text-primary' : 'text-slate-200'}`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
