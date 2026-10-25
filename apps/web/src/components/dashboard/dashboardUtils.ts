import { MatchRole, NominationStatus, MatchDto } from '@sgaob/shared';

export interface CycleDates {
  mondayStr: string;
  saturdayStr: string;
  sundayStr: string;
  deadlineDate: Date;
  isPastDeadline: boolean;
  hoursRemaining: number;
  cycleLabel: string;
  formattedDeadline: string;
}

/**
 * Calcula las fechas del ciclo semanal activo (Lunes a Domingo, con foco en el fin de semana).
 * Si hoy es lunes, martes o miércoles: el ciclo en juego es el fin de semana de esta semana
 * (cuyo plazo de disponibilidad cierra este miércoles a las 23:59:59).
 * Si hoy es jueves, viernes, sábado o domingo: el plazo para este fin de semana ya cerró,
 * por lo que el próximo ciclo abierto de declaración es el fin de semana siguiente.
 */
export function getUpcomingCycleDates(): CycleDates {
  const now = new Date();
  const day = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // Días hasta el próximo sábado relevante
  let daysToSaturday: number;
  if (day >= 1 && day <= 3) {
    daysToSaturday = 6 - day;
  } else if (day === 0) {
    daysToSaturday = 6;
  } else {
    // Jueves (4), Viernes (5), Sábado (6)
    daysToSaturday = 6 - day + 7;
  }

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysToSaturday);
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(0, 0, 0, 0);

  // El lunes de esa semana (Sábado - 5 días)
  const monday = new Date(saturday);
  monday.setDate(saturday.getDate() - 5);
  monday.setHours(0, 0, 0, 0);

  // Fecha límite de cierre: Miércoles previo a ese fin de semana a las 23:59:59
  const deadline = new Date(saturday);
  deadline.setDate(saturday.getDate() - 3);
  deadline.setHours(23, 59, 59, 999);

  const formatYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayNum}`;
  };

  const isPastDeadline = now.getTime() > deadline.getTime();
  const hoursRemaining = Math.max(
    0,
    Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)),
  );

  const satDay = saturday.getDate();
  const sunDay = sunday.getDate();
  const monthName = saturday.toLocaleDateString('es-CL', { month: 'long' });
  const cycleLabel = `Fin de semana ${satDay} y ${sunDay} de ${monthName}`;

  const formattedDeadline = deadline.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    mondayStr: formatYMD(monday),
    saturdayStr: formatYMD(saturday),
    sundayStr: formatYMD(sunday),
    deadlineDate: deadline,
    isPastDeadline,
    hoursRemaining,
    cycleLabel,
    formattedDeadline,
  };
}

export interface MatchCoverageAnalysis {
  isFullyStaffed: boolean;
  missingRoles: MatchRole[];
  hasRejection: boolean;
  assignedRoles: MatchRole[];
}

/**
 * Analiza la dotación arbitral de un partido.
 * Para estar completo requiere como mínimo:
 * - ARBITRO_PRINCIPAL
 * - ARBITRO_1
 * - OFICIAL_1
 */
export function analyzeMatchCoverage(match: MatchDto): MatchCoverageAnalysis {
  const activeNominations = (match.nominations || []).filter(
    (n) => n.status !== NominationStatus.REJECTED,
  );

  const hasRejection = (match.nominations || []).some(
    (n) => n.status === NominationStatus.REJECTED,
  );

  const assignedRoles = activeNominations.map((n) => n.matchRole);

  const requiredSlots: MatchRole[] = [
    MatchRole.ARBITRO_PRINCIPAL,
    MatchRole.ARBITRO_1,
    MatchRole.OFICIAL_1,
  ];

  const missingRoles = requiredSlots.filter((slot) => !assignedRoles.includes(slot));

  return {
    isFullyStaffed: missingRoles.length === 0,
    missingRoles,
    hasRejection,
    assignedRoles,
  };
}

