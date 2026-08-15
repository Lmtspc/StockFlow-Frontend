import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (normalized) {
    case 'APPROVED':
    case 'POSTED':
    case 'RECEIVED':
    case 'FULFILLED':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      break;
    case 'DRAFT':
    case 'PENDING_APPROVAL':
      colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      break;
    case 'SHIPPED':
    case 'RESERVED':
    case 'IN_TRANSIT':
      colorClasses = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      break;
    case 'CANCELLED':
    case 'REJECTED':
    case 'WRITE_OFF':
    case 'DAMAGED':
      colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      break;
    case 'QUARANTINE':
      colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      break;
    default:
      colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {normalized.replace('_', ' ')}
    </span>
  );
}
