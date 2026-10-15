import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasProfilePhoto = await knex.schema.hasColumn('users', 'profile_photo_url');
  const hasLicenseNumber = await knex.schema.hasColumn('users', 'license_number');
  const hasLicensePhoto = await knex.schema.hasColumn('users', 'license_photo_url');
  const hasSettings = await knex.schema.hasColumn('users', 'settings');
  const hasCompanyLogo = await knex.schema.hasColumn('users', 'company_logo_url');
  const hasCompanyReg = await knex.schema.hasColumn('users', 'company_registration_number');
  const hasCompanyDesc = await knex.schema.hasColumn('users', 'company_description');

  await knex.schema.alterTable('users', (table) => {
    if (!hasProfilePhoto) table.string('profile_photo_url', 500).nullable();
    if (!hasLicenseNumber) table.string('license_number', 100).nullable();
    if (!hasLicensePhoto) table.string('license_photo_url', 500).nullable();
    if (!hasSettings) table.jsonb('settings').nullable();
    if (!hasCompanyLogo) table.string('company_logo_url', 500).nullable();
    if (!hasCompanyReg) table.string('company_registration_number', 100).nullable();
    if (!hasCompanyDesc) table.text('company_description').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('profile_photo_url');
    table.dropColumn('license_number');
    table.dropColumn('license_photo_url');
    table.dropColumn('settings');
    table.dropColumn('company_logo_url');
    table.dropColumn('company_registration_number');
    table.dropColumn('company_description');
  });
}
