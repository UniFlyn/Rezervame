"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useI18n } from "../../components/I18nProvider";
import { useAuth } from "../../components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Trash2, Edit2, Shield, User as UserIcon, 
  Users, Calendar, Heart, Lock, CheckCircle, 
  X, Plus, Camera, LogOut, ChevronRight, Mail, Phone,
  MapPin, Star, Download, RefreshCcw, Clock
} from "lucide-react";
import Link from "next/link";

type Tab = "bookings" | "family" | "settings" | "favorites" | "invoices";

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  gender: string;
}

interface Reservation {
  id: string;
  venueName: string;
  serviceName: string;
  date: string;
  time: string;
  price: string;
  status: "confirmed" | "completed" | "cancelled";
  img: string;
  address?: string;
  phone?: string;
  items?: { name: string; price: string }[];
}

function ProfileContent() {
  const { language } = useI18n();
  const { isLoggedIn, user, logout, setIsLoginModalOpen } = useAuth() as any;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: "1", name: "Sofia Lucas", age: 12, gender: "Femenino" },
    { id: "2", name: "Mateo Lucas", age: 8, gender: "Masculino" }
  ]);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [linkedGoogle, setLinkedGoogle] = useState(true);
  const [linkedFacebook, setLinkedFacebook] = useState(false);
  const [linkedInstagram, setLinkedInstagram] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      router.push("/");
    }
    
    const tab = searchParams.get("tab") as Tab;
    if (tab && ["bookings", "family", "settings", "favorites", "invoices"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [isLoggedIn, setIsLoginModalOpen, router, searchParams]);

  if (!isLoggedIn) return null;

  const handleAddFamily = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newMember = {
      id: editingMember?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string) || 0,
      gender: formData.get("gender") as string,
    };

    if (editingMember) {
      setFamilyMembers(familyMembers.map(m => m.id === editingMember.id ? newMember : m));
    } else {
      setFamilyMembers([...familyMembers, newMember]);
    }
    setIsFamilyModalOpen(false);
    setEditingMember(null);
  };

  const handleDownloadInvoice = (id: string) => {
    const msg =
      language === "en"
        ? `Invoice ${id} download started`
        : `Descarga de factura ${id} iniciada`;
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3800);
  };

  const menuItems = [
    { id: "bookings", label: language === "en" ? "My Reservations" : "Mis Reservas", icon: <Calendar size={20} /> },
    { id: "invoices", label: language === "en" ? "My Invoices" : "Mis Facturas", icon: <Download size={20} /> },
    { id: "family", label: language === "en" ? "Family & Friends" : "Familia y Amigos", icon: <Users size={20} /> },
    { id: "settings", label: language === "en" ? "Profile & Settings" : "Perfil y configuración", icon: <UserIcon size={20} /> },
    { id: "favorites", label: language === "en" ? "My Favorites" : "Mis Favoritos", icon: <Heart size={20} /> }
  ];

  const reservations: Reservation[] = [
    {
      id: "RES-1234",
      venueName: "The Grooming Room",
      serviceName: "Corte de Cabello Premium + Barba",
      date: "15 de Abril, 2024",
      time: "10:30 AM",
      price: "$45.00",
      status: "confirmed",
      img: "1560066984-138dadb4c035",
      address: "Calle 50, Edificio F&F Tower, Piso 12",
      phone: "+507 223-4567",
      items: [
        { name: "Corte de Cabello Premium", price: "$35.00" },
        { name: "Perfilado de Barba", price: "$10.00" }
      ]
    },
    {
      id: "RES-1122",
      venueName: "Nail Society Soho",
      serviceName: "Manicura Spa",
      date: "12 de Marzo, 2024",
      time: "02:00 PM",
      price: "$30.00",
      status: "completed",
      img: "1585747860715-2ba37e788b70",
      address: "Ave. Balboa, Soho Mall, local 22",
      phone: "+507 300-9988",
      items: [
        { name: "Manicura Spa", price: "$25.00" },
        { name: "Esmaltado Permanente", price: "$5.00" }
      ]
    }
  ];

  const favorites = [
    { id: "1", n: 'The Grooming Room', rat: '4.9', i: '1560066984-138dadb4c035', cat: 'Barbería', open: true, addr: 'Calle 50, Ciudad de Panamá' },
    { id: "2", n: 'Nail Society Soho', rat: '4.9', i: '1585747860715-2ba37e788b70', cat: 'Manicura', open: true, addr: 'Ave. Balboa, Edificio Soho' }
  ];

  return (
    <div className="bg-slate-50 flex py-12 flex-1 animate-in fade-in duration-700">
        {/* Sidebar */}
        <aside className="w-[320px] bg-white border-r border-slate-200 p-8 flex flex-col hidden lg:flex rounded-r-[40px] shadow-sm shrink-0">
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 mb-4 shadow-sm bg-slate-100 flex items-center justify-center">
                <img 
                  src={user?.avatar || "/richard_lucas_avatar.png"} 
                  alt={user?.name || "User Profile"} 
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=ff5a5f&color=fff&size=128&bold=true`; 
                  }}
                />
              </div>
              <button className="absolute bottom-4 right-0 bg-[#ff5a5f] p-2.5 rounded-full text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110">
                <Camera size={14} />
              </button>
            </div>
            <h2 className="text-xl font-black text-slate-800">{user?.name}</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">+507 6899-0012</p>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                  activeTab === item.id 
                  ? "bg-[#ff5a5f]/10 text-[#ff5a5f]" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <span className={activeTab === item.id ? "text-[#ff5a5f]" : "text-slate-400"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="mt-auto flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold text-[#ff5a5f] hover:bg-[#ff5a5f]/5 transition-all text-sm"
          >
            <LogOut size={20} />
            <span>{language === "en" ? "Log Out" : "Cerrar Sesión"}</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-[1000px] mx-auto w-full">
          
          {/* TAB: BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    {language === "en" ? "My Reservations" : "Mis Reservas"}
                  </h1>
                  <p className="text-slate-400 font-bold text-sm">Gestiona tus citas y descarga tus facturas</p>
                </div>
              </div>
              
              <div className="mb-12">
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">{language === "en" ? "NEXT RESERVATION" : "PRÓXIMA RESERVA"}</h3>
                <div className="bg-white border-2 border-[#ff5a5f] rounded-3xl p-6 md:p-8 text-slate-900 shadow-md flex flex-col md:flex-row justify-between items-center group cursor-pointer hover:shadow-lg transition-all relative overflow-hidden ring-1 ring-[#ff5a5f]/10">
                  <div className="flex items-start gap-6 md:gap-8 relative z-10 w-full md:w-auto">
                    <div className="w-20 h-20 bg-[#ff5a5f]/10 rounded-2xl flex flex-col items-center justify-center font-black border border-[#ff5a5f]/25 shrink-0">
                       <span className="text-[11px] font-bold uppercase text-[#ff5a5f]">Oct</span>
                       <span className="text-3xl leading-none text-slate-900">24</span>
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="font-black text-xl md:text-2xl leading-tight text-slate-900">Corte de Cabello Premium</h4>
                      <p className="text-sm font-bold text-slate-600 mt-2">Luxe Hair Studio • 3:00 PM</p>
                      <div className="flex flex-wrap items-center gap-3 mt-4">
                         <span className="bg-[#ff5a5f]/10 text-[#ff5a5f] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-[#ff5a5f]/25">{language === "en" ? "Confirmed" : "Confirmada"}</span>
                         <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wide"><Phone size={14} className="text-[#ff5a5f]" /> Llamar local</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mt-6 md:mt-0 relative z-10 w-full md:w-auto shrink-0">
                     <div className="text-3xl md:text-4xl font-black text-slate-900 mb-3">$45.00</div>
                     <button 
                      onClick={() => {
                        setSelectedRes({
                          id: "RES-NEXT",
                          venueName: "Luxe Hair Studio",
                          serviceName: "Corte de Cabello Premium",
                          date: "24 de Octubre, 2024",
                          time: "3:00 PM",
                          price: "$45.00",
                          status: "confirmed",
                          img: "1560066984-138dadb4c035",
                          address: "Calle 50, Edificio F&F Tower, Piso 12",
                          phone: "+507 223-4567",
                          items: [
                            { name: "Corte de Cabello Premium", price: "$35.00" },
                            { name: "Perfilado de Barba", price: "$10.00" }
                          ]
                        });
                        setIsResModalOpen(true);
                      }}
                      className="text-xs font-black uppercase tracking-widest bg-[#ff5a5f] text-white px-8 py-3 rounded-2xl hover:bg-[#e0484d] transition-colors shadow-md"
                     >
                       {language === "en" ? "See Details" : "Ver detalles"}
                     </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{language === "en" ? "APPOINTMENT HISTORY" : "HISTORIAL DE CITAS"}</h3>
                <div className="space-y-6">
                  {reservations.map((res, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-[40px] p-8 flex justify-between items-center hover:shadow-2xl hover:shadow-slate-200/50 transition duration-500 shadow-sm group">
                      <div className="flex items-center space-x-8">
                        <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-slate-50 relative">
                           <img 
                             src={`https://images.unsplash.com/photo-${res.img}?q=80&w=200&fit=crop`} 
                             alt={res.venueName} 
                             className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80";
                             }}
                           />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-xl group-hover:text-[#ff5a5f] transition-colors">{res.venueName}</h4>
                          <p className="text-base font-bold text-slate-400 mt-1">{res.serviceName} • {res.date}</p>
                          <div className={`flex items-center gap-2 mt-3 ${res.status === 'confirmed' ? 'text-[#ff5a5f]' : 'text-green-500'}`}>
                             {res.status === 'confirmed' ? <Calendar size={16} /> : <CheckCircle size={16} />}
                             <span className="text-[10px] font-black uppercase tracking-widest">{res.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <div className="font-black text-slate-800 text-2xl mb-3">{res.price}</div>
                         <div className="flex gap-3">
                            <button 
                              onClick={() => { setSelectedRes(res); setIsResModalOpen(true); }} 
                              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 bg-slate-50 px-4 py-2 rounded-xl transition"
                            >
                               {language === "en" ? "Details" : "Detalles"}
                            </button>
                            <button onClick={() => handleDownloadInvoice(res.id)} className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition">
                               <Download size={18} />
                            </button>
                            <button className="text-xs font-black text-[#ff5a5f] uppercase tracking-widest hover:underline flex items-center gap-1 bg-[#ff5a5f]/5 px-6 py-3 rounded-2xl hover:bg-[#ff5a5f]/10 transition-all transform hover:-translate-y-1">
                                {language === "en" ? "Re-book" : "Reservar otra vez"}
                                <ChevronRight size={14} />
                            </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FAMILY */}
          {activeTab === "family" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900">{language === "en" ? "Family & Friends" : "Familia y Amigos"}</h2>
                    <p className="text-slate-400 font-bold text-sm mt-1">Gestiona las citas de tu círculo cercano</p>
                 </div>
                 <button 
                  onClick={() => { setEditingMember(null); setIsFamilyModalOpen(true); }}
                  className="bg-[#ff5a5f] text-white font-black px-6 py-3 rounded-2xl text-sm shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition flex items-center gap-2 transform hover:-translate-y-1"
                 >
                    <Plus size={18} /> {language === "en" ? "Add Member" : "Agregar miembro"}
                 </button>
               </div>
               
               {familyMembers.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center px-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                       <Users size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">{language === "en" ? "No members added yet" : "Tu lista está vacía"}</h3>
                    <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">Agrega a tus hijos, pareja o amigos para agendar servicios por ellos rápidamente.</p>
                    <button 
                      onClick={() => setIsFamilyModalOpen(true)}
                      className="text-[#ff5a5f] font-black text-sm uppercase tracking-widest hover:underline"
                    >
                      Comenzar ahora
                    </button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex justify-between items-center group hover:shadow-xl hover:shadow-slate-200/50 transition duration-500">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 bg-slate-100 rounded-[20px] flex items-center justify-center text-[#ff5a5f] font-black text-2xl border-2 border-white shadow-sm group-hover:bg-[#ff5a5f] group-hover:text-white transition-colors duration-500">
                             {member.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-lg group-hover:text-[#ff5a5f] transition-colors">{member.name}</h4>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{member.age} años • {member.gender}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                            onClick={() => { setEditingMember(member); setIsFamilyModalOpen(true); }}
                            className="p-3 text-slate-400 hover:text-[#ff5a5f] hover:bg-[#ff5a5f]/5 rounded-2xl transition-all"
                           >
                              <Edit2 size={18} />
                           </button>
                           <button 
                            onClick={() => setFamilyMembers(familyMembers.filter(m => m.id !== member.id))}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{language === "en" ? "Profile & Settings" : "Perfil y configuración"}</h2>
                  <p className="text-slate-400 font-bold text-sm mt-1">{language === "en" ? "Update your personal information" : "Actualiza tu información personal"}</p>
                </div>
                <button className="bg-slate-900 text-white font-black px-8 py-3 rounded-2xl text-sm shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1">
                  {language === "en" ? "Save Changes" : "Guardar cambios"}
                </button>
              </div>

              <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm space-y-10">
                <div className="flex items-center gap-8 pb-10 border-b border-slate-100">
                   <div className="relative group">
                      <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-lg">
                          <img 
                            src={user?.avatar || "/richard_lucas_avatar.png"} 
                            alt="User" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=ff5a5f&color=fff&size=128&bold=true`; 
                            }}
                          />
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer">
                         <Camera className="text-white" size={24} />
                      </div>
                   </div>
                   <div>
                     <h3 className="font-black text-slate-800 text-xl">{user?.name}</h3>
                     <p className="text-slate-400 font-bold text-sm">Miembro desde Noviembre 2023</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === "en" ? "Full Name" : "Nombre completo"}</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" defaultValue={user?.name} className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold text-slate-800" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === "en" ? "Phone" : "Teléfono"}</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" defaultValue="+507 6899-0012" className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold text-slate-800" />
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === "en" ? "Email Address" : "Correo electrónico"}</label>
                   <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="email" defaultValue={user?.email} className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold text-slate-800" />
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
                        <Lock size={22} />
                     </div>
                     <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{language === "en" ? "Change Password" : "Cambiar contraseña"}</h3>
                        <p className="text-slate-400 font-bold text-xs mt-1">Protege tu cuenta con una contraseña segura</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === "en" ? "Current Password" : "Contraseña actual"}</label>
                      <input type="password" placeholder="••••••••" className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === "en" ? "New Password" : "Nueva contraseña"}</label>
                      <input type="password" placeholder="••••••••" className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === "en" ? "Confirm Password" : "Confirmar contraseña"}</label>
                      <input type="password" placeholder="••••••••" className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold" />
                    </div>
                  </div>
                  
                  <div className="mt-10 flex justify-end">
                    <button className="bg-[#ff5a5f] text-white font-black px-10 py-4 rounded-[20px] text-xs uppercase tracking-widest shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition transform hover:-translate-y-1">
                       {language === "en" ? "Update Password" : "Actualizar contraseña"}
                    </button>
                  </div>
                </div>
              </div>

                <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm space-y-8">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg mb-1">
                      {language === "en" ? "Account connections" : "Conexión de cuentas"}
                    </h3>
                    <p className="text-slate-500 font-bold text-sm">
                      {language === "en"
                        ? "Link or unlink social accounts for faster sign-in."
                        : "Vincula o desvincula redes para iniciar sesión más rápido."}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { id: "google", label: "Google", connected: linkedGoogle, set: setLinkedGoogle },
                      { id: "facebook", label: "Facebook", connected: linkedFacebook, set: setLinkedFacebook },
                      { id: "instagram", label: "Instagram", connected: linkedInstagram, set: setLinkedInstagram },
                    ].map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50"
                      >
                        <span className="font-bold text-slate-800">{row.label}</span>
                        <button
                          type="button"
                          onClick={() => row.set(!row.connected)}
                          className={`text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border-2 transition-colors ${
                            row.connected
                              ? "border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600"
                              : "border-[#ff5a5f] bg-[#ff5a5f] text-white hover:bg-[#e0484d]"
                          }`}
                        >
                          {row.connected
                            ? language === "en"
                              ? "Disconnect"
                              : "Desconectar"
                            : language === "en"
                              ? "Connect"
                              : "Conectar"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm space-y-8">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg mb-1">
                      {language === "en" ? "Notifications" : "Notificaciones"}
                    </h3>
                    <p className="text-slate-500 font-bold text-sm">
                      {language === "en"
                        ? "Choose how you want to receive alerts."
                        : "Elige cómo quieres recibir las alertas."}
                    </p>
                  </div>
                  <div className="space-y-5">
                    {[
                      { label: "SMS", on: notifySms, set: setNotifySms },
                      { label: language === "en" ? "Email" : "Correo", on: notifyEmail, set: setNotifyEmail },
                      { label: "WhatsApp", on: notifyWhatsapp, set: setNotifyWhatsapp },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                        <span className="font-bold text-slate-800">{row.label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.on}
                          onClick={() => row.set(!row.on)}
                          className={`relative w-12 h-7 rounded-full transition-colors ${row.on ? "bg-slate-900" : "bg-slate-200"}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${row.on ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          )}

          {/* TAB: FAVORITES */}
          {activeTab === "favorites" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    {language === "en" ? "My Favorite Places" : "Mis Lugares Favoritos"}
                  </h1>
                  <p className="text-slate-400 font-bold text-sm">Tus locales preferidos en un solo lugar</p>
                </div>
                <div className="bg-white px-8 py-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-4">
                   <Heart className="text-[#ff5a5f]" size={24} fill="#ff5a5f" />
                   <span className="font-black text-slate-800 text-sm uppercase tracking-widest">{favorites.length} Locales</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {favorites.map((biz, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-[48px] p-8 flex flex-col sm:flex-row gap-8 hover:shadow-2xl hover:shadow-slate-200/50 transition duration-700 cursor-pointer group shadow-sm relative overflow-hidden">
                    <div className="w-full sm:w-44 h-44 rounded-[40px] overflow-hidden flex-shrink-0 relative border-2 border-white shadow-xl">
                       <img 
                         src={`https://images.unsplash.com/photo-${biz.i}?q=80&w=400&fit=crop`} 
                         alt={biz.n} 
                         className="w-full h-full object-cover group-hover:scale-125 transition duration-1000" 
                         onError={(e) => {
                           (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80";
                         }}
                       />
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl text-[#ff5a5f] shadow-lg transform group-hover:scale-110 transition border border-slate-100">
                        <Heart size={20} fill="#ff5a5f" />
                      </div>
                      <div className="absolute bottom-4 left-4">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border ${biz.open ? 'bg-green-500 text-white border-green-400 shadow-green-500/30' : 'bg-slate-500 text-white border-slate-400 shadow-slate-500/30'}`}>
                            {biz.open ? 'Abierto' : 'Cerrado'}
                         </span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-[#ff5a5f] font-black text-[11px] uppercase tracking-widest mb-2">{biz.cat}</p>
                      <h4 className="font-black text-slate-800 text-2xl group-hover:text-[#ff5a5f] transition-colors leading-tight">{biz.n}</h4>
                      <div className="flex items-center text-amber-400 text-base mt-4 bg-slate-50 self-start px-4 py-1.5 rounded-2xl border border-slate-100">
                        <span className="mr-2 font-bold select-none">★</span>
                        <span className="font-black text-slate-800">{biz.rat}</span>
                        <span className="text-slate-400 font-bold ml-3 border-l border-slate-200 pl-3 text-sm">124 reseñas</span>
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-slate-400">
                         <MapPin size={16} />
                         <span className="text-xs font-bold truncate max-w-[180px]">{biz.addr}</span>
                      </div>
                      <button className="mt-8 text-[11px] font-black text-white bg-slate-900 w-full py-4 rounded-3xl hover:bg-[#ff5a5f] transition-all transform hover:-translate-y-1 shadow-xl shadow-slate-100 hover:shadow-[#ff5a5f]/20 uppercase tracking-widest">
                         {language === "en" ? "Book Now" : "Reservar ahora"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: INVOICES */}
          {activeTab === "invoices" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    {language === "en" ? "My Invoices" : "Mis Facturas"}
                  </h1>
                  <p className="text-slate-500 font-bold text-sm tracking-normal">
                    {language === "en"
                      ? "Download and preview your transaction history"
                      : "Descarga y revisa tu historial de transacciones"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-8 py-5 text-[11px] font-black text-slate-700 uppercase tracking-wide">{language === "en" ? "Invoice ID" : "Factura"}</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-700 uppercase tracking-wide">{language === "en" ? "Date" : "Fecha"}</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-700 uppercase tracking-wide">{language === "en" ? "Business" : "Negocio"}</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-700 uppercase tracking-wide">{language === "en" ? "Amount" : "Importe"}</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-700 uppercase tracking-wide">{language === "en" ? "Status" : "Estado"}</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-700 uppercase tracking-wide text-center">{language === "en" ? "Actions" : "Acciones"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reservations.map((inv) => (
                        <tr key={inv.id} className="group hover:bg-slate-50/50 transition duration-300">
                            <td className="px-8 py-6">
                            <span className="font-black text-slate-800 text-sm">#{inv.id}</span>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-500">{inv.date}</td>
                            <td className="px-8 py-6">
                            <span className="font-bold text-slate-800">{inv.venueName}</span>
                            </td>
                            <td className="px-8 py-6">
                            <span className="font-black text-[#ff5a5f]">{inv.price}</span>
                            </td>
                            <td className="px-8 py-6">
                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                inv.status === 'completed' 
                                ? 'bg-green-50 text-green-500 border-green-100' 
                                : 'bg-amber-50 text-amber-500 border-amber-100'
                            }`}>
                                {inv.status === 'completed'
                                  ? (language === 'en' ? 'Paid' : 'Pagada')
                                  : (language === 'en' ? 'Pending' : 'Pendiente')}
                            </span>
                            </td>
                            <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-3">
                                <button 
                                onClick={() => { setSelectedRes(inv); setIsResModalOpen(true); }}
                                className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition group-hover:bg-white border border-transparent group-hover:border-slate-100 shadow-sm"
                                >
                                <Clock size={18} />
                                </button>
                                <button 
                                onClick={() => handleDownloadInvoice(inv.id)}
                                className="p-3 text-slate-400 hover:text-white hover:bg-[#ff5a5f] bg-slate-50 rounded-2xl transition group-hover:shadow-lg group-hover:shadow-[#ff5a5f]/20"
                                >
                                <Download size={18} />
                                </button>
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
              </div>
            </div>
          )}

        </main>

      {/* FAMILY MODAL */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsFamilyModalOpen(false)}></div>
          <div className="bg-white w-full max-w-[440px] rounded-3xl shadow-2xl relative z-10 p-8 sm:p-10 animate-in zoom-in-95 duration-500 overflow-hidden border border-slate-100">
            <button onClick={() => setIsFamilyModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"><X size={22} /></button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{editingMember ? "Editar miembro" : "Agregar miembro"}</h3>
            <p className="text-slate-500 text-sm font-bold mb-8 tracking-normal">Introduce los datos para agendar servicios en su nombre.</p>
            
            <form onSubmit={handleAddFamily} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide ml-1">Nombre completo</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff5a5f] transition-colors">
                      <UserIcon size={18} />
                    </div>
                    <input 
                      name="name" 
                      type="text" 
                      defaultValue={editingMember?.name} 
                      required 
                      placeholder="Ej. Juan Pérez" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-bold text-slate-800 text-sm focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all placeholder:text-slate-400" 
                    />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide ml-1">Edad</label>
                       <input 
                        name="age" 
                        type="number" 
                        defaultValue={editingMember?.age} 
                        required 
                        placeholder="Años" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-800 text-sm focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                       />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide ml-1">Género</label>
                    <div className="relative group">
                      <select 
                        name="gender" 
                        defaultValue={editingMember?.gender || "Masculino"} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-800 text-sm focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                         <option>Masculino</option>
                         <option>Femenino</option>
                         <option>Otro</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-focus-within:text-[#ff5a5f] transition-colors">
                         <ChevronRight size={18} className="rotate-90" />
                      </div>
                    </div>
                 </div>
               </div>
               <button type="submit" className="w-full bg-[#ff5a5f] text-white font-black py-3.5 rounded-xl shadow-lg shadow-[#ff5a5f]/25 hover:bg-[#e0484d] active:scale-[0.99] transition-all text-xs uppercase tracking-[0.15em]">
                  {editingMember ? "Guardar cambios" : "Agregar a la familia"}
               </button>
            </form>
          </div>
        </div>
      )}
       {/* RESERVATION DETAIL MODAL */}
       {isResModalOpen && selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsResModalOpen(false)}></div>
          <div className="bg-white w-full max-w-[550px] max-h-[min(92dvh,760px)] flex flex-col rounded-[32px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-500 overflow-hidden border border-slate-100">
            {/* Header Image */}
            <div className="h-40 sm:h-44 relative shrink-0">
                <img 
                  src={`https://images.unsplash.com/photo-${selectedRes.img}?q=80&w=800&fit=crop`} 
                  className="w-full h-full object-cover" 
                  alt="Venue"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <button 
                  onClick={() => setIsResModalOpen(false)} 
                  className="absolute top-6 right-6 p-3 bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-slate-900 rounded-2xl transition"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-6 left-8">
                   <span className="bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                     {selectedRes.status}
                   </span>
                   <h3 className="text-3xl font-black text-white mt-2 drop-shadow-lg">{selectedRes.venueName}</h3>
                </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
               <div className="grid grid-cols-2 gap-8 mb-10 border-b border-slate-100 pb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#ff5a5f]">
                        <Calendar size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                        <p className="text-sm font-black text-slate-800">{selectedRes.date}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#ff5a5f]">
                        <Clock size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hora</p>
                        <p className="text-sm font-black text-slate-800">{selectedRes.time}</p>
                     </div>
                  </div>
               </div>

               {selectedRes.address && (
                  <div className="flex items-start gap-4 mb-10 border-b border-slate-100 pb-10">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#ff5a5f] shrink-0">
                        <MapPin size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                        <p className="text-sm font-bold text-slate-800 leading-tight mb-2">{selectedRes.address}</p>
                        <button className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest hover:underline flex items-center gap-1">
                           Ver en el mapa <ChevronRight size={12} />
                        </button>
                     </div>
                  </div>
               )}

               <div className="space-y-6 mb-10">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Servicios Contratados</h4>
                  <div className="bg-slate-50 p-6 rounded-[32px] space-y-4 border border-slate-100">
                     {selectedRes.items ? selectedRes.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center">
                          <div>
                             <p className="font-black text-slate-800">{item.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicio Profesional</p>
                          </div>
                          <span className="font-black text-slate-800">{item.price}</span>
                       </div>
                     )) : (
                       <div className="flex justify-between items-center">
                          <div>
                             <p className="font-black text-slate-800">{selectedRes.serviceName}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicio Profesional</p>
                          </div>
                          <span className="font-black text-slate-800">{selectedRes.price}</span>
                       </div>
                     )}
                     <div className="h-[1px] bg-slate-200"></div>
                     <div className="flex justify-between items-center bg-white/50 p-3 rounded-2xl">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</span>
                        <span className="text-2xl font-black text-[#ff5a5f]">{selectedRes.price}</span>
                     </div>
                  </div>
               </div>

               {/* Mock QR Code Section */}
               <div className="flex flex-col items-center justify-center pt-6 space-y-4">
                  <div className="w-32 h-32 bg-slate-50 p-4 border border-slate-100 rounded-[28px] flex items-center justify-center relative group cursor-pointer hover:shadow-xl transition-all duration-500">
                     <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedRes.id}`} 
                        alt="QR Code" 
                        className="w-full h-full opacity-80 group-hover:opacity-100 transition"
                      />
                      <div className="absolute -top-3 bg-slate-900 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white shadow-lg">
                         TICKET ID: {selectedRes.id}
                      </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] text-center leading-relaxed">
                     Muestra este código en el local para confirmar tu llegada
                  </p>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mt-10">
                  <button className="flex-1 bg-slate-900 text-white font-black py-4 rounded-[24px] text-[10px] uppercase tracking-widest hover:bg-[#ff5a5f] transition-all transform hover:-translate-y-1 shadow-xl">
                     Editar Reserva
                  </button>
                  <button className="flex-1 bg-slate-50 text-slate-400 font-black py-4 rounded-[24px] text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all">
                     Cancelar Cita
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white text-sm font-bold px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 text-center">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#ff5a5f] border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
