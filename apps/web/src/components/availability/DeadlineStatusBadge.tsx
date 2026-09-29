import React from 'react';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface DeadlineStatusBadgeProps {
  deadline: Date;
  isAdmin: boolean;
}

export const DeadlineStatusBadge: React.FC<DeadlineStatusBadgeProps> = ({
  deadline,
  isAdmin,
}) => {
  const now = new Date();
  const isPast = now.getTime() > deadline.getTime();

  // Comprobar si vence en las próximas 24 horas
  const hoursRemaining = Math.max(
    0,
    Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)),
  );
  const isUrgent = !isPast && hoursRemaining <= 24;

  const formattedDeadline = deadline.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isPast) {
    if (isAdmin) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs">
          <ShieldAlert className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span>
            <strong>Plazo cerrado ({formattedDeadline}):</strong> Modo Comisión Técnica activo (puedes registrar excepciones).
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        <span>
          <strong>Plazo de declaración cerrado:</strong> Venció el {formattedDeadline}. Consulta en solo lectura.
        </span>
      </div>
    );
  }

  if (isUrgent) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
        <span>
          <strong>¡Atención!</strong> El plazo de cierre vence hoy a las 23:59 ({hoursRemaining} horas restantes).
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <span>
        <strong>Plazo Abierto:</strong> Puedes declarar o modificar tu disponibilidad hasta el {formattedDeadline}.
      </span>
    </div>
  );
};

export default DeadlineStatusBadge;
