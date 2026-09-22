const mongoose = require('mongoose');

const ROLES = ['client', 'freelancer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ROLES,
      default: 'client',
      required: true,
    },
  },
  { versionKey: false }
);

const User = mongoose.model('User', userSchema);

module.exports = {
  User,
  ROLES,
};
