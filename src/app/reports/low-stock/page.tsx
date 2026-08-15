'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LowStockReportItem } from '@/lib/types';

export default function LowStockReportPage() {
  const { data: items, isLoading } = useQuery<LowStockReportItem[]>({
    queryKey: ['low-stock'],
    queryFn: () => apiFetch('/reports/low-stock'),
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Low Stock Replenishment Reorder Report</span>
          </h2>
          <p className="text-xs text-slate-400">
            Calculates net inventory position against defined reorder safety stock thresholds and open PO pipelines.
          </p>
        </div>

        <Link
          href="/purchase-orders"
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </Link>
      </div>

      {/* Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">SKU / Product Name</th>
                <th className="p-4">Current Available</th>
                <th className="p-4">Open PO Qty</th>
                <th className="p-4">Reorder Point</th>
                <th className="p-4">Reorder Batch Qty</th>
                <th className="p-4">Suggested PO Qty</th>
                <th className="p-4 text-right">Replenish Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Running low stock replenishment engine...
                  </td>
                </tr>
              ) : items && items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{item.product_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono pl-6">{item.sku}</div>
                    </td>
                    <td className="p-4 font-bold text-rose-400">{item.available} EA</td>
                    <td className="p-4 font-semibold text-indigo-300">
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                        <span>+{item.open_po_qty} EA</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-amber-400">{item.reorder_point} EA</td>
                    <td className="p-4 text-slate-300">{item.reorder_qty} EA</td>
                    <td className="p-4 font-extrabold text-emerald-400">{item.suggested_po_qty} EA</td>
                    <td className="p-4 text-right">
                      <Link
                        href="/purchase-orders"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Procure Stock</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No items currently below safety stock reorder thresholds.
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
