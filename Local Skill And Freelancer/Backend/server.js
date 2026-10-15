require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const errorHandler = require('./middleware/errorHandler');
const Job = require('./models/Job');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freelance-marketplace')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Cron job to auto-close jobs past deadline
cron.schedule('0 * * * *', async () => { // Run every hour
  try {
    const now = new Date();
    const result = await Job.updateMany(
      { status: 'open', deadline: { $lt: now } },
      { status: 'closed' }
    );
    if (result.modifiedCount > 0) {
      console.log(`Auto-closed ${result.modifiedCount} jobs past deadline`);
    }
  } catch (error) {
    console.error('Error in auto-close cron job:', error);
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/services', require('./routes/services'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/stats', require('./routes/stats'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));