import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'instructor', 'student'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'student',
    },
    avatar: {
      type: String,
      default: '',
    },
    settings: {
      emailNotifications: { type: Boolean, default: true },
      reminderEmails: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: true },
    },
    // Gamification
    xp: { type: Number, default: 0, index: true },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActive: { type: String, default: '' }, // YYYY-MM-DD (UTC)
    },
    badges: [
      {
        key: { type: String },
        earnedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

/** Hash a plain password (static helper). */
userSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

/** Set and hash the password on the document. */
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await this.constructor.hashPassword(plain);
};

/** Compare a plain password against the stored hash. */
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/** Public-safe representation (strips sensitive fields). */
userSchema.methods.toSafeJSON = function () {
  const s = this.settings || {};
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    settings: {
      emailNotifications: s.emailNotifications !== false,
      reminderEmails: s.reminderEmails !== false,
      productUpdates: s.productUpdates !== false,
    },
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
export default User;
