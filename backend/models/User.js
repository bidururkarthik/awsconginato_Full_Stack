const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  cognitoSub: { type: String, unique: true, required: true },
  email:      { type: String, unique: true, required: true, lowercase: true, trim: true },
  name:       { type: String, trim: true },
  verified:   { type: Boolean, default: false },
  lastLogin:  Date,
  loginCount: { type: Number, default: 0 },
  createdAt:  { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
