import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../web/src/app/globals.css"; // Reuse globals from web

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rezervame Admin",
  description: "Admin panel for Rezervame",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex bg-slate-100 min-h-screen">
          <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0">
             <div className="p-6 font-bold text-white text-xl">Rezervame Admin</div>
             <nav className="mt-6 flex flex-col space-y-2">
                 <a href="/" className="bg-slate-800 text-white px-6 py-3 border-l-4 border-blue-500">Dashboard</a>
                 <a href="#" className="hover:bg-slate-800 hover:text-white px-6 py-3 border-l-4 border-transparent">Businesses</a>
                 <a href="#" className="hover:bg-slate-800 hover:text-white px-6 py-3 border-l-4 border-transparent">Users</a>
                 <a href="#" className="hover:bg-slate-800 hover:text-white px-6 py-3 border-l-4 border-transparent">Subscriptions</a>
                 <a href="#" className="hover:bg-slate-800 hover:text-white px-6 py-3 border-l-4 border-transparent">Payments</a>
             </nav>
          </aside>
          <main className="flex-1 overflow-auto">
            <header className="bg-white shadow px-8 py-4 flex justify-between">
               <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
               <div className="flex items-center space-x-4">
                 <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold">A</div>
                 <span className="font-medium text-slate-700">Admin</span>
               </div>
            </header>
            <div className="p-8">
               {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
