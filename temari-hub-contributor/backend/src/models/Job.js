const mongoose = require('mongoose');
const { SUBJECTS } = require('../constants/contributors');
const { JOB_STATUSES, DIFFICULTIES } = require('../constants/jobs');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    requirements: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      enum: { values: SUBJECTS, message: 'Invalid subject' },
      required: [true, 'Subject is required'],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number',
      },
      min: [1, 'Quantity must be at least 1'],
    },
    difficulty: {
      type: String,
      enum: { values: DIFFICULTIES, message: 'Invalid difficulty' },
      required: [true, 'Difficulty is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      trim: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },
    // Copy of the template at the time it was selected, so later template edits
    // do not change work that was already defined for this job.
    templateSnapshot: {
      type: new mongoose.Schema(
        {
          templateId: mongoose.Schema.Types.ObjectId,
          name: String,
          version: Number,
          type: String,
          subject: String,
          fields: [
            new mongoose.Schema(
              {
                name: String,
                label: String,
                type: String,
                required: Boolean,
                order: Number,
                placeholder: String,
                description: String,
                options: [String],
              },
              { _id: false },
            ),
          ],
        },
        { _id: false },
      ),
      default: null,
    },
    contributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: { values: JOB_STATUSES, message: 'Invalid job status' },
      default: 'DRAFT',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  { timestamps: true },
);

jobSchema.index({ contributor: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
