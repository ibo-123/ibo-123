const bcrypt = require('bcryptjs');

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'freelancer') {
      profile = await Freelancer.findOne({ user: user._id });
    } else if (user.role === 'client') {
      profile = await Client.findOne({ user: user._id });
    }

    res.json({ user, profile });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, settings } = req.body;
    const update = { name, email };
    if (settings && typeof settings === 'object') {
      update.settings = {
        emailNotifications: settings.emailNotifications ?? true,
        jobAlerts: settings.jobAlerts ?? true,
        theme: settings.theme || 'light'
      };
    }
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateFreelancerProfile = async (req, res, next) => {
  try {
    let freelancer = await Freelancer.findOne({ user: req.user.id });
    if (!freelancer) {
      freelancer = new Freelancer({ user: req.user.id });
    }
    const { bio, hourlyRate, skills, github, linkedin, portfolio, experience } = req.body;
    freelancer.bio = bio;
    freelancer.hourlyRate = hourlyRate;
    freelancer.skills = skills;
    freelancer.github = github;
    freelancer.linkedin = linkedin;
    freelancer.portfolio = portfolio;
    freelancer.experience = experience;
    await freelancer.save();
    res.json(freelancer);
  } catch (error) {
    next(error);
  }
};

exports.updateClientProfile = async (req, res, next) => {
  try {
    let client = await Client.findOne({ user: req.user.id });
    if (!client) {
      client = new Client({ user: req.user.id });
    }
    const { company, bio, github, linkedin, portfolio } = req.body;
    client.company = company;
    client.bio = bio;
    client.github = github;
    client.linkedin = linkedin;
    client.portfolio = portfolio;
    await client.save();
    res.json(client);
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
