'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, SlidersHorizontal, CheckCircle, FileText, MapPin, Layers } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StockAdjustment, Product, Warehouse } from '@/lib/types';
import Modal from '@/components/common/Modal';
import StatusBadge from '@/components/common/StatusBadge';

export default function StockAdjustmentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [number, setNumber] = useState(`ADJ-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [warehouseId, setWarehouseId] = useState('11111111-2222-3333-4444-555555555555');
  const [locationId, setLocationId] = useState('loc-main-sellable');
  const [productId, setProductId] = useState('7f920c5d-31ab-4f81-9b16-411a098745b1');
  const [batchNo, setBatchNo] = useState('BATCH-2026A');
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'WRITE_OFF'>('OUT');
  const [quantity, setQuantity] = useState(5);
  const [unitCost, setUnitCost] = useState(15.50);
  const [reason, setReason] = useState('Water damage during warehouse inspection');

  const { data: adjustments, isLoading } = useQuery<StockAdjustment[]>({
    queryKey: ['adjustments'],
    queryFn: () => apiFetch('/adjustments'),
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
    mutationFn: (newAdj: Partial<StockAdjustment>) =>
      apiFetch<StockAdjustment>('/adjustments', {
        method: 'POST',
        body: JSON.stringify(newAdj),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stock-on-hand'] });
      setIsModalOpen(false);
      setNumber(`ADJ-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (adjId: string) =>
      apiFetch(`/adjustments/${adjId}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stock-on-hand'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      number,
      warehouse_id: warehouseId,
      location_id: locationId,
      product_id: productId,
      batch_no: batchNo,
      adjustment_type: adjustmentType,
      quantity: Number(quantity),
      unit_cost: Number(unitCost),
      reason,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <span>Inventory Count Adjustments & Write-offs</span>
          </h2>
          <p className="text-xs text-slate-400">
            Log manual inventory adjustments (IN, OUT, WRITE_OFF). Adjustments exceeding threshold require manager approval.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">ADJ Number</th>
                <th className="p-4">Location & Batch</th>
                <th className="p-4">Product & Quantity</th>
                <th className="p-4">Reason / Notes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading stock adjustments...
                  </td>
                </tr>
              ) : adjustments && adjustments.length > 0 ? (
                adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                      <span>{adj.number}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-200 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{adj.location_code || 'MAIN-SELLABLE'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span>Batch: {adj.batch_no}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{adj.product_name || 'Industrial Widget A'}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={adj.adjustment_type} />
                        <span className="font-bold text-slate-100">{adj.quantity} EA</span>
                        <span className="text-slate-500 text-[11px]">(@ ${adj.unit_cost})</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1 text-[11px] italic">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{adj.reason}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={adj.status} />
                    </td>
                    <td className="p-4 text-right">
                      {adj.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => approveMutation.mutate(adj.id)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No adjustments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Adjustment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Stock Adjustment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Adjustment Ref *</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Adjustment Type *</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as 'IN' | 'OUT' | 'WRITE_OFF')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="OUT">OUT (Decrease Stock)</option>
                <option value="IN">IN (Increase Stock)</option>
                <option value="WRITE_OFF">WRITE_OFF (Damaged / Lost)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Location ID *</label>
              <input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Product *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {(products || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Batch Number *</label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Adjust Qty</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Unit Cost ($)</label>
            <input
              type="number"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Reason / Notes *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
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
              {createMutation.isPending ? 'Submitting...' : 'Submit Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
