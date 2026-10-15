const mongoose = require('mongoose');
const { SUBJECTS } = require('../constants/contributors');
const { TEMPLATE_TYPES, FIELD_TYPES } = require('../constants/templates');

const fieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    required: { type: Boolean, default: false },
    order: { type: Number, required: true },
    placeholder: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    options: { type: [String], default: [] },
  },
  { _id: false },
);

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      enum: { values: SUBJECTS, message: 'Invalid subject' },
      required: [true, 'Subject is required'],
    },
    type: {
      type: String,
      enum: { values: TEMPLATE_TYPES, message: 'Invalid template type' },
      required: [true, 'Template type is required'],
    },
    fields: {
      type: [fieldSchema],
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Template', templateSchema);
