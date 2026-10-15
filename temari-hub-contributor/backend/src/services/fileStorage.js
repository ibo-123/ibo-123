const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { ALLOWED_FILE_TYPES } = require('../constants/templates');

function uploadDirectory() {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(__dirname, '../../uploads');
}

function maxFileSize() {
  const configured = Number(process.env.MAX_FILE_SIZE);
  return Number.isFinite(configured) && configured > 0 ? configured : 5 * 1024 * 1024;
}

function maxFiles() {
  const configured = Number(process.env.MAX_FILES);
  return Number.isInteger(configured) && configured > 0 ? configured : 10;
}

function extensionOf(filename) {
  const ext = path.extname(String(filename || '')).toLowerCase();
  return ext;
}

function isAllowedFile(mimeType, originalName) {
  const extensions = ALLOWED_FILE_TYPES[mimeType];
  if (!extensions) {
    return false;
  }

  return extensions.includes(extensionOf(originalName));
}

function extensionFor(mimeType, originalName) {
  const extensions = ALLOWED_FILE_TYPES[mimeType] || [];
  const fromName = extensionOf(originalName);
  return extensions.includes(fromName) ? fromName : extensions[0];
}

// Storage keys are generated here. Caller-supplied names are never used as paths.
async function saveFile(buffer, { mimeType, originalName }) {
  const storageKey = `${crypto.randomUUID()}${extensionFor(mimeType, originalName)}`;
  const directory = uploadDirectory();
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, storageKey), buffer);
  return storageKey;
}

function resolveKey(storageKey) {
  if (typeof storageKey !== 'string' || !/^[0-9a-f-]{36}\.[a-z0-9]+$/.test(storageKey)) {
    return null;
  }

  const directory = uploadDirectory();
  const absolute = path.resolve(directory, storageKey);
  if (!absolute.startsWith(`${directory}${path.sep}`)) {
    return null;
  }

  return absolute;
}

async function deleteFile(storageKey) {
  const absolute = resolveKey(storageKey);
  if (!absolute) {
    return;
  }

  await fs.rm(absolute, { force: true });
}

module.exports = {
  uploadDirectory,
  maxFileSize,
  maxFiles,
  isAllowedFile,
  saveFile,
  resolveKey,
  deleteFile,
};
