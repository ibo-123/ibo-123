const Service = require('../models/Service');
const Freelancer = require('../models/Freelancer');

exports.createService = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can create services' });
    }
    const freelancer = await Freelancer.findOne({ user: req.user.id });
    if (!freelancer) return res.status(404).json({ message: 'Freelancer profile not found' });
    const { title, description, price } = req.body;
    const service = new Service({
      freelancer: freelancer._id,
      title,
      description,
      price
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find()
      .populate({ path: 'freelancer', populate: { path: 'user', select: 'name' } });
    res.json(services);
  } catch (error) {
    next(error);
  }
};

exports.getUserServices = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id });
    if (!freelancer) return res.status(404).json({ message: 'Freelancer profile not found' });
    const services = await Service.find({ freelancer: freelancer._id }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    next(error);
  }
};