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
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${className}`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />}
          <span>Árbitro Principal</span>
        </span>
      );

    case MatchRole.ARBITRO_1:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 ${className}`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />}
          <span>Árbitro 1</span>
        </span>
      );

    case MatchRole.ARBITRO_2:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 ${className}`}
        >
          {showIcon && <Shield className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />}
          <span>Árbitro 2 (3-Ref)</span>
        </span>
      );

    case MatchRole.OFICIAL_1:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 ${className}`}
        >
          {showIcon && <Users className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />}
          <span>Oficial Mesa 1</span>
        </span>
      );

    case MatchRole.OFICIAL_2:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/80 ${className}`}
        >
          {showIcon && <Users className="w-3.5 h-3.5 text-fuchsia-600" aria-hidden="true" />}
          <span>Oficial Mesa 2</span>
        </span>
      );

    case MatchRole.OFICIAL_3:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
        >
          {showIcon && <Users className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />}
          <span>Oficial Mesa 3</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <span>{role}</span>
        </span>
      );
  }
};
