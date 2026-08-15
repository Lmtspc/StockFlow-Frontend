'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  LayoutDashboard,
  Package,
  Warehouse as WarehouseIcon,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  ArrowLeftRight,
  SlidersHorizontal,
  BarChart3,
  AlertTriangle,
  History,
  LogOut,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, actor, logout } = useAuthStore();

  const navGroups = [
    {
      title: 'Overview',
      items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Catalog & Locations',
      items: [
        { href: '/products', label: 'Product Catalog', icon: Package },
        { href: '/warehouses', label: 'Warehouses & Locations', icon: WarehouseIcon },
      ],
    },
    {
      title: 'Purchasing & Supply',
      items: [
        { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
        { href: '/goods-receipts', label: 'Goods Receipts', icon: Receipt },
      ],
    },
    {
      title: 'Sales & Operations',
      items: [
        { href: '/sales-orders', label: 'Sales Orders', icon: ShoppingBag },
        { href: '/transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
        { href: '/adjustments', label: 'Stock Adjustments', icon: SlidersHorizontal },
      ],
    },
    {
      title: 'Intelligence & Reports',
      items: [
        { href: '/reports/stock-on-hand', label: 'Stock On Hand', icon: BarChart3 },
        { href: '/reports/low-stock', label: 'Low Stock Reorder', icon: AlertTriangle },
        { href: '/reports/as-of-valuation', label: 'As-Of Valuation', icon: History },
      ],
    },
    {
      title: 'Administration',
      items: [
        { href: '/users', label: 'User & Role Control', icon: Users },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-slate-950/80 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 backdrop-blur-xl z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Boxes className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-100 tracking-tight">StockFlow</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">ERP</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Inventory & Operations</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/20 to-emerald-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {user?.display_name || 'Admin User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@stockflow.io'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
