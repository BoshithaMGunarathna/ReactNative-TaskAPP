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
});
