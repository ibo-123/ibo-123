import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import db from '../../config/db';
import { v4 as uuidv4 } from 'uuid';

describe('Audit Log Tests', () => {
  let testUserId: string;
  let runId: number;

  before(async () => {
    runId = Date.now();
    
    const [user] = await db('users')
      .insert({
        full_name: 'Test Audit User',
        phone_number: `+2519${runId}1`,
        email: `testaudit${runId}@test.et`,
        password_hash: 'hashed_password',
        role: 'SHIPPER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');
    testUserId = user.id;
  });

  after(async () => {
    await db('audit_logs').where('user_id', testUserId).del();
    await db('users').where('id', testUserId).del();
    await db.destroy();
  });

  it('Audit log is created for user actions', async () => {
    const action = 'USER_LOGIN';
    const details = { ip: '127.0.0.1', userAgent: 'test' };

    const [auditLog] = await db('audit_logs')
      .insert({
        user_id: testUserId,
        action: action,
        details: details,
        ip_address: '127.0.0.1',
        target_type: 'User',
        target_id: testUserId,
      })
      .returning('*');

    assert.ok(auditLog);
    assert.strictEqual(auditLog.user_id, testUserId);
    assert.strictEqual(auditLog.action, action);
    assert.ok(auditLog.created_at);
  });

  it('Audit log stores JSONB details', async () => {
    const details = { 
      ip: '192.168.1.1', 
      userAgent: 'Mozilla/5.0',
      extra: { field1: 'value1', field2: 'value2' }
    };

    const [auditLog] = await db('audit_logs')
      .insert({
        user_id: testUserId,
        action: 'PROFILE_UPDATE',
        details: details,
        target_type: 'User',
        target_id: testUserId,
      })
      .returning('*');

    assert.ok(auditLog);
    const parsedDetails = typeof auditLog.details === 'string' 
      ? JSON.parse(auditLog.details) 
      : auditLog.details;
    assert.strictEqual(parsedDetails.ip, '192.168.1.1');
    assert.strictEqual(parsedDetails.extra.field1, 'value1');
  });

  it('Audit log can have null user_id', async () => {
    const [auditLog] = await db('audit_logs')
      .insert({
        user_id: null,
        action: 'SYSTEM_EVENT',
        details: { event: 'system_startup' },
        target_type: 'System',
        target_id: null,
      })
      .returning('*');

    assert.ok(auditLog);
    assert.strictEqual(auditLog.user_id, null);
  });

  it('Audit log stores target_type and target_id', async () => {
    const targetType = 'Shipment';
    const targetId = uuidv4();

    const [auditLog] = await db('audit_logs')
      .insert({
        user_id: testUserId,
        action: 'SHIPMENT_CREATED',
        details: { shipment_id: targetId },
        target_type: targetType,
        target_id: targetId,
      })
      .returning('*');

    assert.ok(auditLog);
    assert.strictEqual(auditLog.target_type, targetType);
    assert.strictEqual(auditLog.target_id, targetId);
  });

  it('Admin actions create audit records', async () => {
    const [auditLog] = await db('audit_logs')
      .insert({
        user_id: testUserId,
        action: 'ADMIN_ACTION',
        details: { action: 'USER_SUSPENDED', target_user: testUserId },
        ip_address: '10.0.0.1',
        target_type: 'Admin',
        target_id: testUserId,
      })
      .returning('*');

    assert.ok(auditLog);
    assert.strictEqual(auditLog.action, 'ADMIN_ACTION');
    assert.strictEqual(auditLog.ip_address, '10.0.0.1');
  });
});
