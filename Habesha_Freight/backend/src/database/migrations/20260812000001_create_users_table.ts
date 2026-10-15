import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name', 255).notNullable();
    table.string('phone_number', 50).notNullable().unique();
    table.string('email', 255).nullable().unique();
    table.string('password_hash', 255).notNullable();
    table
      .enum('role', ['SHIPPER', 'DRIVER', 'FLEET_OWNER', 'ADMIN'])
      .notNullable()
      .defaultTo('SHIPPER');
    table.boolean('is_verified').notNullable().defaultTo(false);
    table.string('otp_code', 10).nullable();
    table.timestamp('otp_expires_at').nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}
