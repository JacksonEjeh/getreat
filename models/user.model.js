import mongoose from "mongoose";

// USER SCHEMA
const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  phone: { type: String },

  password: { type: String, select: false },

  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  auth_providers: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },

  avatar: String,

  refreshToken: { type: String, select: false },

  role: {
    type: String,
    enum: ["patient", "provider", "super admin", "control admin"],
    default: "patient",
  },

  email_verified: { type: Boolean, default: false },

  otp: { type: String, select: false },
  otpExpiresAt: { type: Date, select: false },

  onboarding_step: {
    type: String,
    enum: ["signup","verified", "service", "subscription", "completed"],
    default: "signup",
  },

  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },

  dob: {
    type: Date,
    validate: {
      validator: (value) => value < new Date(),
      message: "Date of birth cannot be in the future",
    },
  },

  country_of_residence: {
    type: String,
    trim: true,
    lowercase: true,
  },

  state_of_residence: {
    type: String,
    trim: true,
    lowercase: true,
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
