import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const data = [
    { name: 'Mon', bookings: 40 },
    { name: 'Tue', bookings: 30 },
    { name: 'Wed', bookings: 20 },
    { name: 'Thu', bookings: 27 },
    { name: 'Fri', bookings: 18 },
    { name: 'Sat', bookings: 23 },
    { name: 'Sun', bookings: 34 },
  ];

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-4 gap-6">
         {[
           { title: "Total Users", val: "1,240", change: "+12%" },
           { title: "Total Businesses", val: "84", change: "+5%" },
           { title: "Total Bookings", val: "12,430", change: "+24%" },
           { title: "Revenue", val: "$45,200", change: "+18%" }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="text-slate-500 font-medium text-sm">{stat.title}</h3>
             <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-800">{stat.val}</span>
                <span className="text-green-500 font-medium text-sm">{stat.change}</span>
             </div>
           </div>
         ))}
       </div>

       <div className="grid grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold mb-4">Weekly Bookings (Mock)</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
         </div>
         
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold mb-4">Pending Approvals</h3>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg">
                  <div>
                    <h4 className="font-bold text-slate-800">New Business {i}</h4>
                    <p className="text-sm text-slate-500">Submitted 2h ago</p>
                  </div>
                  <div className="space-x-2">
                    <button className="px-3 py-1 bg-green-500 text-white font-medium rounded hover:bg-green-600 transition">Approve</button>
                    <button className="px-3 py-1 bg-red-500 text-white font-medium rounded hover:bg-red-600 transition">Deny</button>
                  </div>
                </div>
              ))}
            </div>
         </div>
       </div>
    </div>
  );
}
