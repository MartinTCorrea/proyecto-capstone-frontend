import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
}

export interface NominationAlertOptions {
  to: string;
  userId: string;
  refereeName: string;
  tournament: string;
  category: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDateTime: Date | string;
  matchRole: string;
}

export interface MatchChangeAlertOptions {
  to: string;
  userId: string;
  refereeName: string;
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDateTime: Date | string;
  previousStatus: string;
  newStatus: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = Number(this.configService.get<number>('SMTP_PORT', 1025));
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

    const transportConfig: nodemailer.TransportOptions = {
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    } as nodemailer.TransportOptions;

    this.transporter = nodemailer.createTransport(transportConfig);
    this.logger.log(`Servicio de mensajería SMTP inicializado en ${host}:${port}`);
  }

  /**
   * Verifica la conectividad con el servidor SMTP (Mailpit / SES / Proveedor)
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Conexión con el servidor SMTP verificada exitosamente.');
      return true;
    } catch (error) {
      this.logger.warn(`No se pudo verificar la conexión SMTP: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Envía un correo electrónico genérico y registra la trazabilidad en notifications
   */
  async sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const from = this.configService.get<string>('SMTP_FROM', 'SGAOB <no-reply@sgaob.cl>');
    const plainText = options.text || options.html.replace(/<[^>]*>?/gm, '');

    try {
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: plainText,
      });

      this.logger.log(`Correo enviado a ${options.to} (ID: ${info.messageId}) - Asunto: "${options.subject}"`);

      // Trazabilidad en base de datos si se indica userId
      if (options.userId) {
        await this.prisma.notification.create({
          data: {
            userId: options.userId,
            title: options.subject,
            message: plainText,
            channel: NotificationChannel.EMAIL,
            status: NotificationStatus.SENT,
            sentAt: new Date(),
            retryCount: 0,
          },
        });
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errorMsg = (error as Error).message;
      this.logger.error(`Error enviando correo a ${options.to}: ${errorMsg}`);

      // Registrar fallo en base de datos para política de reintentos (NFR Fiabilidad)
      if (options.userId) {
        await this.prisma.notification.create({
          data: {
            userId: options.userId,
            title: options.subject,
            message: plainText,
            channel: NotificationChannel.EMAIL,
            status: NotificationStatus.FAILED,
            retryCount: 1,
          },
        });
      }

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Notificación formal de nominación / asignación a un partido (RF14)
   */
  async sendNominationAlert(options: NominationAlertOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const formattedDate = new Date(options.matchDateTime).toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `[SGAOB] Nueva Nominación: ${options.matchRole} — ${options.homeTeam} vs ${options.awayTeam}`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #1e3a8a; color: #ffffff; padding: 20px; text-align: center; }
          .content { padding: 24px; color: #334155; line-height: 1.6; }
          .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 9999px; font-weight: 600; font-size: 14px; }
          .details { margin: 20px 0; background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; }
          .cta { margin-top: 24px; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 style="margin:0; font-size: 20px;">SGAOB — Comisión Técnica</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Asignación de Personal Técnico</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${options.refereeName}</strong>,</p>
            <p>Se te ha nominado oficialmente para cumplir funciones técnicas en el siguiente partido:</p>
            
            <div style="margin: 12px 0;">
              Rol asignado: <span class="badge">${options.matchRole}</span>
            </div>

            <div class="details">
              <p style="margin: 4px 0;"><strong>Torneo / Categoría:</strong> ${options.tournament} (${options.category})</p>
              <p style="margin: 4px 0;"><strong>Encuentro:</strong> ${options.homeTeam} vs ${options.awayTeam}</p>
              <p style="margin: 4px 0;"><strong>Fecha y Hora:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0;"><strong>Gimnasio / Recinto:</strong> ${options.venue}</p>
            </div>

            <p>Por favor ingresa a la plataforma web para confirmar o justificar tu rechazo a la brevedad conforme al reglamento de la asociación.</p>
            
            <div class="cta">
              <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/nominaciones" class="button">Ver y Responder Nominación</a>
            </div>
          </div>
          <div class="footer">
            Sistema de Gestión de Árbitros y Oficiales de Básquetbol (SGAOB). Mensaje automático, por favor no responder directamente a este correo.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: options.to,
      userId: options.userId,
      subject,
      html,
    });
  }

  /**
   * Alerta automática por suspensión, cancelación o reprogramación de partido (RF10)
   */
  async sendMatchStatusChangeAlert(options: MatchChangeAlertOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const formattedDate = new Date(options.matchDateTime).toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `[ALERTA SGAOB] Cambio de Estado de Partido: ${options.homeTeam} vs ${options.awayTeam} (${options.newStatus})`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #b91c1c; color: #ffffff; padding: 20px; text-align: center; }
          .content { padding: 24px; color: #334155; line-height: 1.6; }
          .status-badge { display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border-radius: 9999px; font-weight: 700; font-size: 14px; }
          .details { margin: 20px 0; background: #f8fafc; border-left: 4px solid #ef4444; padding: 12px 16px; }
          .footer { padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 style="margin:0; font-size: 20px;">SGAOB — Alerta de Partidos</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Actualización de Estado de Cartelera</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${options.refereeName}</strong>,</p>
            <p>Te informamos que un partido en el cual estabas nominado/a ha cambiado su estado operativo:</p>
            
            <div style="margin: 12px 0;">
              Nuevo estado: <span class="status-badge">${options.newStatus}</span> (Anterior: ${options.previousStatus})
            </div>

            <div class="details">
              <p style="margin: 4px 0;"><strong>Torneo:</strong> ${options.tournament}</p>
              <p style="margin: 4px 0;"><strong>Encuentro:</strong> ${options.homeTeam} vs ${options.awayTeam}</p>
              <p style="margin: 4px 0;"><strong>Fecha programada:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0;"><strong>Recinto:</strong> ${options.venue}</p>
            </div>

            <p>La Comisión Técnica ha sido notificada automáticamente. No se requiere tu asistencia en el recinto si el partido fue cancelado o suspendido.</p>
          </div>
          <div class="footer">
            Sistema de Gestión de Árbitros y Oficiales de Básquetbol (SGAOB).
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: options.to,
      userId: options.userId,
      subject,
      html,
    });
  }
}
