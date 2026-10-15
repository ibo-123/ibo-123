import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('vehicles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('driver_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('plate_number', 50).notNullable().unique();
    table
      .enum('vehicle_type', ['ISUZU_DRY', 'SINO_TRUCK', 'TRAILER', 'VAN'])
      .notNullable();
    table.decimal('capacity_tons', 5, 2).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('vehicles');
}
