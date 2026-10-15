const mongoose = require('mongoose');
const { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } = require('../constants/activity');

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ACTIVITY_ACTIONS,
      required: true,
    },
    entityType: {
      type: String,
      enum: ACTIVITY_ENTITY_TYPES,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ 'metadata.jobId': 1, createdAt: -1 });
activityLogSchema.index({ 'metadata.contributorId': 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
