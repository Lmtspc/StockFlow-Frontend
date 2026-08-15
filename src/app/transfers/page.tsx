'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeftRight, Truck, CheckCircle2, Key, Trash2 } from 'lucide-react';
import { apiFetch, generateIdempotencyKey } from '@/lib/api';
import { StockTransfer, Product, Warehouse, TransferLine } from '@/lib/types';
import Modal from '@/components/common/Modal';
import StatusBadge from '@/components/common/StatusBadge';

export default function StockTransfersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: 'ship' | 'receive' | null;
    trfId: string | null;
  }>({ type: null, trfId: null });

  // Form State
  const [number, setNumber] = useState(`TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [sourceWhId, setSourceWhId] = useState('11111111-2222-3333-4444-555555555555');
  const [destWhId, setDestWhId] = useState('22222222-3333-4444-5555-666666666666');
  const [lines, setLines] = useState<TransferLine[]>([
    {
      product_id: '7f920c5d-31ab-4f81-9b16-411a098745b1',
      batch_no: 'BATCH-2026A',
      quantity: 25,
    },
  ]);

  // Action Form State
  const [sourceLocId, setSourceLocId] = useState('loc-main-sellable');
  const [inTransitLocId, setInTransitLocId] = useState('loc-main-intransit');
  const [destLocId, setDestLocId] = useState('loc-west-sellable');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const { data: transfers, isLoading } = useQuery<StockTransfer[]>({
    queryKey: ['transfers'],
    queryFn: () => apiFetch('/transfers'),
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
    mutationFn: (newTrf: Partial<StockTransfer>) =>
      apiFetch<StockTransfer>('/transfers', {
        method: 'POST',
        body: JSON.stringify(newTrf),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setIsModalOpen(false);
      setNumber(`TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({
      trfId,
      action,
      payload,
      key,
    }: {
      trfId: string;
      action: 'ship' | 'receive';
      payload: Record<string, string>;
      key: string;
    }) =>
      apiFetch(`/transfers/${trfId}/${action}`, {
        method: 'POST',
        idempotencyKey: key,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['stock-on-hand'] });
      setActionModal({ type: null, trfId: null });
    },
  });

  const addLine = () => {
    const firstProd = products?.[0]?.id || '7f920c5d-31ab-4f81-9b16-411a098745b1';
    setLines([...lines, { product_id: firstProd, batch_no: 'BATCH-2026A', quantity: 10 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, key: keyof TransferLine, value: unknown) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [key]: value };
    setLines(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      number,
      source_warehouse_id: sourceWhId,
      dest_warehouse_id: destWhId,
      lines,
    });
  };

  const openActionModal = (type: 'ship' | 'receive', trfId: string) => {
    const keyPrefix = type === 'ship' ? 'SHIP' : 'REC';
    setIdempotencyKey(generateIdempotencyKey(keyPrefix));
    setActionModal({ type, trfId });
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionModal.trfId && actionModal.type) {
      const payload: Record<string, string> =
        actionModal.type === 'ship'
          ? {
              source_location_id: sourceLocId,
              in_transit_location_id: inTransitLocId,
            }
          : {
              in_transit_location_id: inTransitLocId,
              dest_location_id: destLocId,
            };

      actionMutation.mutate({
        trfId: actionModal.trfId,
        action: actionModal.type,
        payload,
        key: idempotencyKey,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
            <span>Warehouse-to-Warehouse Stock Transfers</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage multi-site stock movements with 3-stage lifecycle: Draft &rarr; Ship &rarr; Receive.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Stock Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Transfer Ref</th>
                <th className="p-4">Source Warehouse</th>
                <th className="p-4">Destination Warehouse</th>
                <th className="p-4">Transferred Lines</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading stock transfers...
                  </td>
                </tr>
              ) : transfers && transfers.length > 0 ? (
                transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                      <span>{trf.number}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">
                      {trf.source_warehouse_name || 'Central Distribution'}
                    </td>
                    <td className="p-4 font-semibold text-indigo-300">
                      {trf.dest_warehouse_name || 'West Coast Logistics'}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {(trf.lines || []).map((l, idx) => (
                          <div key={idx} className="text-[11px] font-medium text-slate-300">
                            <span className="font-semibold text-emerald-400">{l.quantity}x</span>{' '}
                            {l.product_name || 'Product'} (Batch: {l.batch_no || 'N/A'})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={trf.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {trf.status === 'DRAFT' && (
                          <button
                            onClick={() => openActionModal('ship', trf.id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Ship Transfer</span>
                          </button>
                        )}

                        {trf.status === 'SHIPPED' && (
                          <button
                            onClick={() => openActionModal('receive', trf.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Receive Transfer</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No transfers logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initiate Stock Transfer">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Transfer Number *</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Source Warehouse *</label>
              <select
                value={sourceWhId}
                onChange={(e) => setSourceWhId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {(warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Destination Warehouse *</label>
              <select
                value={destWhId}
                onChange={(e) => setDestWhId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {(warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Transfer Lines</label>
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
                <div className="col-span-5 space-y-1">
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

                <div className="col-span-4 space-y-1">
                  <span className="text-[10px] text-slate-500">Batch No</span>
                  <input
                    type="text"
                    value={line.batch_no}
                    onChange={(e) => updateLine(idx, 'batch_no', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <span className="text-[10px] text-slate-500">Qty</span>
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
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
              {createMutation.isPending ? 'Creating...' : 'Create Transfer Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Modal (Ship / Receive) */}
      <Modal
        isOpen={!!actionModal.type}
        onClose={() => setActionModal({ type: null, trfId: null })}
        title={`Execute Transfer Stage: ${(actionModal.type || '').toUpperCase()}`}
      >
        <form onSubmit={handleExecuteAction} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>X-Idempotency-Key:</span>
            </div>
            <span className="font-mono text-slate-300 text-[11px]">{idempotencyKey}</span>
          </div>

          {actionModal.type === 'ship' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Source Location ID *</label>
                <input
                  type="text"
                  value={sourceLocId}
                  onChange={(e) => setSourceLocId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">In-Transit Location ID *</label>
                <input
                  type="text"
                  value={inTransitLocId}
                  onChange={(e) => setInTransitLocId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">In-Transit Location ID *</label>
                <input
                  type="text"
                  value={inTransitLocId}
                  onChange={(e) => setInTransitLocId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Destination Location ID *</label>
                <input
                  type="text"
                  value={destLocId}
                  onChange={(e) => setDestLocId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActionModal({ type: null, trfId: null })}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              {actionMutation.isPending
                ? 'Executing...'
                : `Confirm ${(actionModal.type || '').toUpperCase()}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
