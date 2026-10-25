import React from 'react';
import { MatchStatus } from '@sgaob/shared';
import { Clock, AlertTriangle, XCircle, CheckCircle2, CalendarDays } from 'lucide-react';

interface MatchStatusBadgeProps {
  status: MatchStatus;
  className?: string;
}

export const MatchStatusBadge: React.FC<MatchStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case MatchStatus.SCHEDULED:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-slate-800/80 dark:text-blue-300 dark:border-blue-900/40 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Programado</span>
        </span>
      );

    case MatchStatus.RESCHEDULED:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-slate-800/80 dark:text-amber-300 dark:border-amber-900/40 animate-pulse ${className}`}
          title="El horario o fecha de este partido fue modificado"
        >
          <CalendarDays className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Reprogramado</span>
        </span>
      );

    case MatchStatus.SUSPENDED:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-slate-800/80 dark:text-rose-300 dark:border-rose-900/40 ${className}`}
          title="Partido suspendido por decisión técnica"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Suspendido</span>
        </span>
      );

    case MatchStatus.CANCELLED:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700 line-through ${className}`}
          title="Partido cancelado definitivamente"
        >
          <XCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Cancelado</span>
        </span>
      );

    case MatchStatus.COMPLETED:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-slate-800/80 dark:text-emerald-300 dark:border-emerald-900/40 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Finalizado</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ${className}`}>
          {status}
        </span>
      );
  }
};
