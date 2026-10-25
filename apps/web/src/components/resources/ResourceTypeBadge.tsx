import React from 'react';
import { ResourceType } from '@sgaob/shared';
import { FileText, Key, Megaphone } from 'lucide-react';

interface ResourceTypeBadgeProps {
  type: ResourceType;
  showIcon?: boolean;
  className?: string;
}

export const ResourceTypeBadge: React.FC<ResourceTypeBadgeProps> = ({
  type,
  showIcon = true,
  className = '',
}) => {
  switch (type) {
    case ResourceType.DOCUMENTO:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-slate-800/80 dark:text-blue-300 dark:border-blue-900/40 ${className}`}
        >
          {showIcon && <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />}
          <span>Documento</span>
        </span>
      );

    case ResourceType.CREDENCIAL:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-slate-800/80 dark:text-rose-300 dark:border-rose-900/40 ${className}`}
        >
          {showIcon && <Key className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />}
          <span>Credencial Segura</span>
        </span>
      );

    case ResourceType.COMUNICADO:
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-slate-800/80 dark:text-purple-300 dark:border-purple-900/40 ${className}`}
        >
          {showIcon && <Megaphone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />}
          <span>Comunicado</span>
        </span>
      );
  }
};
