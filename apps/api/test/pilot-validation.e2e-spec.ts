import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SGAOB — Simulación Piloto de Ciclo Completo E2E (PR15: RF01 a RF20, CU-01 a CU-10)', () => {
  let app: INestApplication;

  // Credenciales y Tokens de prueba para los 4 actores del piloto
  let adminToken: string;
  let adminId: string;

  let arbitro1Token: string;
  let arbitro1Id: string;

  let arbitro2Token: string;
  let arbitro2Id: string;

  let mesaToken: string;
  let mesaId: string;

  // Variables de entidades creadas durante el ciclo
  const pilotMatchDate = '2035-12-01T19:30:00.000Z';
  const pilotDateOnly = '2035-12-01';
  let pilotMatchId: string;
  let nomArbitro1Id: string;
  let nomArbitro2Id: string;
  let nomMesaId: string;
  let pilotDocId: string;
  let pilotCredId: string;
  let pilotComunId: string;

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
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    // Generar tokens y usuarios simulados para cada rol del ecosistema
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/dev-token')
      .send({
        email: 'admin.pilot@sgaob.cl',
        firstName: 'Gonzalo',
        lastName: 'Comisión',
        roles: ['ADMIN_COMISION_TECNICA'],
      });
    adminToken = adminRes.body.accessToken;
    adminId = adminRes.body.user.id;

    const arb1Res = await request(app.getHttpServer())
      .post('/api/auth/dev-token')
      .send({
        email: 'arbitro1.pilot@sgaob.cl',
        firstName: 'Claudio',
        lastName: 'Vargas',
        roles: ['ARBITRO'],
      });
    arbitro1Token = arb1Res.body.accessToken;
    arbitro1Id = arb1Res.body.user.id;

    const arb2Res = await request(app.getHttpServer())
      .post('/api/auth/dev-token')
      .send({
        email: 'arbitro2.pilot@sgaob.cl',
        firstName: 'Felipe',
        lastName: 'Soto',
        roles: ['ARBITRO'],
      });
    arbitro2Token = arb2Res.body.accessToken;
    arbitro2Id = arb2Res.body.user.id;

    const mesaRes = await request(app.getHttpServer())
      .post('/api/auth/dev-token')
      .send({
        email: 'mesa.pilot@sgaob.cl',
        firstName: 'Patricia',
        lastName: 'Araya',
        roles: ['OFICIAL_MESA'],
      });
    mesaToken = mesaRes.body.accessToken;
    mesaId = mesaRes.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // FASE 1: AUTENTICACIÓN, CONSENTIMIENTO Y USUARIOS (CU-01, CU-02, RF01-RF03)
  // =========================================================================
  describe('Fase 1: Autenticación, Consentimiento y Roles (CU-01, CU-02)', () => {
    it('CU-01 / RF01: Cada usuario registra consentimiento de tratamiento de datos personales', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/api/users/consent')
        .set('Authorization', `Bearer ${arbitro1Token}`)
        .send({ consent: true })
        .expect(200);

      expect(res1.body.success).toBe(true);
      expect(res1.body).toHaveProperty('dataConsentDate');

      const res2 = await request(app.getHttpServer())
        .post('/api/users/consent')
        .set('Authorization', `Bearer ${mesaToken}`)
        .send({ consent: true })
        .expect(200);

      expect(res2.body.success).toBe(true);
    });

    it('CU-02 / RF02: Comisión Técnica consulta perfiles y estado de usuarios', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.meta.total).toBeGreaterThanOrEqual(4);
    });
  });

  // =========================================================================
  // FASE 2: DISPONIBILIDAD HORARIA Y CONSOLIDADO (CU-03, CU-04, RF04-RF06)
  // =========================================================================
  describe('Fase 2: Declaración y Reporte de Disponibilidad (CU-03, CU-04)', () => {
    it('RF05 / Anexo A.4: Consulta de bloques parametrizados según tipo de día', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/availability/blocks')
        .set('Authorization', `Bearer ${arbitro1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(4);
    });

    it('CU-03 / RF04: Árbitro 1 declara disponibilidad FULL para la fecha piloto', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/availability/bulk')
        .set('Authorization', `Bearer ${arbitro1Token}`)
        .send({
          availabilities: [
            {
              date: pilotDateOnly,
              block: 'FULL',
            },
          ],
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('CU-03 / RF04: Árbitro 2 declara disponibilidad HORARIO_2 para la fecha piloto', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/availability/bulk')
        .set('Authorization', `Bearer ${arbitro2Token}`)
        .send({
          availabilities: [
            {
              date: pilotDateOnly,
              block: 'HORARIO_2',
            },
          ],
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('CU-03 / RF04: Oficial de Mesa declara disponibilidad HORARIO_2 para la fecha piloto', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/availability/bulk')
        .set('Authorization', `Bearer ${mesaToken}`)
        .send({
          availabilities: [
            {
              date: pilotDateOnly,
              block: 'HORARIO_2',
            },
          ],
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('CU-04 / RF06: Comisión Técnica visualiza reporte consolidado de disponibilidad', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/availability/summary?date=${pilotDateOnly}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('personnel');
      expect(response.body.totalAvailable).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // FASE 3: CARTELERA DE PARTIDOS Y SINCRONIZACIÓN (CU-05, CU-06, RF07-RF10)
  // =========================================================================
  describe('Fase 3: Cartelera de Partidos e Integración (CU-05, CU-06)', () => {
    it('CU-05 / RF07: Conectividad probada exitosamente con proveedor Sandbox', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/matches/integrations/test?platform=SWISH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Conexión exitosa');
    });

    it('CU-06 / RF08: Comisión Técnica crea partido oficial del Torneo Metropolitano', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tournament: 'Torneo Metropolitano Clausura 2026',
          category: 'Honor Varones',
          homeTeam: 'Universidad de Chile',
          awayTeam: 'Club Puente Alto',
          venue: 'Gimnasio CEO Ñuñoa - Cancha 1',
          matchDateTime: pilotMatchDate,
          timeBlock: 'HORARIO_2',
          platform: 'MANUAL',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.homeTeam).toBe('Universidad de Chile');
      expect(response.body.timeBlock).toBe('HORARIO_2');
      pilotMatchId = response.body.id;
    });

    it('CU-06 / RF09: Ejecución de sincronización bajo demanda sin interrupciones', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/matches/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ platform: 'SWISH' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // FASE 4: CRUCE DE DISPONIBILIDAD, NOMINACIONES Y CONFIRMACIÓN (CU-07, CU-08)
  // =========================================================================
  describe('Fase 4: Designaciones Técnicas y Cruce Inteligente (CU-07, CU-08, RF11-RF16)', () => {
    it('CU-07 / RF12 / Anexo A.1: Cruce de candidatos para slot ARBITRO_PRINCIPAL', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nominations/available-candidates?matchId=${pilotMatchId}&matchRole=ARBITRO_PRINCIPAL`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.requestedSlot).toBe('ARBITRO_PRINCIPAL');
      expect(response.body.requiredSystemRole).toBe('ARBITRO');

      // Árbitro 1 (FULL) y Árbitro 2 (HORARIO_2) deben aparecer como disponibles
      const available = response.body.availableCandidates;
      expect(available.some((c: any) => c.id === arbitro1Id)).toBe(true);
      expect(available.some((c: any) => c.id === arbitro2Id)).toBe(true);

      // Oficial de Mesa NUNCA debe estar en candidatos para Árbitro (Separación estricta Anexo A.1)
      expect(available.some((c: any) => c.id === mesaId)).toBe(false);
    });

    it('CU-07 / RF11 / RF14: Designación de Árbitro Principal y despacho de alerta', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nominations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: pilotMatchId,
          userId: arbitro1Id,
          matchRole: 'ARBITRO_PRINCIPAL',
        })
        .expect(201);

      expect(response.body.matchRole).toBe('ARBITRO_PRINCIPAL');
      expect(response.body.status).toBe('PENDING');
      nomArbitro1Id = response.body.id;
    });

    it('CU-07 / RF11: Designación de Árbitro 1 (Slot secundario)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nominations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: pilotMatchId,
          userId: arbitro2Id,
          matchRole: 'ARBITRO_1',
        })
        .expect(201);

      expect(response.body.matchRole).toBe('ARBITRO_1');
      nomArbitro2Id = response.body.id;
    });

    it('CU-07 / RF11: Designación de Oficial de Mesa 1 (Separación de roles)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nominations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: pilotMatchId,
          userId: mesaId,
          matchRole: 'OFICIAL_1',
        })
        .expect(201);

      expect(response.body.matchRole).toBe('OFICIAL_1');
      nomMesaId = response.body.id;
    });

    it('CU-08 / RF15: Árbitro 1 confirma formalmente su asignación', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/nominations/${nomArbitro1Id}/respond`)
        .set('Authorization', `Bearer ${arbitro1Token}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
      expect(response.body).toHaveProperty('respondedAt');
    });

    it('CU-08 / RF15: Árbitro 2 rechaza su designación indicando motivo justificado', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/nominations/${nomArbitro2Id}/respond`)
        .set('Authorization', `Bearer ${arbitro2Token}`)
        .send({
          status: 'REJECTED',
          rejectionReason: 'Inconveniente de salud certificado médicamente',
        })
        .expect(200);

      expect(response.body.status).toBe('REJECTED');
      expect(response.body.rejectionReason).toContain('Inconveniente de salud');
    });

    it('RF16: Consulta de grilla de nominaciones para visualización y trazabilidad', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/nominations?matchId=${pilotMatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.meta.total).toBe(3);
      const noms = response.body.data;
      expect(noms.some((n: any) => n.status === 'CONFIRMED')).toBe(true);
      expect(noms.some((n: any) => n.status === 'REJECTED')).toBe(true);
    });
  });

  // =========================================================================
  // FASE 5: REPROGRAMACIÓN OPERATIVA Y ALERTA (RF10)
  // =========================================================================
  describe('Fase 5: Actualización Operativa y Alertas (RF10)', () => {
    it('RF10: Reprogramación de partido actualiza estado y notifica al personal', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/matches/${pilotMatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESCHEDULED',
          venue: 'Gimnasio Polideportivo Sergio Livingstone',
        })
        .expect(200);

      expect(response.body.status).toBe('RESCHEDULED');
      expect(response.body.venue).toContain('Sergio Livingstone');
    });
  });

  // =========================================================================
  // FASE 6: RECURSOS, CREDENCIALES SEGURAS Y EXPORTACIÓN A EXCEL (CU-09, CU-10)
  // =========================================================================
  describe('Fase 6: Material Oficial, Credenciales y Exportación a Excel (RF17-RF20)', () => {
    it('CU-10 / RF19: Comisión Técnica publica comunicado oficial de reprogramación', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'COMUNICADO',
          title: 'Aviso Urgente: Cambio de Gimnasio Final Torneo Metropolitano',
          content: 'Se traslada el encuentro al Polideportivo Sergio Livingstone por mantención de piso.',
          visibility: 'AUTHENTICATED',
        })
        .expect(201);

      expect(response.body.type).toBe('COMUNICADO');
      pilotComunId = response.body.id;
    });

    it('CU-10 / RF17: Publicación de protocolo y reglamento oficial', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'DOCUMENTO',
          title: 'Reglamento de Fases Finales Metropolitano 2026',
          fileUrl: 'https://docs.sgaob.cl/fases-finales.pdf',
          visibility: 'AUTHENTICATED',
        })
        .expect(201);

      expect(response.body.type).toBe('DOCUMENTO');
      pilotDocId = response.body.id;
    });

    it('CU-10 / RF18 / Anexo A.5: Almacenamiento seguro de credencial forzando visibilidad ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'CREDENCIAL',
          title: 'API Key Swish Live Production',
          content: 'SWISH_LIVE_KEY_8877665544',
          visibility: 'PUBLIC', // Intento del cliente
        })
        .expect(201);

      expect(response.body.type).toBe('CREDENCIAL');
      expect(response.body.visibility).toBe('ADMIN'); // Forzado estricto Anexo A.5
      pilotCredId = response.body.id;
    });

    it('RF18 / Seguridad: Árbitro 1 NO puede ver credenciales de Comisión Técnica', async () => {
      // 1. En el listado no aparece
      const listRes = await request(app.getHttpServer())
        .get('/api/resources')
        .set('Authorization', `Bearer ${arbitro1Token}`)
        .expect(200);

      expect(listRes.body.data.some((r: any) => r.id === pilotCredId)).toBe(false);

      // 2. Acceso directo por ID arroja 403 Forbidden
      await request(app.getHttpServer())
        .get(`/api/resources/${pilotCredId}`)
        .set('Authorization', `Bearer ${arbitro1Token}`)
        .expect(403);
    });

    it('CU-09 / RF20: Comisión Técnica exporta la Grilla Oficial de Asignaciones en CSV para Excel', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/resources/export/nominations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');

      // Validar UTF-8 BOM
      expect(response.text.startsWith('\uFEFF')).toBe(true);

      // Validar datos del partido y del personal
      expect(response.text).toContain('Universidad de Chile');
      expect(response.text).toContain('Club Puente Alto');
      expect(response.text).toContain('Claudio Vargas');
      expect(response.text).toContain('ARBITRO_PRINCIPAL');
      expect(response.text).toContain('CONFIRMED');
      expect(response.text).toContain('Felipe Soto');
      expect(response.text).toContain('REJECTED');
      expect(response.text).toContain('Inconveniente de salud');
    });

    it('Limpieza y auditoría del piloto', async () => {
      await request(app.getHttpServer())
        .delete(`/api/resources/${pilotDocId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/resources/${pilotCredId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/resources/${pilotComunId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/nominations/${nomArbitro1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/nominations/${nomArbitro2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/nominations/${nomMesaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/matches/${pilotMatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
