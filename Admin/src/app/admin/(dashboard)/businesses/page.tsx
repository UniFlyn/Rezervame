"use client";

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Plus,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  FileBadge,
  History,
  X,
  HistoryIcon,
  Store,
  User,
  Hash,
  Activity
} from "lucide-react";
import businessesData from "@/mock-data/admin-businesses.json";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    suspended: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", styles[status as keyof typeof styles])}>
      {status}
    </span>
  );
};

export default function BusinessesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredBusinesses = businessesData.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          business.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || business.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase tracking-tighter italic">Merchant Registry</h1>
          <p className="text-slate-500 text-sm mt-1">Review, approve, and manage all platform service providers.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Business Form
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-white">
          <div className="relative w-full md:w-[28rem]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by business name or owner..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest outline-none w-full md:w-48 appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Global List</option>
              <option value="active">Active Gate</option>
              <option value="pending">Review Queue</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 italic">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity / Origin</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Tracking</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Revenue (LTD)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200">
                        {business.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm tracking-tight">{business.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <MapPin className="w-3 h-3 text-slate-300" />
                           <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[12rem]">{business.address}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-700 tracking-tight">{business.owner}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 underline decoration-slate-200">{business.email}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <StatusBadge status={business.status} />
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(business.revenue)}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedBusiness(business)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                        business.status === 'pending' || business.isReApprovable
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {business.status === 'pending' ? "Review Signup" : (business.isReApprovable ? "Re-Approve" : "View Record")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Business Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-2xl">
                   <Plus className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Register New Merchant</h2>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Manual Entry Mode</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-3 text-slate-400 hover:bg-white hover:text-slate-900 rounded-2xl transition shadow-sm border border-transparent hover:border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Store className="w-3 h-3" /> Business Name
                  </label>
                  <input type="text" placeholder="e.g. Royal Cuts" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Owner Full Name
                  </label>
                  <input type="text" placeholder="e.g. John Doe" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Business Email
                  </label>
                  <input type="email" placeholder="owner@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Contact Phone
                  </label>
                  <input type="tel" placeholder="+1 (555) 000-0000" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Physical Address
                  </label>
                  <input type="text" placeholder="Full street address, city, state" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Tax ID / EIN
                  </label>
                  <input type="text" placeholder="TX-00000000" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Initial Status
                  </label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold uppercase tracking-widest outline-none appearance-none">
                    <option value="pending">Pending Review</option>
                    <option value="active">Instant Approval</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button 
                onClick={() => setShowAddForm(false)}
                className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-950/10 active:scale-95"
              >
                Create Merchant Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-2xl shadow-xl shadow-blue-600/20">
                   <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Application Review</h2>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ref: {selectedBusiness.id}</p>
                 </div>
              </div>
              <button 
                onClick={() => setSelectedBusiness(null)}
                className="p-3 text-slate-400 hover:bg-white hover:text-slate-900 rounded-2xl transition shadow-sm border border-transparent hover:border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 italic">Business Intent</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Commercial Name</label>
                      <p className="text-lg font-black text-slate-900 leading-none">{selectedBusiness.name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Legal Owner</label>
                      <p className="text-sm font-bold text-slate-700">{selectedBusiness.owner}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tax ID / Incorporation</label>
                      <p className="text-sm font-black font-mono text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">{selectedBusiness.taxId}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Service Categories</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedBusiness.services.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 italic">Document Verification</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'id_verified', label: 'Government Issued ID', status: selectedBusiness.documents.id_verified },
                      { key: 'license_verified', label: 'Trade License / Permit', status: selectedBusiness.documents.license_verified },
                      { key: 'insurance_verified', label: 'Commercial Insurance', status: selectedBusiness.documents.insurance_verified }
                    ].map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3">
                           <FileBadge className={cn("w-5 h-5", doc.status ? "text-blue-500" : "text-slate-300")} />
                           <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{doc.label}</span>
                        </div>
                        {doc.status ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic animate-pulse">Required</span>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedBusiness.history && (
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 italic">Correction History</h3>
                    <div className="space-y-3">
                      {selectedBusiness.history.map((h: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                           <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                             <HistoryIcon className="w-4 h-4 text-slate-400" />
                           </div>
                           <div className="flex-1">
                             <p className="text-[10px] font-black text-slate-900 uppercase">{h.action}</p>
                             <p className="text-xs text-slate-500 font-medium italic">{h.note}</p>
                           </div>
                           <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">{h.date}</span>
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {selectedBusiness.status === 'suspended' && selectedBusiness.rejectionReason && (
                 <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 space-y-3">
                    <div className="flex items-center gap-2 text-rose-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Rejection Note on Record</span>
                    </div>
                    <p className="text-sm font-medium text-rose-700 leading-relaxed italic">"{selectedBusiness.rejectionReason}"</p>
                 </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                 <button className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition shadow-sm border border-rose-200">
                   Reject Application
                 </button>
                 <button className="bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition shadow-sm">
                   Flag as Spam
                 </button>
              </div>
              <button className="w-full md:w-64 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-950/10 active:scale-95 flex items-center justify-center gap-2">
                 {selectedBusiness.isReApprovable ? "Confirm Re-Approval" : "Commission Active Duty"}
                 <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
