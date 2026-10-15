const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'Freelancer' },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  budget: { type: Number, required: true, min: 0 },
  deadline: { type: Date },
  category: { type: String, trim: true },
  location: { type: String, trim: true },
  skills: [{ type: String }],
  jobType: { type: String, trim: true },
  experienceLevel: { type: String, trim: true },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

jobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);