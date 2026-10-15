const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, RELATED_ENTITY_TYPES } = require('../constants/notifications');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedEntityType: {
      type: String,
      enum: RELATED_ENTITY_TYPES,
      required: true,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    link: {
      type: String,
      default: '',
    },
    reminderKey: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index(
  { recipient: 1, type: 1, relatedEntityId: 1, reminderKey: 1 },
  { unique: true, partialFilterExpression: { type: 'DEADLINE_REMINDER' } },
);

module.exports = mongoose.model('Notification', notificationSchema);
