import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión a base de datos PostgreSQL establecida mediante Prisma.');
    } catch (error) {
      this.logger.error('Error al conectar a PostgreSQL con Prisma:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Conexión con PostgreSQL cerrada.');
  }
}
