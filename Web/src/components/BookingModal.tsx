"use client";
import React, { useState, useEffect } from "react";
import { 
  X, ChevronLeft, ChevronRight, Star, Clock, 
  MapPin, Check, Info, AlertCircle, CreditCard,
  Calendar as CalendarIcon, User, Plus
} from "lucide-react";

interface Service {
  id: number;
  name: string;
  price: number;
  time: string;
  description: string;
}

interface Professional {
  id: number;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  img: string;
  services: number[]; // IDs of services they perform
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServiceIds: number[];
  venueData: any;
}

type Step = "SCHEDULE" | "SUMMARY" | "STAFF_LIST" | "PROFESSIONAL_DETAIL" | "PAYMENT_WARNING" | "CHECKOUT";

export const BookingModal = ({ isOpen, onClose, selectedServiceIds, venueData }: BookingModalProps) => {
  const [step, setStep] = useState<Step>("SCHEDULE");
  const [selectedDate, setSelectedDate] = useState<number>(4); // Default to Nov 4
  const [selectedTime, setSelectedTime] = useState<string>("10:30 AM");
  const [timePeriod, setTimePeriod] = useState<"Mañana" | "Tarde" | "Noche">("Mañana");
  const [selectedProfForDetail, setSelectedProfForDetail] = useState<Professional | null>(null);
  const [activeServiceIdForChange, setActiveServiceIdForChange] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, number>>({}); 
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize assignments with default professionals
  useEffect(() => {
    if (isOpen) {
        const initial: Record<number, number> = {};
        selectedServiceIds.forEach(sid => {
            // Find a pro who can do this service
            const pro = venueData.team.find((p: any) => p.id === 1); // Mock: Default to Mateo
            initial[sid] = pro?.id || 1;
        });
        setAssignments(initial);
        setStep("SCHEDULE");
    }
  }, [isOpen, selectedServiceIds, venueData.team]);

  if (!isOpen) return null;

  const selectedServices = venueData.services.filter((s: any) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((acc: number, s: any) => acc + s.price, 0);

  const handleCloseAttempt = () => {
    if (step !== "SCHEDULE") {
        setIsDiscardModalOpen(true);
    } else {
        onClose();
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment process
    setTimeout(() => {
      setIsProcessing(false);
      window.location.href = "/reservations/confirmation";
    }, 2000);
  };

  const renderSchedule = () => (
    <div className="flex flex-col items-center">
        <h2 className="text-xl font-black text-slate-900 mb-8">November 2025</h2>
        
        {/* Calendar Strip */}
        <div className="flex items-center gap-4 mb-10 w-full justify-center">
            <button className="p-2 text-slate-400 hover:text-slate-900"><ChevronLeft size={20} /></button>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {[2, 3, 4, 5, 6, 7, 8].map(day => (
                    <button 
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`flex flex-col items-center justify-center min-w-[55px] h-[75px] rounded-2xl border-2 transition-all ${selectedDate === day ? 'bg-[#ff5a5f] border-[#ff5a5f] text-white shadow-lg shadow-[#ff5a5f]/30' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][(day-2)%7]}</span>
                        <span className="text-xl font-black mt-1">{day}</span>
                    </button>
                ))}
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-900"><ChevronRight size={20} /></button>
        </div>

        {/* Time Periods */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 mb-8">
            {["Mañana", "Tarde", "Noche"].map((p: any) => (
                <button 
                    key={p}
                    onClick={() => setTimePeriod(p)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timePeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    {p}
                </button>
            ))}
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-3 gap-3 mb-10 w-full max-w-[400px]">
            {["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"].map(time => (
                <button 
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-full border-2 text-[10px] font-black transition-all ${selectedTime === time ? 'border-[#ff5a5f] text-[#ff5a5f] bg-[#ff5a5f]/5' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                    {time}
                </button>
            ))}
        </div>

        <button 
            onClick={() => setStep("SUMMARY")}
            className="w-full bg-[#ff5a5f] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition-all"
        >
            CONTINUAR
        </button>
    </div>
  );

  const renderSummary = () => (
      <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 mb-8 text-center">Resumen de reserva</h2>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedServices.map((service: any) => {
                  const proId = assignments[service.id];
                  const pro = venueData.team.find((p: any) => p.id === proId) || venueData.team[0];
                  
                  return (
                      <div key={service.id} className="bg-slate-50/50 p-6 rounded-[32px] border-2 border-slate-100 relative group">
                          <button className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm">
                              <X size={14} />
                          </button>
                          
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h4 className="font-black text-slate-900 text-sm tracking-tight">{service.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">10:30 AM - 11:30 AM</p>
                              </div>
                              <span className="text-lg font-black text-slate-900">${service.price}.00</span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                              <div 
                                className="flex items-center gap-3 cursor-pointer group/pro"
                                onClick={() => {
                                    setSelectedProfForDetail(pro);
                                    setStep("PROFESSIONAL_DETAIL");
                                }}
                              >
                                  <img src={pro.img} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                  <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profesional:</p>
                                      <div className="flex items-center gap-2">
                                          <p className="font-black text-slate-900 text-[11px] group-hover/pro:text-[#ff5a5f] transition-colors">{pro.name}</p>
                                          <span className="text-[9px] font-black text-green-500 uppercase">Disponible</span>
                                      </div>
                                  </div>
                              </div>
                              <button 
                                onClick={() => {
                                    setActiveServiceIdForChange(service.id);
                                    setStep("STAFF_LIST");
                                }}
                                className="px-5 py-2 rounded-xl border-2 border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-[#ff5a5f] hover:text-[#ff5a5f] transition-all bg-slate-50"
                              >
                                  CAMBIAR
                              </button>
                          </div>
                      </div>
                  );
              })}
          </div>

          <div className="flex items-center gap-3 py-6 text-slate-900 font-black text-xs uppercase tracking-widest border-t border-dashed border-slate-200 cursor-pointer hover:text-[#ff5a5f] transition-colors">
              <Plus size={16} /> Agregar otro servicio
          </div>

          <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-end mb-8">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Total: <span className="text-slate-900 font-black ml-1 text-sm">${totalPrice}.00</span>
                      <p className="mt-1">1 hora 40 min</p>
                  </div>
                  <button 
                    onClick={() => setStep("PAYMENT_WARNING")}
                    className="bg-[#ff5a5f] text-white px-10 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20 hover:scale-105 active:scale-95 transition-all"
                  >
                      CONTINUAR
                  </button>
              </div>
          </div>
      </div>
  );

  const renderProfessionalDetail = () => {
    if (!selectedProfForDetail) return null;
    return (
        <div className="animate-in slide-in-from-right-8 duration-500">
            <button 
                onClick={() => setStep("SUMMARY")}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-8"
            >
                <ChevronLeft size={16} /> Volver al resumen
            </button>

            <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                    <img src={selectedProfForDetail.img} className="w-32 h-32 rounded-[40px] object-cover border-4 border-white shadow-2xl" />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                        <Check size={16} strokeWidth={4} />
                    </div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-1">{selectedProfForDetail.name}</h3>
                <p className="text-[#ff5a5f] text-[10px] font-black uppercase tracking-[0.2em] mb-6">{selectedProfForDetail.role}</p>

                <div className="flex gap-8 mb-10 pb-8 border-b border-slate-100 w-full justify-center">
                    <div>
                        <p className="text-lg font-black text-slate-900">4.9</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
                    </div>
                    <div className="border-x border-slate-100 px-8">
                        <p className="text-lg font-black text-slate-900">250+</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clientes</p>
                    </div>
                    <div>
                        <p className="text-lg font-black text-slate-900">8+</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Años Exp.</p>
                    </div>
                </div>

                <div className="w-full text-left">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Servicios que realiza:</h4>
                    <div className="space-y-3">
                        {venueData.services.map((s: any) => (
                            <div key={s.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-[#ff5a5f]/20 transition-all cursor-default">
                                <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                                <Check size={16} className="text-[#ff5a5f]" />
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => setStep("SUMMARY")}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-2xl mt-12 hover:bg-slate-800 transition-all"
                >
                    SELECCIONAR PROFESIONAL
                </button>
            </div>
        </div>
    );
  };

  const renderStaffList = () => (
      <div className="animate-in slide-in-from-right-8 duration-500">
          <button 
                onClick={() => setStep("SUMMARY")}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-8"
            >
                <ChevronLeft size={16} /> Volver al resumen
          </button>
          
          <h2 className="text-xl font-black text-slate-900 mb-8">Selecciona un profesional</h2>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {venueData.team.map((pro: any) => (
                  <div 
                    key={pro.id}
                    onClick={() => {
                        if (activeServiceIdForChange) {
                            setAssignments(prev => ({ ...prev, [activeServiceIdForChange]: pro.id }));
                            setStep("SUMMARY");
                        }
                    }}
                    className={`flex items-center justify-between p-4 rounded-[32px] border-2 transition-all cursor-pointer group ${assignments[activeServiceIdForChange!] === pro.id ? 'border-[#ff5a5f] bg-[#ff5a5f]/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                  >
                      <div className="flex items-center gap-4">
                          <div className="relative">
                              <img src={pro.img} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                              <div className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                              <p className="font-black text-slate-900 text-sm group-hover:text-[#ff5a5f] transition-colors">{pro.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pro.role}</p>
                              <div className="flex items-center gap-1 mt-1">
                                  <Star size={10} className="fill-amber-400 text-amber-400" />
                                  <span className="text-[10px] font-black text-slate-700">{pro.rating}</span>
                              </div>
                          </div>
                      </div>
                      <div 
                        className="p-3 text-slate-300 group-hover:text-[#ff5a5f] transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProfForDetail(pro);
                            setStep("PROFESSIONAL_DETAIL");
                        }}
                      >
                          <Info size={20} />
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderPaymentWarning = () => (
      <div className="flex flex-col items-center text-center p-4">
          <div className="w-20 h-20 bg-[#ff5a5f]/5 rounded-[32px] flex items-center justify-center text-[#ff5a5f] mb-8">
              <Info size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Importante!</h2>
          <p className="text-slate-500 font-bold mb-10 leading-relaxed max-w-[320px]">
              Para asegurar tu cita, se requiere un pago por adelantado. 
              Se aplicará una retención temporal de <span className="text-slate-900 font-extrabold">${totalPrice}.00 USD</span> al confirmar la reserva.
          </p>
          
          <div className="space-y-4 w-full">
            <button 
                onClick={() => setStep("CHECKOUT")}
                className="w-full bg-[#ff5a5f] text-white font-black py-5 rounded-2xl text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition-all"
            >
                CONTINUAR Y PAGAR AHORA
            </button>
            <button 
                onClick={() => setStep("SUMMARY")}
                className="w-full bg-white text-slate-400 font-extrabold py-4 rounded-2xl text-[11px] uppercase tracking-[0.1em] hover:text-slate-600 transition-all"
            >
                CANCELAR
            </button>
          </div>
      </div>
  );

  const renderCheckout = () => (
      <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Pago seguro</h2>
              
              <div className="space-y-8">
                  <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-900">
                      <CreditCard className="text-[#ff5a5f]" />
                      Tarjeta de crédito/débito
                  </div>

                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de tarjeta</label>
                          <input type="text" placeholder="1234 5678 9012 3456" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:border-[#ff5a5f]" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimiento</label>
                              <input type="text" placeholder="MM/YY" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:border-[#ff5a5f]" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                              <input type="text" placeholder="123" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:border-[#ff5a5f]" />
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`w-full bg-[#ff5a5f] text-white font-black py-5 rounded-2xl text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition-all mt-8 flex items-center justify-center gap-3 ${isProcessing ? 'opacity-80 cursor-wait' : ''}`}
                  >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          PROCESANDO...
                        </>
                      ) : `PAGAR $${totalPrice}.00`}
                  </button>
              </div>
          </div>
          
          <div className="w-full md:w-[300px] bg-slate-50 rounded-[40px] p-8 h-fit border-2 border-slate-100 shadow-inner">
                <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest mb-6">Tu reserva</p>
                <div className="space-y-4 mb-8">
                    {selectedServices.map((s: any) => (
                        <div key={s.id} className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{s.name}</span>
                            <span className="text-xs font-black text-slate-900">${s.price}</span>
                        </div>
                    ))}
                </div>
                <div className="pt-6 border-t border-dashed border-slate-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</span>
                        <span className="text-xl font-black text-[#ff5a5f]">${totalPrice}.00</span>
                    </div>
                </div>
          </div>
      </div>
  );

  return (
    <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-[50px] w-full max-w-[650px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 p-12">
                {/* Close Button */}
                <button 
                    onClick={handleCloseAttempt}
                    className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition p-2 bg-slate-50 rounded-2xl"
                >
                    <X size={24} strokeWidth={2.5} />
                </button>

                {step === "SCHEDULE" && renderSchedule()}
                {step === "SUMMARY" && renderSummary()}
                {step === "STAFF_LIST" && renderStaffList()}
                {step === "PROFESSIONAL_DETAIL" && renderProfessionalDetail()}
                {step === "PAYMENT_WARNING" && renderPaymentWarning()}
                {step === "CHECKOUT" && renderCheckout()}
            </div>
        </div>

        {/* DISCARD CONFIRMATION MODAL */}
        {isDiscardModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[40px] p-10 max-w-[450px] w-full text-center shadow-3xl animate-in zoom-in-95 duration-300">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-900 mb-4">¿Deseas descartar la reserva?</h3>
                        <p className="text-slate-400 font-bold leading-relaxed px-4">Si cancelas ahora, se perderán todos los cambios no guardados en tu seleccion.</p>
                    </div>
                    <div className="space-y-4">
                        <button 
                            onClick={() => setIsDiscardModalOpen(false)}
                            className="w-full bg-[#ff5a5f] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20"
                        >
                            CONTINUAR CON LA RESERVA
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.1em] border-2 border-slate-100 hover:bg-slate-50 transition-all"
                        >
                            SÍ, DESCARTAR LA RESERVA
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
