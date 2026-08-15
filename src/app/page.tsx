'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeftRight,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  Boxes,
  Plus,
  BarChart2,
  Package,
  Clock,
  CheckCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  LowStockReportItem,
  StockTransfer,
  PurchaseOrder,
  StockOnHandReportItem,
} from '@/lib/types';
import StatusBadge from '@/components/common/StatusBadge';

export default function DashboardPage() {
  const { data: lowStock } = useQuery<LowStockReportItem[]>({
    queryKey: ['low-stock'],
    queryFn: () => apiFetch('/reports/low-stock'),
  });

  const { data: transfers } = useQuery<StockTransfer[]>({
    queryKey: ['transfers'],
    queryFn: () => apiFetch('/transfers'),
  });

  const { data: pos } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => apiFetch('/purchase-orders'),
  });

  const { data: stockOnHand } = useQuery<StockOnHandReportItem[]>({
    queryKey: ['stock-on-hand'],
    queryFn: () => apiFetch('/reports/stock-on-hand'),
  });

  const lowStockCount = lowStock?.length || 0;
  const pendingTransfersCount = transfers?.filter((t) => t.status === 'SHIPPED').length || 0;
  const pendingApprovalsCount = pos?.filter((p) => p.status === 'DRAFT').length || 0;

  const totalValuation =
    stockOnHand?.reduce((sum, item) => sum + Number(item.total_value || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-emerald-950/30 border border-slate-800">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Boxes className="w-3.5 h-3.5" />
            <span>StockFlow ERP Central</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Inventory & Supply Control Overview
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Monitor real-time FIFO stock balances, manage purchase requisitions, track multi-location transfers, and execute stock fulfillments with automated idempotency safeguards.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/purchase-orders"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </Link>
            <Link
              href="/reports/stock-on-hand"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>View On-Hand Valuation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Low Stock Items</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-100">{lowStockCount}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400">
              <Link href="/reports/low-stock" className="hover:underline flex items-center gap-1">
                <span>Action required</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Transfers</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-100">{pendingTransfersCount}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-400">
              <Link href="/transfers" className="hover:underline flex items-center gap-1">
                <span>In-transit shipments</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending PO Approvals</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-100">{pendingApprovalsCount}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-400">
              <Link href="/purchase-orders" className="hover:underline flex items-center gap-1">
                <span>Awaiting sign-off</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Stock Value</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-100">
              ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
              <Link href="/reports/stock-on-hand" className="hover:underline flex items-center gap-1">
                <span>FIFO Inventory Valuation</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Low Stock & Reorder Watchlist */}
        <div className="lg:col-span-2 glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">Low Stock Replenishment Alert</h3>
            </div>
            <Link
              href="/reports/low-stock"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Product Name / SKU</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Reorder Pt</th>
                  <th className="p-3">Suggested PO</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {lowStock && lowStock.length > 0 ? (
                  lowStock.slice(0, 4).map((item) => (
                    <tr key={item.product_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-slate-200">
                        <div>{item.product_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.sku}</div>
                      </td>
                      <td className="p-3 font-bold text-rose-400">{item.available} EA</td>
                      <td className="p-3 text-slate-400">{item.reorder_point} EA</td>
                      <td className="p-3 font-semibold text-emerald-400">{item.suggested_po_qty} EA</td>
                      <td className="p-3 text-right">
                        <Link
                          href="/purchase-orders"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Raise PO</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      All products above safety stock thresholds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Workflow Launchpad */}
        <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Quick Workflow Launchpad</span>
          </h3>

          <div className="space-y-3">
            <Link
              href="/goods-receipts"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    Post Goods Receipt
                  </div>
                  <div className="text-[11px] text-slate-400">Receive inbound shipment lines</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </Link>

            <Link
              href="/sales-orders"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    Fulfill Sales Order
                  </div>
                  <div className="text-[11px] text-slate-400">Reserve & dispatch customer stock</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </Link>

            <Link
              href="/transfers"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    Stock Transfer Workflow
                  </div>
                  <div className="text-[11px] text-slate-400">Move items across warehouses</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </Link>

            <Link
              href="/adjustments"
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    Inventory Adjustment
                  </div>
                  <div className="text-[11px] text-slate-400">Log stock cycle counts & write-offs</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
