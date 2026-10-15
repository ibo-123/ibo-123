const Payment = require('../models/Payment');
const Job = require('../models/Job');

exports.createPayment = async (req, res, next) => {
  try {
    const { jobId, amount } = req.body;
    const job = await Job.findById(jobId).populate('client');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.client.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the job client can create payment' });
    }
    if (job.status !== 'in_progress') {
      return res.status(400).json({ message: 'Payment creation requires a job in progress' });
    }
    const existing = await Payment.findOne({ job: jobId });
    if (existing) return res.status(400).json({ message: 'Payment already created for this job' });

    const payment = new Payment({ job: jobId, amount });
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate({ path: 'job', populate: { path: 'client' } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.job.client.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the job client can mark payment as paid' });
    }
    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment is already marked as paid' });
    }
    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    const job = await Job.findById(payment.job._id);
    job.status = 'completed';
    await job.save();

    res.json(payment);
  } catch (error) {
    next(error);
  }
};
