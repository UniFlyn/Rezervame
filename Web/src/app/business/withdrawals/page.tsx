'use client';

import { useState } from 'react';
import { useBusinessStore } from '../../../store/businessStore';
import { useTransactionsStore } from '../../../store/transactionsStore';
import { Wallet, ArrowRight } from 'lucide-react';

export default function WithdrawalsPage() {
  const business = useBusinessStore((state) => state.business);
  const deductBalance = useBusinessStore((state) => state.deductBalance);
  const addTransaction = useTransactionsStore((state) => state.addTransaction);
  
  const [amount, setAmount] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const transactions = useTransactionsStore((state) => state.transactions);
  const withdrawals = transactions.filter(t => t.type === 'Withdrawal');

  const handleWithdraw = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }
    if (val > (business?.balance || 0)) {
      setError('Insufficient balance.');
      return;
    }
    
    setError('');
    deductBalance(val);
    addTransaction({
      id: `tx-wd-${Date.now()}`,
      amount: val,
      status: 'Completed',
      date: new Date().toISOString(),
      type: 'Withdrawal'
    });
    setSuccess(true);
    setAmount('');
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Withdrawals</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your business earnings</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-primary-dark to-primary rounded-[32px] p-10 text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <p className="text-white/70 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Available Balance</p>
            <h3 className="text-6xl font-black tracking-tighter">${business?.balance?.toFixed(2) || '0.00'}</h3>
            <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Connected Account</p>
                  <p className="font-bold text-sm">Main Business Account · **** 1234</p>
               </div>
               <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 uppercase text-[10px] font-black tracking-widest">
                  Verified
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center">
            Withdraw Funds
          </h3>
          
          {success && <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-bold border border-green-100 animate-in fade-in zoom-in">Transfer initiated successfully!</div>}
          {error && <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Amount to Transfer</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white text-xl font-bold transition-all placeholder:text-slate-200"
                  placeholder="0.00"
                />
              </div>
            </div>
            <button 
              onClick={handleWithdraw}
              className="w-full py-5 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-slate-200 flex items-center justify-center space-x-3 group"
            >
              <span>Transfer to Bank</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mt-12">
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">Withdrawal History</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Review your recent fund transfers</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
               {withdrawals.length} TRANSACTIONS
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Transaction ID</th>
                <th className="px-10 py-6">Execution Date</th>
                <th className="px-10 py-6">Net Amount</th>
                <th className="px-10 py-6">Method</th>
                <th className="px-10 py-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-600">
              {withdrawals.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6 font-mono text-[11px] text-slate-300 group-hover:text-slate-900 transition-colors">
                    {tx.id.toUpperCase()}
                  </td>
                  <td className="px-10 py-6 text-slate-500 font-bold whitespace-nowrap">
                    <span className="text-slate-900">{new Date(tx.date).toLocaleDateString()}</span>
                    <span className="mx-2 opacity-20">|</span>
                    <span className="text-[10px] uppercase font-black opacity-50">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-900 text-lg">
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-black text-slate-900">Bank Transfer</span>
                       <span className="text-[10px] uppercase font-black text-slate-300">**** 1234</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="inline-flex items-center px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <Wallet className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No withdrawals recorded in your history</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
