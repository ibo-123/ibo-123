const Template = require('../models/Template');
const AppError = require('../utils/AppError');
const { SUBJECTS } = require('../constants/contributors');
const { TEMPLATE_TYPES, FIELD_TYPES } = require('../constants/templates');

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;
const FIELD_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/;

function assertValidId(id) {
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    throw new AppError(400, 'Invalid template ID');
  }
}

function snapshotTemplate(template) {
  return {
    templateId: template._id,
    name: template.name,
    version: template.version,
    type: template.type,
    subject: template.subject,
    fields: [...template.fields]
      .map((field) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order,
        placeholder: field.placeholder || '',
        description: field.description || '',
        options: [...(field.options || [])],
      }))
      .sort((left, right) => left.order - right.order),
  };
}

function toTemplate(template) {
  const creator = template.createdBy;

  return {
    id: template._id,
    name: template.name,
    description: template.description,
    subject: template.subject,
    type: template.type,
    fields: snapshotTemplate(template).fields,
    version: template.version,
    isActive: template.isActive !== false,
    createdBy: creator && creator.name ? { id: creator._id, name: creator.name } : creator,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

function parseText(value, label, { required }) {
  if (typeof value !== 'string' || !value.trim()) {
    if (required) {
      throw new AppError(400, `${label} is required`);
    }
    return '';
  }

  return value.trim();
}

function parseFields(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(400, 'A template must have at least one field');
  }

  const names = new Set();
  const orders = new Set();

  return value.map((field, index) => {
    if (!field || typeof field !== 'object' || Array.isArray(field)) {
      throw new AppError(400, `Field ${index + 1} is invalid`);
    }

    const name = typeof field.name === 'string' ? field.name.trim() : '';
    if (!FIELD_NAME_PATTERN.test(name)) {
      throw new AppError(400, `Field ${index + 1} needs a name made of letters and numbers`);
    }
    if (names.has(name)) {
      throw new AppError(400, `Duplicate field name: ${name}`);
    }
    names.add(name);

    const label = typeof field.label === 'string' ? field.label.trim() : '';
    if (!label) {
      throw new AppError(400, `Field ${name} needs a label`);
    }

    if (!FIELD_TYPES.includes(field.type)) {
      throw new AppError(400, `Invalid field type for ${name}`);
    }

    if (typeof field.required !== 'boolean') {
      throw new AppError(400, `Field ${name} must say whether it is required`);
    }

    if (!Number.isInteger(field.order) || field.order < 1) {
      throw new AppError(400, `Field ${name} needs a positive order`);
    }
    if (orders.has(field.order)) {
      throw new AppError(400, `Two fields cannot share order ${field.order}`);
    }
    orders.add(field.order);

    let options = [];
    if (field.type === 'select') {
      if (!Array.isArray(field.options) || field.options.length === 0) {
        throw new AppError(400, `Field ${name} needs at least one option`);
      }
      options = field.options.map((option) => {
        if (typeof option !== 'string' || !option.trim()) {
          throw new AppError(400, `Field ${name} has an empty option`);
        }
        return option.trim();
      });
      if (new Set(options).size !== options.length) {
        throw new AppError(400, `Field ${name} has duplicate options`);
      }
    }

    return {
      name,
      label,
      type: field.type,
      required: field.required,
      order: field.order,
      placeholder: parseText(field.placeholder, 'Placeholder', { required: false }),
      description: parseText(field.description, 'Description', { required: false }),
      options,
    };
  });
}

function sameFields(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseTemplate(body) {
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
  if (!SUBJECTS.includes(subject)) {
    throw new AppError(400, body?.subject ? 'Invalid subject' : 'Subject is required');
  }

  const type = typeof body?.type === 'string' ? body.type.trim() : '';
  if (!TEMPLATE_TYPES.includes(type)) {
    throw new AppError(400, body?.type ? 'Invalid template type' : 'Template type is required');
  }

  let isActive = true;
  if (body?.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      throw new AppError(400, 'Active status must be true or false');
    }
    isActive = body.isActive;
  }

  return {
    name: parseText(body?.name, 'Name', { required: true }),
    description: parseText(body?.description, 'Description', { required: false }),
    subject,
    type,
    fields: parseFields(body?.fields).sort((left, right) => left.order - right.order),
    isActive,
  };
}

async function listTemplates() {
  const templates = await Template.find().sort({ name: 1 }).populate('createdBy', 'name');
  return templates.map(toTemplate);
}

async function getTemplate(id) {
  assertValidId(id);
  const template = await Template.findById(id).populate('createdBy', 'name');
  if (!template) {
    throw new AppError(404, 'Template not found');
  }
  return toTemplate(template);
}

async function createTemplate(body, admin) {
  const parsed = parseTemplate(body);
  const template = await Template.create({ ...parsed, version: 1, createdBy: admin._id });
  await template.populate('createdBy', 'name');
  return toTemplate(template);
}

async function updateTemplate(id, body) {
  assertValidId(id);
  const template = await Template.findById(id);
  if (!template) {
    throw new AppError(404, 'Template not found');
  }

  const parsed = parseTemplate(body);
  const fieldsChanged = !sameFields(
    snapshotTemplate(template).fields,
    parsed.fields,
  );

  Object.assign(template, parsed);
  if (fieldsChanged) {
    template.version += 1;
  }
  await template.save();
  await template.populate('createdBy', 'name');
  return toTemplate(template);
}

async function updateTemplateStatus(id, isActive) {
  if (typeof isActive !== 'boolean') {
    throw new AppError(400, 'Active status must be true or false');
  }

  assertValidId(id);
  const template = await Template.findById(id);
  if (!template) {
    throw new AppError(404, 'Template not found');
  }

  template.isActive = isActive;
  await template.save();
  await template.populate('createdBy', 'name');
  return toTemplate(template);
}

async function loadTemplateForJob(templateId, subject) {
  if (typeof templateId !== 'string' || !OBJECT_ID_PATTERN.test(templateId)) {
    throw new AppError(400, 'Invalid template ID');
  }

  const template = await Template.findById(templateId);
  if (!template) {
    throw new AppError(400, 'Template not found');
  }
  if (template.isActive === false) {
    throw new AppError(400, 'Inactive templates cannot be selected');
  }
  if (template.subject !== subject) {
    throw new AppError(400, 'The template subject does not match the job subject');
  }

  return template;
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
  loadTemplateForJob,
  snapshotTemplate,
};
