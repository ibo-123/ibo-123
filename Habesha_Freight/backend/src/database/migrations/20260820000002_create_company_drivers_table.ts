import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_drivers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('company_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('driver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED']).defaultTo('ACTIVE');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.unique(['company_id', 'driver_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_drivers');
}
