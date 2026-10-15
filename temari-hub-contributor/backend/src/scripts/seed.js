const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function fillContributorDefaults(user) {
  let changed = false;

  if (!user.contributorRole) {
    user.contributorRole = 'QUESTION_CREATOR';
    changed = true;
  }

  if (!user.subject) {
    user.subject = 'MATHEMATICS';
    changed = true;
  }

  if (!user.academicVerificationStatus) {
    user.academicVerificationStatus = 'PENDING';
    changed = true;
  }

  if (typeof user.isActive !== 'boolean') {
    user.isActive = true;
    changed = true;
  }

  if (!changed) {
    console.log(`CONTRIBUTOR already exists (${user.email}). Skipping.`);
    return;
  }

  await user.save();
  console.log(`Updated contributor profile fields for ${user.email}.`);
}

async function createIfMissing({ name, email, password, role, contributor }) {
  if (!name || !email || !password) {
    console.log(`Skipping ${role}: set name, email, and password in the environment.`);
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    if (role === 'CONTRIBUTOR') {
      await fillContributorDefaults(existing);
      return;
    }

    console.log(`${role} already exists (${existing.email}). Skipping.`);
    return;
  }

  await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    isActive: true,
    ...contributor,
  });

  console.log(`Created ${role} account for ${normalizedEmail}.`);
}

async function seed() {
  await connectDB();

  await createIfMissing({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'ADMIN',
  });

  await createIfMissing({
    name: process.env.CONTRIBUTOR_NAME,
    email: process.env.CONTRIBUTOR_EMAIL,
    password: process.env.CONTRIBUTOR_PASSWORD,
    role: 'CONTRIBUTOR',
    contributor: {
      contributorRole: 'QUESTION_CREATOR',
      subject: 'MATHEMATICS',
      academicVerificationStatus: 'PENDING',
    },
  });
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
