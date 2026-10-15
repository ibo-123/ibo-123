import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ratings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('shipment_id').nullable().references('id').inTable('shipments').onDelete('CASCADE');
    table.uuid('reviewer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('reviewee_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable();
    table.text('comment').nullable();
    table.string('target_type', 50).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Add indexes
  await knex.schema.alterTable('ratings', (table) => {
    table.index(['reviewee_id', 'target_type']);
    table.index(['reviewer_id']);
    table.index(['shipment_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ratings');
}
