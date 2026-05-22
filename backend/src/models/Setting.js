import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    // Reset-token fields are only populated on the `admin_password` setting
    // while a forgot-password flow is in flight. Cleared after a successful
    // reset. Stored here (rather than a separate collection) because the
    // store has a single admin and the token is conceptually attached to
    // the password it will replace.
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
