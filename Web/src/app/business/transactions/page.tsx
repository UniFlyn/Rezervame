'use client';

import { useTransactionsStore } from '../../../store/transactionsStore';
import { ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';

export default function TransactionsPage() {
  const transactions = useTransactionsStore((state) => state.transactions);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Transactions</h2>
        <button className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center font-medium transition-colors text-sm shadow-sm">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(tx.date).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center space-x-1 ${tx.type === 'Earning' ? 'text-green-600' : 'text-orange-600'}`}>
                    {tx.type === 'Earning' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    <span className="font-medium">{tx.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {tx.status}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-medium ${tx.type === 'Earning' ? 'text-green-600' : 'text-gray-900'}`}>
                  {tx.type === 'Earning' ? '+' : '-'}${tx.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
