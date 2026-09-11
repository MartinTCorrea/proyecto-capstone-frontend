/**
 * Roles del sistema (RF02, Anexo A.1)
 * Separación estricta entre rol arbitral y oficial de mesa.
 */
export enum RoleName {
  ADMIN_COMISION_TECNICA = 'ADMIN_COMISION_TECNICA',
  ARBITRO = 'ARBITRO',
  OFICIAL_MESA = 'OFICIAL_MESA',
}

/**
 * Estados del usuario en el sistema
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_ROLE = 'PENDING_ROLE',
}

/**
 * Clasificación de días según reglas de negocio (Anexo A.4)
 */
export enum DayType {
  LABORAL = 'LABORAL', // Lunes a Viernes
  FIN_DE_SEMANA = 'FIN_DE_SEMANA', // Sábado y Domingo
}

/**
 * Código de bloque horario parametrizado
 */
export enum TimeBlockCode {
  HORARIO_1 = 'HORARIO_1',
  HORARIO_2 = 'HORARIO_2',
}

/**
 * Bloques horarios seleccionables para disponibilidad (RF05, Anexo A.3)
 */
export enum AvailabilityBlock {
  HORARIO_1 = 'HORARIO_1',
  HORARIO_2 = 'HORARIO_2',
  FULL = 'FULL',
  NO = 'NO',
}

/**
 * Plataformas de origen de partidos (RF07)
 */
export enum MatchPlatform {
  NBN23 = 'NBN23',
  SWISH = 'SWISH',
}

/**
 * Bloque horario asignado a un partido según su hora estimada (Ajuste Paso 0)
 */
export enum MatchTimeBlock {
  HORARIO_1 = 'HORARIO_1',
  HORARIO_2 = 'HORARIO_2',
  AMBOS = 'AMBOS',
}

/**
 * Estado del partido sincronizado
 */
export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  SUSPENDED = 'SUSPENDED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * Roles específicos dentro de un partido (RF13, Anexo A.1, A.2)
 */
export enum MatchRole {
  ARBITRO_PRINCIPAL = 'ARBITRO_PRINCIPAL',
  ARBITRO_1 = 'ARBITRO_1',
  ARBITRO_2 = 'ARBITRO_2', // Slot opcional para modalidad de 3 árbitros
  OFICIAL_1 = 'OFICIAL_1',
  OFICIAL_2 = 'OFICIAL_2',
  OFICIAL_3 = 'OFICIAL_3',
}

/**
 * Estados de la nominación (RF14, RF15)
 */
export enum NominationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

/**
 * Tipos de recursos gestionables (RF17, RF18, RF19)
 */
export enum ResourceType {
  DOCUMENTO = 'DOCUMENTO',
  CREDENCIAL = 'CREDENCIAL',
  COMUNICADO = 'COMUNICADO',
}

/**
 * Niveles de visibilidad de recursos (Anexo A.5)
 */
export enum ResourceVisibility {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  ADMIN = 'ADMIN',
}

/**
 * Canales de notificación
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

/**
 * Estado de envío de notificación
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

/**
 * Acciones auditables en el sistema (Ambigüedad #4 y trazabilidad)
 */
export enum AuditAction {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  ROLES_ASSIGNED = 'ROLES_ASSIGNED',
  NOMINATION_CREATED = 'NOMINATION_CREATED',
  NOMINATION_STATUS_CHANGED = 'NOMINATION_STATUS_CHANGED',
  NOMINATION_OVERRIDDEN = 'NOMINATION_OVERRIDDEN', // Admin override for schedule overlap
  MATCH_STATUS_UPDATED = 'MATCH_STATUS_UPDATED',
  AVAILABILITY_SUBMITTED = 'AVAILABILITY_SUBMITTED',
  RESOURCE_CREATED = 'RESOURCE_CREATED',
}

