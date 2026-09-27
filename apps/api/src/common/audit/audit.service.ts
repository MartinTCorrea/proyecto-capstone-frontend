import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@sgaob/shared';

export interface LogActionParams {
  userId?: string;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogActionParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: params.details,
          ipAddress: params.ipAddress,
        },
      });

      this.logger.log(
        `[AUDIT] Acción: ${params.action} | Entidad: ${params.entityType} (${params.entityId}) | Usuario: ${
          params.userId || 'SISTEMA'
        }`,
      );
    } catch (error) {
      this.logger.error(`Error guardando registro de auditoría: ${(error as Error).message}`, (error as Error).stack);
    }
  }
}
