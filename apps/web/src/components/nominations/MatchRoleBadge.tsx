import React from 'react';
import { MatchRole } from '@sgaob/shared';
import { Shield, Users } from 'lucide-react';

interface MatchRoleBadgeProps {
  role: MatchRole;
  showIcon?: boolean;
  className?: string;
}

export const MatchRoleBadge: React.FC<MatchRoleBadgeProps> = ({
  role,
  showIcon = true,
  className = '',
}) => {
  switch (role) {
    case MatchRole.ARBITRO_PRINCIPAL:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-slate-800/80 dark:text-indigo-300 dark:border-indigo-900/40 ${className}`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />}
          <span>Árbitro Principal</span>
        </span>
      );

    case MatchRole.ARBITRO_1:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-slate-800/80 dark:text-sky-300 dark:border-sky-900/40 ${className}`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />}
          <span>Árbitro 1</span>
        </span>
      );

    case MatchRole.ARBITRO_2:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-slate-800/80 dark:text-blue-300 dark:border-blue-900/40 ${className}`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />}
          <span>Árbitro 2 (3-Ref)</span>
        </span>
      );

    case MatchRole.OFICIAL_1:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-slate-800/80 dark:text-purple-300 dark:border-purple-900/40 ${className}`}
        >
          {showIcon && <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />}
          <span>Oficial Mesa 1</span>
        </span>
      );

    case MatchRole.OFICIAL_2:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/80 dark:bg-slate-800/80 dark:text-fuchsia-300 dark:border-fuchsia-900/40 ${className}`}
        >
          {showIcon && <Users className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" aria-hidden="true" />}
          <span>Oficial Mesa 2</span>
        </span>
      );

    case MatchRole.OFICIAL_3:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-slate-800/80 dark:text-amber-300 dark:border-amber-900/40 ${className}`}
        >
          {showIcon && <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
          <span>Oficial Mesa 3</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}
        >
          <span>{role}</span>
        </span>
      );
  }
};
