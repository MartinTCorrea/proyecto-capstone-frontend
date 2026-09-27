import React from 'react';
import { MatchPlatform } from '@sgaob/shared';
import { Database, ShieldCheck, Cpu } from 'lucide-react';

interface MatchPlatformBadgeProps {
  platform: MatchPlatform;
  className?: string;
}

export const MatchPlatformBadge: React.FC<MatchPlatformBadgeProps> = ({ platform, className = '' }) => {
  switch (platform) {
    case MatchPlatform.MANUAL:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
          title="Partido creado de forma manual en SGAOB (100% Autónomo)"
        >
          <ShieldCheck className="w-3 h-3 text-purple-600" />
          <span>Manual</span>
        </span>
      );

    case MatchPlatform.SWISH:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
          title="Sincronizado vía Swish (Federación)"
        >
          <Cpu className="w-3 h-3 text-blue-600" />
          <span>Swish</span>
        </span>
      );

    case MatchPlatform.NBN23:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
          title="Sincronizado vía NBN23"
        >
          <Database className="w-3 h-3 text-emerald-600" />
          <span>NBN23</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 ${className}`}>
          {platform}
        </span>
      );
  }
};
