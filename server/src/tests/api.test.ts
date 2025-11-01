import request from 'supertest';
import app from '../index.js';

describe('API Tests', () => {
  describe('GET /api/messages', () => {
    it('should return status 200 and an array of messages', async () => {
      const response = await request(app).get('/api/messages');
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/users (Register)', () => {
    const uniqueName = `testuser_${Date.now()}`;
    const password = 'test1234';

    it('should create a new user with username and password', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: uniqueName, password });
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(uniqueName);
    });

    it('should return 409 when trying to register with existing username', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: uniqueName, password: 'different' });
      
      expect(response.statusCode).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.requiresPassword).toBe(true);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'testuser' });
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when password is too short', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'newuser', password: '123' });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Password too short');
    });
  });

  describe('POST /api/users/login', () => {
    const loginName = `loginuser_${Date.now()}`;
    const loginPassword = 'mypassword123';

    beforeAll(async () => {
      // Create a user first
      await request(app)
        .post('/api/users')
        .send({ name: loginName, password: loginPassword });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ name: loginName, password: loginPassword });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(loginName);
    });

    it('should return 401 with incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ name: loginName, password: 'wrongpassword' });
      
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Invalid password');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ name: 'nonexistentuser', password: 'password' });
      
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/users/check', () => {
    it('should return available true for a new username', async () => {
      const uniqueName = `newuser_${Date.now()}`;
      const response = await request(app)
        .post('/api/users/check')
        .send({ name: uniqueName });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.available).toBe(true);
      expect(response.body.requiresPassword).toBe(false);
    });

    it('should return requiresPassword true for an existing username', async () => {
      const existingName = `existing_${Date.now()}`;
      
      // First create a user
      await request(app)
        .post('/api/users')
        .send({ name: existingName, password: 'password123' });
      
      // Then check if the name is available
      const response = await request(app)
        .post('/api/users/check')
        .send({ name: existingName });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.available).toBe(false);
      expect(response.body.requiresPassword).toBe(true);
    });
  });
});


