const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'PARTICIPANT', 'USER'],
      default: 'USER',
    },
    codeforcesUsername: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    // Registration status for tournaments can be tracked via Participant model
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.index({ username: 1, email: 1 });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

UserSchema.statics.findByUsernameOrEmail = async function(username, email) {
  return this.findOne({
    $or: [
      { username: username },
      { email: email }
    ]
  });
};

module.exports = mongoose.model('User', UserSchema);