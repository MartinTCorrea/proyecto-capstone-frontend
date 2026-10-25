import React from 'react';
import { NominationStatus } from '@sgaob/shared';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface NominationStatusBadgeProps {
  status: NominationStatus;
  showIcon?: boolean;
  className?: string;
}

export const NominationStatusBadge: React.FC<NominationStatusBadgeProps> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  switch (status) {
    case NominationStatus.CONFIRMED:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-slate-800/80 dark:text-emerald-300 dark:border-emerald-900/40 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
          <span>Confirmada</span>
        </span>
      );

    case NominationStatus.REJECTED:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-slate-800/80 dark:text-rose-300 dark:border-rose-900/40 ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />}
          <span>Rechazada</span>
        </span>
      );

    case NominationStatus.PENDING:
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-slate-800/80 dark:text-amber-300 dark:border-amber-900/40 ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
          <span>Pendiente</span>
        </span>
      );
  }
};
