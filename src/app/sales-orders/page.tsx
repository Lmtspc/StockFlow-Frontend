'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingBag, Lock, CheckCircle2, XCircle, Key, Trash2, UserCheck } from 'lucide-react';
import { apiFetch, generateIdempotencyKey } from '@/lib/api';
import { SalesOrder, Product, Warehouse, SOLine } from '@/lib/types';
import Modal from '@/components/common/Modal';
import StatusBadge from '@/components/common/StatusBadge';

export default function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: 'reserve' | 'fulfill' | 'cancel' | null;
    soId: string | null;
  }>({ type: null, soId: null });

  // Action state
  const [locationId, setLocationId] = useState('loc-main-sellable');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Form State
  const [number, setNumber] = useState(`SO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customerName, setCustomerName] = useState('Acme Logistics Corp');
  const [warehouseId, setWarehouseId] = useState('11111111-2222-3333-4444-555555555555');
  const [lines, setLines] = useState<SOLine[]>([
    { product_id: '7f920c5d-31ab-4f81-9b16-411a098745b1', quantity: 10, unit_price: 29.99 },
  ]);

  const { data: salesOrders, isLoading } = useQuery<SalesOrder[]>({
    queryKey: ['sales-orders'],
    queryFn: () => apiFetch('/sales-orders'),
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
    mutationFn: (newSO: Partial<SalesOrder>) =>
      apiFetch<SalesOrder>('/sales-orders', {
        method: 'POST',
        body: JSON.stringify(newSO),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setIsModalOpen(false);
      setNumber(`SO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({
      soId,
      action,
      key,
    }: {
      soId: string;
      action: 'reserve' | 'fulfill' | 'cancel';
      key?: string;
    }) =>
      apiFetch(`/sales-orders/${soId}/${action}`, {
        method: 'POST',
        idempotencyKey: key,
        body: action !== 'cancel' ? JSON.stringify({ location_id: locationId }) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-on-hand'] });
      setActionModal({ type: null, soId: null });
    },
  });

  const addLine = () => {
    const firstProd = products?.[0]?.id || '7f920c5d-31ab-4f81-9b16-411a098745b1';
    setLines([...lines, { product_id: firstProd, quantity: 5, unit_price: 49.99 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, key: keyof SOLine, value: unknown) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [key]: value };
    setLines(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      number,
      customer_name: customerName,
      warehouse_id: warehouseId,
      lines,
    });
  };

  const openActionModal = (type: 'reserve' | 'fulfill' | 'cancel', soId: string) => {
    const keyPrefix = type === 'reserve' ? 'RES' : type === 'fulfill' ? 'FUL' : 'CAN';
    setIdempotencyKey(generateIdempotencyKey(keyPrefix));
    setActionModal({ type, soId });
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionModal.soId && actionModal.type) {
      actionMutation.mutate({
        soId: actionModal.soId,
        action: actionModal.type,
        key: actionModal.type !== 'cancel' ? idempotencyKey : undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <span>Sales Orders & Fulfillment Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Create sales orders, reserve location stock, and process customer order fulfillments with idempotency keys.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Sales Order</span>
        </button>
      </div>

      {/* Sales Orders Table */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">SO Number</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Items & Pricing</th>
                <th className="p-4">Order Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading sales orders...
                  </td>
                </tr>
              ) : salesOrders && salesOrders.length > 0 ? (
                salesOrders.map((so) => {
                  const soLines = so.lines || [];
                  const total = soLines.reduce(
                    (sum, l) => sum + (l.quantity || 0) * (l.unit_price || 0),
                    0
                  );

                  return (
                    <tr key={so.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-indigo-400" />
                        <span>{so.number}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{so.customer_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {soLines.map((l, idx) => (
                            <div key={idx} className="text-[11px] font-medium text-slate-300">
                              <span className="font-semibold text-indigo-300">{l.quantity}x</span>{' '}
                              {l.product_name || 'Product'} @ ${l.unit_price}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-slate-100">${total.toFixed(2)}</td>
                      <td className="p-4">
                        <StatusBadge status={so.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {so.status === 'DRAFT' && (
                            <button
                              onClick={() => openActionModal('reserve', so.id)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold transition-colors flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Reserve</span>
                            </button>
                          )}

                          {(so.status === 'DRAFT' || so.status === 'RESERVED') && (
                            <button
                              onClick={() => openActionModal('fulfill', so.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 font-semibold transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Fulfill</span>
                            </button>
                          )}

                          {so.status !== 'FULFILLED' && so.status !== 'CANCELLED' && (
                            <button
                              onClick={() => openActionModal('cancel', so.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 font-semibold transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No sales orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Sales Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sales Order Number *</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Fulfillment Warehouse *</label>
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Customer Account / Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="Acme Corp"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Sales Order Items</label>
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
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="col-span-3 space-y-1">
                  <span className="text-[10px] text-slate-500">Unit Price ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) => updateLine(idx, 'unit_price', Number(e.target.value))}
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
              {createMutation.isPending ? 'Creating...' : 'Create Sales Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Execution Modal (Reserve / Fulfill / Cancel) */}
      <Modal
        isOpen={!!actionModal.type}
        onClose={() => setActionModal({ type: null, soId: null })}
        title={`Execute Order Action: ${(actionModal.type || '').toUpperCase()}`}
      >
        <form onSubmit={handleExecuteAction} className="space-y-4">
          {actionModal.type !== 'cancel' && (
            <>
              <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span>X-Idempotency-Key:</span>
                </div>
                <span className="font-mono text-slate-300 text-[11px]">{idempotencyKey}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Target Location ID *</label>
                <input
                  type="text"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {actionModal.type === 'cancel' && (
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel this Sales Order? Reserved inventory allocations will be released back to Sellable stock.
            </p>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActionModal({ type: null, soId: null })}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={actionMutation.isPending}
              className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-lg ${
                actionModal.type === 'cancel'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {actionMutation.isPending
                ? 'Processing...'
                : `Confirm ${(actionModal.type || '').toUpperCase()}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
