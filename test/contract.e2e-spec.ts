import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { createValidationPipe } from './../src/common/validation.pipe.js';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const BASE = '/api/v1';
const CREDENTIALS = { email: 'marcos@finap.app', password: 'secret123' };

describe('Contrato de la API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const login = await request(app.getHttpServer()).post(`${BASE}/auth/login`).send(CREDENTIALS);
    token = login.body.token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

  it('expone /health sin autenticación', async () => {
    await request(app.getHttpServer()).get(`${BASE}/health`).expect(200).expect({ status: 'ok' });
  });

  it('rechaza rutas protegidas sin token', async () => {
    await request(app.getHttpServer()).get(`${BASE}/me`).expect(401);
  });

  it('rechaza credenciales inválidas con 401', async () => {
    await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: CREDENTIALS.email, password: 'incorrecta' })
      .expect(401);
  });

  it('devuelve la sesión y el perfil', async () => {
    const session = await request(app.getHttpServer())
      .get(`${BASE}/auth/session`)
      .set(auth())
      .expect(200);
    expect(session.body.user.email).toBe(CREDENTIALS.email);

    const me = await request(app.getHttpServer()).get(`${BASE}/me`).set(auth()).expect(200);
    expect(me.body).toMatchObject({ id: 'u_1', currency: 'USD' });
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('lista cuentas del usuario', async () => {
    const res = await request(app.getHttpServer()).get(`${BASE}/accounts`).set(auth()).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('balance');
  });

  it('lista movimientos paginados y filtrados', async () => {
    const res = await request(app.getHttpServer())
      .get(`${BASE}/transactions?type=expense&page=1&pageSize=2&sort=date&order=desc`)
      .set(auth())
      .expect(200);
    expect(res.body).toMatchObject({ page: 1, pageSize: 2 });
    expect(res.body.items.length).toBeLessThanOrEqual(2);
    expect(res.body.items.every((item: { type: string }) => item.type === 'expense')).toBe(true);
  });

  it('crea, actualiza y elimina un movimiento', async () => {
    const created = await request(app.getHttpServer())
      .post(`${BASE}/transactions`)
      .set(auth())
      .send({
        type: 'expense',
        amount: 12.34,
        categoryId: 'c_alim',
        date: '2025-05-15',
        note: 'e2e',
      })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch(`${BASE}/transactions/${created.body.id}`)
      .set(auth())
      .send({ amount: 20 })
      .expect(200);
    expect(updated.body.amount).toBe(20);

    await request(app.getHttpServer())
      .delete(`${BASE}/transactions/${created.body.id}`)
      .set(auth())
      .expect(204);

    await request(app.getHttpServer())
      .patch(`${BASE}/transactions/${created.body.id}`)
      .set(auth())
      .send({ amount: 1 })
      .expect(404);
  });

  it('valida la entrada con 422', async () => {
    const res = await request(app.getHttpServer())
      .post(`${BASE}/transactions`)
      .set(auth())
      .send({ type: 'expense', amount: -1, categoryId: 'c_alim', date: 'no' })
      .expect(422);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('gestiona categorías, incluidos duplicados y dependencias', async () => {
    const name = `e2e-${randomUUID()}`;
    const created = await request(app.getHttpServer())
      .post(`${BASE}/categories`)
      .set(auth())
      .send({ name, color: '#123ABC', icon: 'tag' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${BASE}/categories`)
      .set(auth())
      .send({ name, color: '#123ABC', icon: 'tag' })
      .expect(409);

    await request(app.getHttpServer())
      .post(`${BASE}/categories`)
      .set(auth())
      .send({ name: `bad-${randomUUID()}`, color: 'no-hex', icon: 'tag' })
      .expect(422);

    await request(app.getHttpServer())
      .delete(`${BASE}/categories/${created.body.id}`)
      .set(auth())
      .expect(204);
  });

  it('gestiona presupuestos y calcula spent', async () => {
    const created = await request(app.getHttpServer())
      .post(`${BASE}/budgets`)
      .set(auth())
      .send({ categoryId: 'c_alim', month: '2025-06', limit: 500 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${BASE}/budgets`)
      .set(auth())
      .send({ categoryId: 'c_alim', month: '2025-06', limit: 500 })
      .expect(409);

    const list = await request(app.getHttpServer())
      .get(`${BASE}/budgets?month=2025-06`)
      .set(auth())
      .expect(200);
    const budget = (list.body as Array<{ id: string; spent: number }>).find(
      (item) => item.id === created.body.id,
    );
    expect(budget?.spent).toBe(0);

    await request(app.getHttpServer())
      .patch(`${BASE}/budgets/${created.body.id}`)
      .set(auth())
      .send({ limit: 600 })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`${BASE}/budgets/${created.body.id}`)
      .set(auth())
      .expect(204);

    await request(app.getHttpServer())
      .get(`${BASE}/budgets?month=invalido`)
      .set(auth())
      .expect(422);
  });

  it('gestiona deudas y pagos', async () => {
    const created = await request(app.getHttpServer())
      .post(`${BASE}/debts`)
      .set(auth())
      .send({ name: `deuda-${randomUUID()}`, total: 100, paid: 10 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${BASE}/debts`)
      .set(auth())
      .send({ name: `mala-${randomUUID()}`, total: 100, paid: 200 })
      .expect(422);

    const paid = await request(app.getHttpServer())
      .post(`${BASE}/debts/${created.body.id}/payments`)
      .set(auth())
      .send({ amount: 50 })
      .expect(200);
    expect(paid.body.paid).toBe(60);

    await request(app.getHttpServer())
      .post(`${BASE}/debts/${created.body.id}/payments`)
      .set(auth())
      .send({ amount: 1000 })
      .expect(422);

    await request(app.getHttpServer())
      .delete(`${BASE}/debts/${created.body.id}`)
      .set(auth())
      .expect(204);
  });

  it('devuelve el dashboard del mes', async () => {
    const res = await request(app.getHttpServer())
      .get(`${BASE}/dashboard?month=2025-05`)
      .set(auth())
      .expect(200);
    expect(res.body).toHaveProperty('balance');
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(Array.isArray(res.body.recentTransactions)).toBe(true);
  });

  it('devuelve análisis (summary, by-category, evolution y trend sin base)', async () => {
    const summary = await request(app.getHttpServer())
      .get(`${BASE}/analysis/summary?from=2025-05-01&to=2025-05-31`)
      .set(auth())
      .expect(200);
    expect(summary.body).toHaveProperty('income');
    expect(summary.body).toHaveProperty('trend');

    const noBase = await request(app.getHttpServer())
      .get(`${BASE}/analysis/summary?from=2099-01-01&to=2099-01-31`)
      .set(auth())
      .expect(200);
    expect(noBase.body.trend).toBe(0);

    await request(app.getHttpServer())
      .get(`${BASE}/analysis/by-category?from=2025-05-01&to=2025-05-31&type=expense`)
      .set(auth())
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });

    const evolution = await request(app.getHttpServer())
      .get(`${BASE}/analysis/evolution?from=2025-01-01&to=2025-05-31&interval=month`)
      .set(auth())
      .expect(200);
    expect(Array.isArray(evolution.body.points)).toBe(true);

    await request(app.getHttpServer())
      .get(`${BASE}/analysis/evolution?from=2025-01-01&to=2025-05-31&interval=año`)
      .set(auth())
      .expect(422);
  });

  it('responde al asistente y valida la pregunta', async () => {
    const res = await request(app.getHttpServer())
      .post(`${BASE}/assistant/ask`)
      .set(auth())
      .send({ question: '¿En qué gasté más este mes?' })
      .expect(200);
    expect(typeof res.body.answer).toBe('string');
    expect(res.body.answer.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(`${BASE}/assistant/ask`)
      .set(auth())
      .send({ question: '' })
      .expect(422);
  });

  it('aísla los datos por usuario', async () => {
    const other = await prisma.user.create({
      data: {
        name: 'Otro Usuario',
        email: `otro-${randomUUID()}@finap.app`,
        passwordHash: 'x',
        currency: 'USD',
      },
    });
    const otherCategory = await prisma.category.create({
      data: { userId: other.id, name: `privada-${randomUUID()}`, color: '#000000', icon: 'tag' },
    });
    const otherTransaction = await prisma.transaction.create({
      data: {
        userId: other.id,
        type: 'expense',
        amount: 5,
        categoryId: otherCategory.id,
        date: new Date('2025-05-15'),
      },
    });

    try {
      await request(app.getHttpServer())
        .patch(`${BASE}/transactions/${otherTransaction.id}`)
        .set(auth())
        .send({ amount: 1 })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`${BASE}/transactions/${otherTransaction.id}`)
        .set(auth())
        .expect(404);
    } finally {
      await prisma.user.delete({ where: { id: other.id } });
    }
  });
});
