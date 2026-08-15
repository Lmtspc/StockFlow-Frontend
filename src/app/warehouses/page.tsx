'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Warehouse as WarehouseIcon, MapPin, CheckCircle2, ShieldAlert, ArrowLeftRight, AlertOctagon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Warehouse } from '@/lib/types';
import Modal from '@/components/common/Modal';
import StatusBadge from '@/components/common/StatusBadge';

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const { data: warehouses, isLoading } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => apiFetch('/warehouses'),
  });

  const createMutation = useMutation({
    mutationFn: (newWh: Partial<Warehouse>) =>
      apiFetch<Warehouse>('/warehouses', {
        method: 'POST',
        body: JSON.stringify(newWh),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsModalOpen(false);
      setCode('');
      setName('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ code, name, is_active: true });
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'SELLABLE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'QUARANTINE':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'IN_TRANSIT':
        return <ArrowLeftRight className="w-4 h-4 text-indigo-400" />;
      case 'DAMAGED':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-indigo-400" />
            <span>Managed Facilities & Storage Locations</span>
          </h2>
          <p className="text-xs text-slate-400">
            Define storage warehouses and isolate inventory by SELLABLE, QUARANTINE, DAMAGED, and IN_TRANSIT buckets.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse Facility</span>
        </button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 glass-panel p-8 text-center text-slate-400 rounded-2xl">
            Loading warehouse facilities...
          </div>
        ) : warehouses && warehouses.length > 0 ? (
          warehouses.map((wh) => (
            <div
              key={wh.id}
              className="glass-panel bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <WarehouseIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{wh.name}</h3>
                    <div className="text-xs font-mono font-semibold text-indigo-400">{wh.code}</div>
                  </div>
                </div>
                <StatusBadge status={wh.is_active ? 'APPROVED' : 'CANCELLED'} />
              </div>

              {/* Stock Locations Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Defined Stock Locations ({wh.locations?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {wh.locations && wh.locations.length > 0 ? (
                    wh.locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {getLocationIcon(loc.type)}
                          <div>
                            <div className="font-semibold text-slate-200">{loc.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{loc.code}</div>
                          </div>
                        </div>
                        <StatusBadge status={loc.type} />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-xs text-slate-500 italic p-2">
                      Default SELLABLE & QUARANTINE locations initialized on backend.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 glass-panel p-8 text-center text-slate-500 rounded-2xl">
            No active warehouses configured.
          </div>
        )}
      </div>

      {/* Create Warehouse Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Warehouse Facility">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Facility Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WH-EAST"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Facility Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="East Coast Distribution Center"
              required
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
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              {createMutation.isPending ? 'Registering...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
