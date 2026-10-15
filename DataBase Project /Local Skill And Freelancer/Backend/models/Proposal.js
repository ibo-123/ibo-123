const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'Freelancer', required: true },
  proposalText: { type: String, required: true, trim: true },
  coverLetter: { type: String, trim: true },
  estimatedDays: { type: Number, min: 1 },
  proposedPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

proposalSchema.index({ job: 1, freelancer: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);