import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let prismaService: PrismaService;
  let mockSendMail: jest.Mock;
  let mockVerify: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-msg-id-123' });
    mockVerify = jest.fn().mockResolvedValue(true);

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
      verify: mockVerify,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                SMTP_HOST: 'localhost',
                SMTP_PORT: 1025,
                SMTP_USER: '',
                SMTP_PASS: '',
                SMTP_FROM: 'SGAOB <no-reply@sgaob.cl>',
                FRONTEND_URL: 'http://localhost:5173',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn().mockResolvedValue({ id: 'notif-uuid-1' }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    prismaService = module.get<PrismaService>(PrismaService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyConnection', () => {
    it('should return true if SMTP verify succeeds', async () => {
      const result = await service.verifyConnection();
      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should return false if SMTP verify fails', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Connection timeout'));
      const result = await service.verifyConnection();
      expect(result).toBe(false);
    });
  });

  describe('sendMail', () => {
    it('should send email and register notification in database when userId is provided', async () => {
      const result = await service.sendMail({
        to: 'arbitro@test.cl',
        subject: 'Prueba de Asunto',
        html: '<p>Contenido</p>',
        userId: 'user-uuid-1',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-msg-id-123');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'arbitro@test.cl',
          subject: 'Prueba de Asunto',
        }),
      );
      expect(prismaService.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-1',
            title: 'Prueba de Asunto',
            status: 'SENT',
          }),
        }),
      );
    });

    it('should catch error and record failed notification in database', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP down'));

      const result = await service.sendMail({
        to: 'arbitro@test.cl',
        subject: 'Fallo de Correo',
        html: '<p>Error</p>',
        userId: 'user-uuid-2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP down');
      expect(prismaService.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-2',
            status: 'FAILED',
          }),
        }),
      );
    });
  });

  describe('sendNominationAlert', () => {
    it('should format nomination email and call sendMail', async () => {
      const result = await service.sendNominationAlert({
        to: 'ref@sgaob.cl',
        userId: 'ref-uuid',
        refereeName: 'Juan Pérez',
        tournament: 'Liga Nacional U17',
        category: 'Masculino Sub-17',
        homeTeam: 'Club Deportivo Valdivia',
        awayTeam: 'Las Ánimas',
        venue: 'Gimnasio Antonio Azurmendy',
        matchDateTime: new Date('2026-10-15T18:30:00Z'),
        matchRole: 'ARBITRO_PRINCIPAL',
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ref@sgaob.cl',
          subject: expect.stringContaining('Nueva Nominación: ARBITRO_PRINCIPAL'),
          html: expect.stringContaining('Club Deportivo Valdivia vs Las Ánimas'),
        }),
      );
    });
  });

  describe('sendMatchStatusChangeAlert', () => {
    it('should format match change email and call sendMail', async () => {
      const result = await service.sendMatchStatusChangeAlert({
        to: 'ref@sgaob.cl',
        userId: 'ref-uuid',
        refereeName: 'Juan Pérez',
        tournament: 'Liga Nacional U17',
        homeTeam: 'CDV',
        awayTeam: 'Las Ánimas',
        venue: 'Coliseo',
        matchDateTime: new Date('2026-10-15T18:30:00Z'),
        previousStatus: 'SCHEDULED',
        newStatus: 'SUSPENDED',
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ref@sgaob.cl',
          subject: expect.stringContaining('Cambio de Estado de Partido'),
          html: expect.stringContaining('SUSPENDED'),
        }),
      );
    });
  });
});
