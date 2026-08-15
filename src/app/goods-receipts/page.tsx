'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Key, Calendar, MapPin, Layers } from 'lucide-react';
import { apiFetch, generateIdempotencyKey } from '@/lib/api';
import { GoodsReceipt, PurchaseOrder, Warehouse, Product } from '@/lib/types';
import Modal from '@/components/common/Modal';

export default function GoodsReceiptsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [number, setNumber] = useState(`GR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [warehouseId, setWarehouseId] = useState('11111111-2222-3333-4444-555555555555');
  const [locationId, setLocationId] = useState('loc-main-sellable');
  const [batchNo, setBatchNo] = useState(`BATCH-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [receivedQty, setReceivedQty] = useState(100);
  const [unitCost, setUnitCost] = useState(15.50);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey('GR'));

  const { data: receipts, isLoading } = useQuery<GoodsReceipt[]>({
    queryKey: ['goods-receipts'],
    queryFn: () => apiFetch('/goods-receipts'),
  });

  const { data: pos } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => apiFetch('/purchase-orders'),
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => apiFetch('/warehouses'),
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiFetch('/products'),
  });

  const approvedPOs = (pos || []).filter((p) => p.status === 'APPROVED' || p.status === 'DRAFT');

  const postMutation = useMutation({
    mutationFn: (newGR: Partial<GoodsReceipt>) =>
      apiFetch<GoodsReceipt>('/goods-receipts', {
        method: 'POST',
        idempotencyKey,
        body: JSON.stringify(newGR),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-on-hand'] });
      setIsModalOpen(false);
      setNumber(`GR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setIdempotencyKey(generateIdempotencyKey('GR'));
    },
  });

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    const po = pos?.find((p) => p.id === selectedPoId) || pos?.[0];
    const poLine = po?.lines?.[0];
    const prodId = poLine?.product_id || products?.[0]?.id || '7f920c5d-31ab-4f81-9b16-411a098745b1';

    postMutation.mutate({
      number,
      purchase_order_id: po?.id || selectedPoId || 'po-001',
      warehouse_id: warehouseId,
      lines: [
        {
          po_line_id: poLine?.id || 'pol-001',
          product_id: prodId,
          location_id: locationId,
          batch_no: batchNo,
          received_qty: Number(receivedQty),
          unit_cost: Number(unitCost),
          expiry_date: expiryDate,
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <span>Inbound Goods Receipts Log</span>
          </h2>
          <p className="text-xs text-slate-400">
            Record physical inventory receipts against approved PO lines with idempotency protection.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post Goods Receipt</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">GR Number</th>
                <th className="p-4">PO Reference</th>
                <th className="p-4">Location & Batch</th>
                <th className="p-4">Received Qty & Cost</th>
                <th className="p-4 text-right">Received Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading goods receipts...
                  </td>
                </tr>
              ) : receipts && receipts.length > 0 ? (
                receipts.map((gr) => (
                  <tr key={gr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-100">{gr.number}</td>
                    <td className="p-4 font-mono text-indigo-400">{gr.purchase_order_id}</td>
                    <td className="p-4">
                      {(gr.lines || []).map((l, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-200 font-semibold">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{l.location_code || 'MAIN-SELLABLE'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Layers className="w-3 h-3 text-purple-400" />
                            <span>Batch: {l.batch_no}</span>
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="p-4">
                      {(gr.lines || []).map((l, idx) => (
                        <div key={idx}>
                          <span className="font-extrabold text-emerald-400">{l.received_qty} EA</span>{' '}
                          <span className="text-slate-400 text-[11px]">@ ${l.unit_cost}</span>
                        </div>
                      ))}
                    </td>
                    <td className="p-4 text-right text-slate-400 font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{gr.created_at ? new Date(gr.created_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No goods receipts posted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Goods Receipt Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Post Incoming Inventory Shipment">
        <form onSubmit={handlePost} className="space-y-4">
          {/* Idempotency Header Display */}
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>X-Idempotency-Key:</span>
            </div>
            <span className="font-mono text-slate-300 text-[11px]">{idempotencyKey}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Receipt Number *</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Purchase Order *</label>
              <select
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Purchase Order...</option>
                {approvedPOs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.number} ({p.status})
                  </option>
                ))}
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
              <label className="text-xs font-semibold text-slate-300">Storage Location ID *</label>
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
              <label className="text-xs font-semibold text-slate-300">Received Qty</label>
              <input
                type="number"
                value={receivedQty}
                onChange={(e) => setReceivedQty(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
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
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
              disabled={postMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              {postMutation.isPending ? 'Posting Receipt...' : 'Post Inventory Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
