'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingCart, CheckCircle, Trash2, Calendar, Building2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PurchaseOrder, Product, Warehouse, POLine } from '@/lib/types';
import Modal from '@/components/common/Modal';
import StatusBadge from '@/components/common/StatusBadge';

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [number, setNumber] = useState(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplierId, setSupplierId] = useState('88888888-8888-8888-8888-888888888888');
  const [warehouseId, setWarehouseId] = useState('11111111-2222-3333-4444-555555555555');
  const [lines, setLines] = useState<POLine[]>([
    { product_id: '7f920c5d-31ab-4f81-9b16-411a098745b1', ordered_qty: 100, unit_cost: 15.50 },
  ]);

  const { data: pos, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => apiFetch('/purchase-orders'),
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiFetch('/products'),
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => apiFetch('/warehouses'),
  });

  const createMutation = useMutation({
    mutationFn: (newPO: Partial<PurchaseOrder>) =>
      apiFetch<PurchaseOrder>('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(newPO),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setIsModalOpen(false);
      setNumber(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (poId: string) =>
      apiFetch(`/purchase-orders/${poId}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const addLine = () => {
    const firstProd = products?.[0]?.id || '7f920c5d-31ab-4f81-9b16-411a098745b1';
    setLines([...lines, { product_id: firstProd, ordered_qty: 50, unit_cost: 20.0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, key: keyof POLine, value: unknown) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [key]: value };
    setLines(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      number,
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      lines,
    });
  };

  const filteredPOs = (pos || []).filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          {['ALL', 'DRAFT', 'APPROVED', 'POSTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* PO Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier & Facility</th>
                <th className="p-4">Order Lines</th>
                <th className="p-4">Total Value</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredPOs.length > 0 ? (
                filteredPOs.map((po) => {
                  const poLines = po.lines || [];
                  const total = poLines.reduce(
                    (sum, l) => sum + (l.ordered_qty || 0) * (l.unit_cost || 0),
                    0
                  );
                  const displayDate = po.created_at || po.ordered_at ? new Date(po.created_at || po.ordered_at || '').toLocaleDateString() : 'N/A';

                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-indigo-400" />
                          <span>{po.number}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{displayDate}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{po.supplier_name || 'Global Tech Distribution'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Target: {po.warehouse_name || 'Central Distribution'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {poLines.map((line, idx) => (
                            <div key={idx} className="text-[11px] font-medium text-slate-300">
                              <span className="font-semibold text-indigo-300">
                                {line.ordered_qty}x
                              </span>{' '}
                              {line.product_name || 'Industrial Widget A'} @ ${line.unit_cost}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-slate-100">${total.toFixed(2)}</td>
                      <td className="p-4">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="p-4 text-right">
                        {po.status === 'DRAFT' && (
                          <button
                            onClick={() => approveMutation.mutate(po.id)}
                            disabled={approveMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve PO</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No purchase orders found for status &quot;{statusFilter}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Purchase Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">PO Number *</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Warehouse *</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {(warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Lines</label>
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-slate-950 border border-slate-800"
              >
                <div className="col-span-6 space-y-1">
                  <span className="text-[10px] text-slate-500">Product</span>
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                  >
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <span className="text-[10px] text-slate-500">Qty</span>
                  <input
                    type="number"
                    value={line.ordered_qty}
                    onChange={(e) => updateLine(idx, 'ordered_qty', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="col-span-3 space-y-1">
                  <span className="text-[10px] text-slate-500">Unit Cost ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.unit_cost}
                    onChange={(e) => updateLine(idx, 'unit_cost', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              {createMutation.isPending ? 'Creating...' : 'Save Draft PO'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
