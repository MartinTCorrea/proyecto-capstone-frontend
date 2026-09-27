import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { MatchesService } from '../matches.service';
import { MatchPlatform } from '@sgaob/shared';

export interface SyncJobData {
  platform?: MatchPlatform;
  mock?: boolean;
  requestedBy?: string;
}

@Injectable()
export class MatchSyncQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchSyncQueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private redisClient: IORedis | null = null;
  private isRedisAvailable = false;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MatchesService))
    private readonly matchesService: MatchesService,
  ) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.configService.get<number>('REDIS_PORT', 6379));
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    try {
      this.redisClient = new IORedis({
        host,
        port,
        password: password || undefined,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        connectTimeout: 2000,
        lazyConnect: true,
      });

      this.redisClient.on('error', (err) => {
        // Silenciar errores continuos de reconnect si Redis no está activo
        this.isRedisAvailable = false;
      });

      await this.redisClient.connect();
      this.isRedisAvailable = true;
      this.logger.log(`Conexión a Redis exitosa en ${host}:${port}. Inicializando cola BullMQ...`);

      // Inicializar Cola BullMQ
      this.queue = new Queue('match-sync-queue', {
        connection: this.redisClient,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });

      // Inicializar Worker BullMQ
      this.worker = new Worker(
        'match-sync-queue',
        async (job: Job<SyncJobData>) => {
          this.logger.log(`[BullMQ Worker] Procesando trabajo #${job.id}: Sincronización de partidos...`);
          return this.matchesService.processSync(job.data);
        },
        { connection: this.redisClient },
      );

      this.worker.on('completed', (job) => {
        this.logger.log(`[BullMQ Worker] Trabajo #${job.id} completado exitosamente.`);
      });

      this.worker.on('failed', (job, err) => {
        this.logger.error(`[BullMQ Worker] Trabajo #${job?.id} falló: ${err.message}`);
      });
    } catch (error) {
      this.isRedisAvailable = false;
      this.logger.warn(
        `Redis no disponible en ${host}:${port}. Modo tolerante a fallos activo: trabajos de sincronización se procesarán en cola asíncrona en memoria.`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      if (this.worker) await this.worker.close();
      if (this.queue) await this.queue.close();
      if (this.redisClient) await this.redisClient.quit();
    } catch (e) {
      // Ignorar errores al cerrar recursos
    }
  }

  /**
   * Encola una tarea de sincronización de partidos (RF08, RF09)
   */
  async addSyncJob(data: SyncJobData): Promise<{ jobId: string; status: string; mode: string }> {
    if (this.isRedisAvailable && this.queue) {
      const job = await this.queue.add('sync-matches', data);
      return {
        jobId: job.id || 'queued',
        status: 'ENQUEUED',
        mode: 'BULLMQ_REDIS',
      };
    }

    // Modo tolerante a fallos: Procesamiento asíncrono directo (sin bloquear el hilo HTTP)
    const simulatedJobId = `job-direct-${Date.now()}`;
    setImmediate(async () => {
      try {
        this.logger.log(`[Queue Fallback] Ejecutando sincronización asíncrona directa (${simulatedJobId})...`);
        await this.matchesService.processSync(data);
      } catch (err) {
        this.logger.error(`[Queue Fallback] Error en sincronización directa: ${(err as Error).message}`);
      }
    });

    return {
      jobId: simulatedJobId,
      status: 'PROCESSING_DIRECT',
      mode: 'DIRECT_ASYNC_FALLBACK',
    };
  }

  getIsRedisAvailable(): boolean {
    return this.isRedisAvailable;
  }
}
