const mongoose = require('mongoose');
const { SUBJECTS } = require('../constants/contributors');

const topicSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      enum: { values: SUBJECTS, message: 'Invalid subject' },
      required: [true, 'Subject is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    isCurriculumStandard: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

topicSchema.index({ subject: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Topic', topicSchema);
