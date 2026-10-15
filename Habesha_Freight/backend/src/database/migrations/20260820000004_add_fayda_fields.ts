import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasFaydaNum = await knex.schema.hasColumn('users', 'fayda_number');
  const hasFaydaVer = await knex.schema.hasColumn('users', 'fayda_verified');
  const hasLicStatus = await knex.schema.hasColumn('users', 'license_status');

  await knex.schema.alterTable('users', (table) => {
    if (!hasFaydaNum) table.string('fayda_number', 100).nullable().unique();
    if (!hasFaydaVer) table.boolean('fayda_verified').defaultTo(false);
    if (!hasLicStatus) table.string('license_status', 50).defaultTo('PENDING');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('fayda_number');
    table.dropColumn('fayda_verified');
    table.dropColumn('license_status');
  });
}
