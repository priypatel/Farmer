import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app.js';
import pool from '../../../database/pool.js';
import config from '../../../config/env.js';

describe('Auth Routes', () => {
  beforeEach(async () => {
    // Only delete test users (emails ending in @test.com) — never touch real data
    await pool.query(
      `DELETE f FROM farmers f
       JOIN users u ON f.user_id = u.id
       WHERE u.email LIKE '%@test.com'`
    );
    await pool.query(`DELETE FROM users WHERE email LIKE '%@test.com'`);
  });

  afterAll(async () => {
    await pool.end();
  });

  const farmerPayload = {
    firstName: 'Test Farmer',
    phone: '9876543210',
    email: 'farmer@test.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'farmer',
  };

  const adminPayload = {
    firstName: 'Test Admin',
    phone: '9876543211',
    email: 'admin@test.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'admin',
  };

  describe('POST /auth/register', () => {
    it('should register a farmer with status=pending and return 201 + token', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(farmerPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.role).toBe('farmer');

      // Verify farmer record was created with pending status
      const [farmers] = await pool.query(
        'SELECT * FROM farmers WHERE user_id = ?',
        [res.body.data.user.id]
      );
      expect(farmers).toHaveLength(1);
      expect(farmers[0].status).toBe('pending');
    });

    it('should register an admin without creating a farmer row', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(adminPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('admin');

      // Verify no farmer record was created
      const [farmers] = await pool.query(
        'SELECT * FROM farmers WHERE user_id = ?',
        [res.body.data.user.id]
      );
      expect(farmers).toHaveLength(0);
    });

    it('should return 409 on duplicate email', async () => {
      await request(app).post('/auth/register').send(farmerPayload);

      const res = await request(app)
        .post('/auth/register')
        .send(farmerPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should return 400 with validation errors for missing fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/auth/register').send(farmerPayload);
    });

    it('should return 200 + token on valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: farmerPayload.email, password: farmerPayload.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(farmerPayload.email);
    });

    it('should return 401 on wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: farmerPayload.email, password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/auth/register').send(farmerPayload);
      token = res.body.data.token;
    });

    it('should return 200 + user data with valid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('email', farmerPayload.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 1, role: 'farmer', email: 'test@test.com' },
        config.jwt.secret,
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });
});
