import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
});
