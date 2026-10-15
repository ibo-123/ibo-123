const Review = require('../models/Review');
const Job = require('../models/Job');

exports.createReview = async (req, res, next) => {
  try {
    const { jobId, revieweeId, rating, comment } = req.body;
    const job = await Job.findById(jobId).populate('client');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.client.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the client can leave a review' });
    }
    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Review can only be added after job completion' });
    }
    const existing = await Review.findOne({ job: jobId, reviewer: req.user.id });
    if (existing) return res.status(400).json({ message: 'Review already submitted for this job' });

    const review = new Review({
      job: jobId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      comment
    });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

exports.getReviewsByJob = async (req, res, next) => {
  try {
    const reviews = await Review.find({ job: req.params.jobId })
      .populate('reviewer', 'name')
      .populate('reviewee', 'name');
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

exports.getReviewsByUser = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name')
      .populate('job', 'title status');
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.user.id })
      .populate('reviewer', 'name')
      .populate('job', 'title status');
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};
