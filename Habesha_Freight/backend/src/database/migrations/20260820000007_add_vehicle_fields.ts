import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasDriverId = await knex.schema.hasColumn('vehicles', 'assigned_driver_id');
  await knex.schema.alterTable('vehicles', (table) => {
    if (!hasDriverId) {
      table.uuid('assigned_driver_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('vehicles', (table) => {
    table.dropColumn('assigned_driver_id');
  });
}
