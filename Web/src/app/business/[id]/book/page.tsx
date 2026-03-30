import React from "react";

export default function BookPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Confirm your appointment</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">1. Select professional</h2>
          <div className="flex space-x-4">
             {["Any Staff", "John", "Sarah"].map(staff => (
               <button key={staff} className="px-6 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary active:bg-slate-50">
                 {staff}
               </button>
             ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">2. Select date & time</h2>
          <div className="grid grid-cols-2 gap-4">
             <input type="date" className="p-3 border rounded-lg" defaultValue="2026-03-30" />
             <select className="p-3 border rounded-lg bg-white">
               <option>10:00 AM</option>
               <option>11:30 AM</option>
               <option>2:00 PM</option>
               <option>4:15 PM</option>
             </select>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">3. Payment Details (Mock)</h2>
          <div className="p-4 border rounded-lg border-slate-300 bg-slate-50 space-y-3">
             <div className="flex justify-between font-bold"><span>Total:</span> <span>$35.00</span></div>
             <input type="text" placeholder="Card number" className="w-full p-3 border rounded-lg" />
             <div className="flex space-x-2">
               <input type="text" placeholder="MM/YY" className="w-1/2 p-3 border rounded-lg" />
               <input type="text" placeholder="CVC" className="w-1/2 p-3 border rounded-lg" />
             </div>
          </div>
        </div>
        
        <button className="w-full py-4 bg-primary text-white font-bold rounded-lg text-lg shadow hover:bg-primary-dark">
          Confirm Booking
        </button>
      </div>
    </div>
  );
}
