'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Search, Warehouse as WarehouseIcon, MapPin, Calendar } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StockOnHandReportItem, Warehouse } from '@/lib/types';

export default function StockOnHandReportPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => apiFetch('/warehouses'),
  });

  const { data: reportItems, isLoading } = useQuery<StockOnHandReportItem[]>({
    queryKey: ['stock-on-hand', selectedWarehouse],
    queryFn: () =>
      apiFetch(
        `/reports/stock-on-hand${selectedWarehouse ? `?warehouse_id=${selectedWarehouse}` : ''}`
      ),
  });

  const filteredItems = (reportItems || []).filter(
    (item) =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValueSum = filteredItems.reduce(
    (sum, item) => sum + Number(item.total_value || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, SKU, or batch..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
            <WarehouseIcon className="w-4 h-4 text-indigo-400 shrink-0" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">
                All Facilities
              </option>
              {(warehouses || []).map((w) => (
                <option key={w.id} value={w.id} className="bg-slate-900">
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Valuation Badge */}
        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shrink-0">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Calculated FIFO Stock Value: ${totalValueSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Report Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">SKU / Product Name</th>
                <th className="p-4">Location & Batch</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">On Hand</th>
                <th className="p-4">Reserved</th>
                <th className="p-4">Available</th>
                <th className="p-4">Unit Cost</th>
                <th className="p-4 text-right">Total Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Generating Stock On Hand balance report...
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{item.product_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location_code}</span>
                      </div>
                      <div className="text-[11px] text-purple-300 font-mono">
                        Batch: {item.batch_no}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.expiry_date || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-200">{item.on_hand} EA</td>
                    <td className="p-4 font-semibold text-amber-400">{item.reserved} EA</td>
                    <td className="p-4 font-extrabold text-emerald-400">{item.available} EA</td>
                    <td className="p-4 font-mono text-slate-400">${item.unit_cost}</td>
                    <td className="p-4 font-extrabold text-right text-slate-100">
                      ${Number(item.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No stock balance records found.
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
