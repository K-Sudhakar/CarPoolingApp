const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    name: String,
    email: { type: String, index: true, unique: true, sparse: true },
    photo: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

