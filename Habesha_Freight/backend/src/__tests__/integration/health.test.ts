import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../../app';
import db from '../../config/db';

// Create app instance for testing
const app = createApp(db);

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const response = await request(app)
      .get('/health');
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.message, 'API is healthy.');
  });

  it('should return health status', async () => {
    const response = await request(app)
      .get('/health');
    
    assert.strictEqual(response.status, 200);
    assert.ok(response.body.data);
    assert.strictEqual(response.body.data.status, 'ok');
    assert.ok(response.body.data.timestamp);
  });
});
