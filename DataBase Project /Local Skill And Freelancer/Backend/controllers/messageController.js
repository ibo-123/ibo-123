const Message = require('../models/Message');

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content
    });
    await message.save();
    const result = await message.populate('sender', 'name').populate('receiver', 'name');
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const peerId = req.params.peerId;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: peerId },
        { sender: peerId, receiver: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name')
      .populate('receiver', 'name');
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name')
      .populate('receiver', 'name');
    res.json(messages);
  } catch (error) {
    next(error);
  }
};