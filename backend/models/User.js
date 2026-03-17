// models/User.js
// ─────────────────────────────────────────────
//  User Collection Schema
//  Users belong to a Company via companyId
// ─────────────────────────────────────────────

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },

    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [60, 'Password hash length mismatch'], // bcrypt hashes are 60 chars
      select: false, // Never return password in queries by default
    },

    role: {
      type: String,
      enum: ['owner', 'admin', 'operator', 'viewer'],
      default: 'owner',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    // For future profile features
    profilePicture: {
      type: String,
      default: null,
    },

    // Refresh token support (future enhancement)
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: username must be unique within a company
UserSchema.index({ companyId: 1, username: 1 }, { unique: true });
UserSchema.index({ email: 1 });

// Instance method: compare plain password against stored hash
UserSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Static method: hash a plain password
UserSchema.statics.hashPassword = async function (plainPassword) {
  const saltRounds = 12;
  return bcrypt.hash(plainPassword, saltRounds);
};

module.exports = mongoose.model('User', UserSchema);
