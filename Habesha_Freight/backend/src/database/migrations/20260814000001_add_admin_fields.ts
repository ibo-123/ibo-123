import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED']).nullable().defaultTo('ACTIVE');
    table.enum('kyc_status', ['PENDING', 'APPROVED', 'REJECTED']).nullable().defaultTo('PENDING');
    table.string('kyc_rejection_reason', 255).nullable();
    table.uuid('kyc_reviewed_by').nullable();
    table.timestamp('kyc_reviewed_at').nullable();
    table.timestamp('deleted_at').nullable();
  });

  await knex.schema.alterTable('vehicles', (table) => {
    table.enum('verification_status', ['PENDING', 'VERIFIED', 'REJECTED']).nullable().defaultTo('PENDING');
    table.string('verification_reason', 255).nullable();
    table.uuid('verified_by').nullable();
    table.timestamp('verified_at').nullable();
    table.jsonb('documents').nullable();
  });

  await knex.schema.alterTable('audit_logs', (table) => {
    table.string('target_type', 100).nullable();
    table.uuid('target_id').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('audit_logs', (table) => {
    table.dropColumn('target_type');
    table.dropColumn('target_id');
  });

  await knex.schema.alterTable('vehicles', (table) => {
    table.dropColumn('verification_status');
    table.dropColumn('verification_reason');
    table.dropColumn('verified_by');
    table.dropColumn('verified_at');
    table.dropColumn('documents');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('status');
    table.dropColumn('kyc_status');
    table.dropColumn('kyc_rejection_reason');
    table.dropColumn('kyc_reviewed_by');
    table.dropColumn('kyc_reviewed_at');
    table.dropColumn('deleted_at');
  });
}
