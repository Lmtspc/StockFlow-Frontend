'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Calendar, DollarSign, Package } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { AsOfValuationReportItem } from '@/lib/types';

export default function AsOfValuationReportPage() {
  const [asOfDate, setAsOfDate] = useState('2026-08-01T00:00:00Z');

  const { data: items, isLoading } = useQuery<AsOfValuationReportItem[]>({
    queryKey: ['as-of-valuation', asOfDate],
    queryFn: () => apiFetch(`/reports/as-of-valuation?as_of=${encodeURIComponent(asOfDate)}`),
  });

  const totalValuation = (items || []).reduce(
    (sum, item) => sum + Number(item.total_value || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header & Date Cutoff Picker */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Point-in-Time FIFO Inventory Cost Valuation</span>
          </h2>
          <p className="text-xs text-slate-400">
            Reconstruct historical inventory balances and FIFO cost valuations up to a target cutoff timestamp.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-slate-400 font-medium">Cutoff Date:</span>
            <input
              type="text"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              placeholder="2026-08-01T00:00:00Z"
              className="bg-transparent font-mono text-slate-100 font-semibold focus:outline-none w-44"
            />
          </div>

          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shrink-0">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Historical Value: ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">SKU Number</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">On-Hand (As Of Cutoff)</th>
                <th className="p-4 text-right">FIFO Total Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Reconstructing point-in-time valuation ledger...
                  </td>
                </tr>
              ) : items && items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-100">{item.sku}</td>
                    <td className="p-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{item.product_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">{item.on_hand_as_of} EA</td>
                    <td className="p-4 font-extrabold text-right text-slate-100">
                      ${Number(item.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No historical stock records found for cutoff timestamp.
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
