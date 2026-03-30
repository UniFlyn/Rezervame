import React from "react";

export default function BusinessDetails({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-5xl mx-auto bg-white min-h-screen border-x border-slate-200">
      <div className="h-72 bg-slate-200 relative">
        <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80" alt="Business Header" className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
          <h1 className="text-4xl font-bold">Elite Barbershop {params.id}</h1>
          <p className="mt-2 text-lg text-slate-200">123 Main St, Panama City • ★ 4.8 (124 reviews)</p>
        </div>
      </div>
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">About us</h2>
            <p className="text-slate-600 leading-relaxed">
              Premium grooming experiences for the modern gentleman. We specialize in classic cuts, modern styling, and precision beard grooming.
            </p>
          </section>
          
          <section>
             <h2 className="text-2xl font-bold mb-4">Services</h2>
             <div className="space-y-4">
               {[
                 { name: "Classic Haircut", duration: "30 min", price: "$25.00" },
                 { name: "Beard Trim", duration: "15 min", price: "$15.00" },
                 { name: "Haircut & Beard Combo", duration: "45 min", price: "$35.00" }
               ].map((svc, i) => (
                 <div key={i} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-primary transition-colors">
                   <div>
                     <h4 className="font-bold text-lg">{svc.name}</h4>
                     <p className="text-sm text-slate-500">{svc.duration}</p>
                   </div>
                   <div className="flex items-center space-x-4">
                     <span className="font-semibold text-lg">{svc.price}</span>
                     <button className="px-4 py-2 bg-slate-100 text-primary font-semibold rounded hover:bg-primary-light transition-colors">Select</button>
                   </div>
                 </div>
               ))}
             </div>
          </section>
        </div>
        
        <div className="border border-slate-200 rounded-xl p-6 h-fit sticky top-6 shadow-sm">
           <h3 className="text-xl font-bold mb-6">Ready to book?</h3>
           <p className="text-sm text-slate-600 mb-6">Select services from the list to start your booking process.</p>
           <a href={`/business/${params.id}/book`} className="block w-full text-center py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors shadow">
             Book Appointment
           </a>
        </div>
      </div>
    </div>
  );
}
