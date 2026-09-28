import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
      });
  });

  describe('Auth Endpoints (e2e)', () => {
    let devToken: string;

    it('/api/auth/me (GET) - Debe rechazar petición sin Bearer token (401)', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Acceso denegado: Token JWT ausente');
        });
    });

    it('/api/auth/dev-token (POST) - Debe generar token de prueba para desarrollo local (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'arbitro.test@sgaob.cl',
          firstName: 'Carlos',
          lastName: 'Árbitro',
          roles: ['ARBITRO'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('arbitro.test@sgaob.cl');
      expect(response.body.user.roles).toContain('ARBITRO');

      devToken = response.body.accessToken;
    });

    it('/api/auth/me (GET) - Debe retornar el perfil al enviar Bearer token válido (200)', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${devToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('arbitro.test@sgaob.cl');
          expect(res.body.roles).toContain('ARBITRO');
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('externalId');
        });
    });
  });

  describe('Users Endpoints (e2e)', () => {
    let adminToken: string;
    let arbitroToken: string;
    let createdUserId: string;
    const testEmail = `test.arbitro.${Date.now()}@sgaob.cl`;

    beforeAll(async () => {
      // Token para Admin Comisión Técnica
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'admin.e2e@sgaob.cl',
          firstName: 'Admin',
          lastName: 'E2E',
          roles: ['ADMIN_COMISION_TECNICA'],
        });
      adminToken = adminRes.body.accessToken;

      // Token para Árbitro regular
      const arbitroRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'arbitro.regular@sgaob.cl',
          firstName: 'Carlos',
          lastName: 'Regular',
          roles: ['ARBITRO'],
        });
      arbitroToken = arbitroRes.body.accessToken;
    });

    it('GET /api/users - Debe rechazar acceso a usuarios sin rol de administración (403)', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .expect(403);
    });

    it('POST /api/users - Debe permitir al Admin registrar un nuevo usuario (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: testEmail,
          firstName: 'Roberto',
          lastName: 'Méndez',
          phone: '+56912345678',
          roles: ['ARBITRO'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testEmail);
      expect(response.body.roles).toContain('ARBITRO');
      createdUserId = response.body.id;
    });

    it('POST /api/users - Debe rechazar correo duplicado con 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: testEmail,
          firstName: 'Roberto',
          lastName: 'Méndez',
        })
        .expect(409);
    });

    it('GET /api/users - Debe listar usuarios con paginación al Admin (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta.page).toBe(1);
    });

    it('GET /api/users/:id - Debe obtener detalle del usuario recién creado (200)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdUserId);
      expect(response.body.email).toBe(testEmail);
    });

    it('PATCH /api/users/:id/roles - Debe permitir asignar simultáneamente ARBITRO y OFICIAL_MESA (200)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${createdUserId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roles: ['ARBITRO', 'OFICIAL_MESA'],
        })
        .expect(200);

      expect(response.body.roles).toContain('ARBITRO');
      expect(response.body.roles).toContain('OFICIAL_MESA');
      expect(response.body.roles).toHaveLength(2);
    });

    it('POST /api/users/consent - Debe registrar consentimiento de datos personales del usuario autenticado (200)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/consent')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .send({
          consent: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('dataConsentDate');
    });
  });

  describe('Availability Endpoints (e2e)', () => {
    let adminToken: string;
    let arbitroToken: string;
    const futureDate = '2035-10-20'; // Fecha futura lejana (Sábado)

    beforeAll(async () => {
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'admin.avail@sgaob.cl',
          firstName: 'Admin',
          lastName: 'Disponibilidad',
          roles: ['ADMIN_COMISION_TECNICA'],
        });
      adminToken = adminRes.body.accessToken;

      const arbitroRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'arbitro.avail@sgaob.cl',
          firstName: 'Mario',
          lastName: 'Árbitro',
          roles: ['ARBITRO'],
        });
      arbitroToken = arbitroRes.body.accessToken;
    });

    it('GET /api/availability/blocks - Debe retornar los bloques horarios parametrizados (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/availability/blocks')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(4);
      expect(response.body[0]).toHaveProperty('startTime');
      expect(response.body[0]).toHaveProperty('endTime');
      expect(response.body[0]).toHaveProperty('blockCode');
    });

    it('POST /api/availability/bulk - Debe rechazar fechas pasadas por plazo vencido (400, RF05)', () => {
      return request(app.getHttpServer())
        .post('/api/availability/bulk')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .send({
          availabilities: [
            { date: '2021-05-10', block: 'FULL' },
          ],
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('El plazo para declarar disponibilidad');
        });
    });

    it('POST /api/availability/bulk - Debe registrar disponibilidad masiva para fechas futuras (200, RF04)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/availability/bulk')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .send({
          availabilities: [
            { date: futureDate, block: 'HORARIO_1' },
          ],
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('date', futureDate);
      expect(response.body[0]).toHaveProperty('block', 'HORARIO_1');
    });

    it('GET /api/availability/my - Debe consultar la disponibilidad declarada por el usuario (200, RF06)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/availability/my?startDate=${futureDate}&endDate=${futureDate}`)
        .set('Authorization', `Bearer ${arbitroToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].block).toBe('HORARIO_1');
    });

    it('GET /api/availability/summary - Debe denegar acceso a árbitros sin rol de administración (403)', () => {
      return request(app.getHttpServer())
        .get(`/api/availability/summary?date=${futureDate}`)
        .set('Authorization', `Bearer ${arbitroToken}`)
        .expect(403);
    });

    it('GET /api/availability/summary - Debe retornar consolidado de personal disponible al Admin (200, RF06)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/availability/summary?date=${futureDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('date', futureDate);
      expect(response.body).toHaveProperty('counts');
      expect(response.body).toHaveProperty('personnel');
      expect(response.body.counts).toHaveProperty('HORARIO_1');
      expect(response.body.personnel.some((p: any) => p.email === 'arbitro.avail@sgaob.cl')).toBe(true);
    });
  });

  describe('Matches & Integrations Endpoints (e2e, RF07-RF10)', () => {
    let adminToken: string;
    let arbitroToken: string;
    let createdMatchId: string;
    const matchDate = '2026-10-25T19:30:00.000Z';

    beforeAll(async () => {
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'admin.matches.e2e@sgaob.cl',
          firstName: 'Admin',
          lastName: 'Partidos',
          roles: ['ADMIN_COMISION_TECNICA'],
        });
      adminToken = adminRes.body.accessToken;

      const arbitroRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'arbitro.matches.e2e@sgaob.cl',
          firstName: 'Árbitro',
          lastName: 'Partidos',
          roles: ['ARBITRO'],
        });
      arbitroToken = arbitroRes.body.accessToken;
    });

    it('POST /api/matches - Debe rechazar creación manual si el usuario no es Comisión Técnica (403)', () => {
      return request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .send({
          tournament: 'Copa Soprole',
          category: 'Sub-18 Varones',
          homeTeam: 'Colegio Los Leones',
          awayTeam: 'Boston College',
          venue: 'Gimnasio San Bernardo',
          matchDateTime: matchDate,
        })
        .expect(403);
    });

    it('POST /api/matches - Comisión Técnica crea partido manual exitosamente (201, 100% Autónomo)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tournament: 'Liga Nacional de Básquetbol 2026',
          category: 'Adulto Varones',
          homeTeam: 'Universidad Católica',
          awayTeam: 'Colegio Los Leones',
          venue: 'Estadio Palestino',
          matchDateTime: matchDate,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.platform).toBe('MANUAL');
      expect(response.body).toHaveProperty('timeBlock');
      expect(response.body.homeTeam).toBe('Universidad Católica');
      expect(response.body.awayTeam).toBe('Colegio Los Leones');

      createdMatchId = response.body.id;
    });

    it('GET /api/matches - Consulta cartelera con filtros y paginación (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/matches?tournament=Liga+Nacional&limit=10')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/matches/:id - Obtiene detalle del partido por ID (200)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/matches/${createdMatchId}`)
        .set('Authorization', `Bearer ${arbitroToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdMatchId);
      expect(response.body.homeTeam).toBe('Universidad Católica');
    });

    it('PATCH /api/matches/:id - Actualiza horario y estado a RESCHEDULED (200, RF10)', async () => {
      const rescheduledDate = '2026-10-26T20:30:00.000Z';
      const response = await request(app.getHttpServer())
        .patch(`/api/matches/${createdMatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDateTime: rescheduledDate,
          venue: 'Gimnasio Club Providencia',
        })
        .expect(200);

      expect(response.body.venue).toBe('Gimnasio Club Providencia');
      expect(response.body.status).toBe('RESCHEDULED');
    });

    it('GET /api/matches/integrations/test - Prueba conectividad con sandbox de sincronización (200, RF07)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/matches/integrations/test?platform=SWISH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('POST /api/matches/sync - Dispara sincronización asíncrona bajo demanda (200, RF09)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/matches/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platform: 'SWISH',
          mock: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('jobId');
    });
  });

  describe('Nominations Endpoints (e2e, RF11-RF16, Anexo A.1, A.2)', () => {
    let adminToken: string;
    let arbitroToken: string;
    let arbitroUserId: string;
    let mesaToken: string;
    let mesaUserId: string;
    let testMatchId: string;
    let createdNominationId: string;
    const matchFutureDate = '2035-11-20T19:30:00.000Z';
    const matchDateOnly = '2035-11-20';

    beforeAll(async () => {
      // 1. Admin Token
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'admin.nom.e2e@sgaob.cl',
          firstName: 'Admin',
          lastName: 'Nominaciones',
          roles: ['ADMIN_COMISION_TECNICA'],
        });
      adminToken = adminRes.body.accessToken;

      // 2. Árbitro Token y disponibilidad
      const arbitroRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'arbitro.nom.e2e@sgaob.cl',
          firstName: 'Esteban',
          lastName: 'Árbitro',
          roles: ['ARBITRO'],
        });
      arbitroToken = arbitroRes.body.accessToken;
      arbitroUserId = arbitroRes.body.user.id;

      // 3. Oficial de Mesa Token
      const mesaRes = await request(app.getHttpServer())
        .post('/api/auth/dev-token')
        .send({
          email: 'mesa.nom.e2e@sgaob.cl',
          firstName: 'Carolina',
          lastName: 'Mesa',
          roles: ['OFICIAL_MESA'],
        });
      mesaToken = mesaRes.body.accessToken;
      mesaUserId = mesaRes.body.user.id;

      // 4. Crear partido de prueba
      const matchRes = await request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tournament: 'Torneo E2E Nominaciones',
          category: 'Adulto Varones',
          homeTeam: 'Club A',
          awayTeam: 'Club B',
          venue: 'Gimnasio Municipal',
          matchDateTime: matchFutureDate,
        });
      testMatchId = matchRes.body.id;

      // 5. Declarar disponibilidad del árbitro (FULL para cubrir cualquier bloque)
      await request(app.getHttpServer())
        .post('/api/availability/bulk')
        .set('Authorization', `Bearer ${arbitroToken}`)
        .send({
          availabilities: [{ date: matchDateOnly, block: 'FULL' }],
        });
    });

    it('GET /api/nominations/available-candidates - Consulta candidatos acreditados para un slot (CU-07)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nominations/available-candidates?matchId=${testMatchId}&matchRole=ARBITRO_PRINCIPAL`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('requiredSystemRole', 'ARBITRO');
      expect(response.body).toHaveProperty('availableCandidates');
      expect(Array.isArray(response.body.availableCandidates)).toBe(true);
      expect(response.body.availableCandidates.some((c: any) => c.id === arbitroUserId)).toBe(true);
    });

    it('POST /api/nominations - Rechaza asignación si el usuario no tiene el rol correspondiente (400, Anexo A.1)', () => {
      // Intentar asignar a la Oficial de Mesa en slot ARBITRO_PRINCIPAL
      return request(app.getHttpServer())
        .post('/api/nominations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: testMatchId,
          userId: mesaUserId,
          matchRole: 'ARBITRO_PRINCIPAL',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Validación de rol fallida');
        });
    });

    it('POST /api/nominations - Comisión Técnica asigna personal disponible a partido (201, RF11, RF14)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nominations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: testMatchId,
          userId: arbitroUserId,
          matchRole: 'ARBITRO_PRINCIPAL',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.matchRole).toBe('ARBITRO_PRINCIPAL');
      expect(response.body.status).toBe('PENDING');
      expect(response.body).toHaveProperty('notifiedAt');

      createdNominationId = response.body.id;
    });

    it('POST /api/nominations - Rechaza slot duplicado en el mismo partido (409 Conflict)', () => {
      return request(app.getHttpServer())
        .post('/api/nominations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: testMatchId,
          userId: arbitroUserId,
          matchRole: 'ARBITRO_PRINCIPAL',
        })
        .expect(409);
    });

    it('GET /api/nominations - Consulta listado de nominaciones con filtros (200, RF16)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nominations?matchId=${testMatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].id).toBe(createdNominationId);
    });

    it('PATCH /api/nominations/:id/respond - Árbitro confirma nominación (200, RF15)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/nominations/${createdNominationId}/respond`)
        .set('Authorization', `Bearer ${arbitroToken}`)
        .send({
          status: 'CONFIRMED',
        })
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
      expect(response.body).toHaveProperty('respondedAt');
    });

    it('DELETE /api/nominations/:id - Comisión Técnica revoca nominación liberando el slot (200)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/nominations/${createdNominationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

