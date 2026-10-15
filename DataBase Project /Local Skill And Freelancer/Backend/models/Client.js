const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String },
  bio: { type: String },
  github: { type: String },
  linkedin: { type: String },
  portfolio: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema);