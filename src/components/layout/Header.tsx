'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Warehouse as WarehouseIcon, Activity, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

export default function Header() {
  const pathname = usePathname();
  const { activeWarehouseId, setActiveWarehouseId, actor } = useAuthStore();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Executive Dashboard';
      case '/products':
        return 'Product Catalog & Reorder Rules';
      case '/warehouses':
        return 'Warehouses & Stock Locations';
      case '/purchase-orders':
        return 'Purchase Orders & Approvals';
      case '/goods-receipts':
        return 'Goods Receipts & Inbound Logistics';
      case '/sales-orders':
        return 'Sales Orders & Fulfillment';
      case '/transfers':
        return 'Warehouse Stock Transfers';
      case '/adjustments':
        return 'Inventory Count Adjustments';
      case '/reports/stock-on-hand':
        return 'Stock On Hand Balance Report';
      case '/reports/low-stock':
        return 'Low Stock Replenishment Report';
      case '/reports/as-of-valuation':
        return 'As-Of FIFO Inventory Valuation Report';
      case '/users':
        return 'User Account & RBAC Role Control';
      default:
        return 'StockFlow ERP';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-slate-100">{getPageTitle(pathname)}</h1>
        <p className="text-xs text-slate-400 font-medium">Real-time Stock Control & Operations</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Backend Connectivity Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>API Connected</span>
        </div>

        {/* Warehouse Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <WarehouseIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-400 font-medium hidden md:inline">Warehouse:</span>
          <select
            value={activeWarehouseId || ''}
            onChange={(e) => setActiveWarehouseId(e.target.value || null)}
            className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="11111111-2222-3333-4444-555555555555" className="bg-slate-900 text-slate-100">
              Central Distribution (WH-MAIN)
            </option>
            <option value="22222222-3333-4444-5555-666666666666" className="bg-slate-900 text-slate-100">
              West Coast Logistics (WH-WEST)
            </option>
          </select>
        </div>

        {/* Super Admin Badge */}
        {actor && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Super Admin</span>
          </div>
        )}
      </div>
    </header>
  );
}
