const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: { type: Date }
});

module.exports = mongoose.model('Payment', paymentSchema);