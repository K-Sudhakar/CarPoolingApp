const mongoose = require('mongoose');
const { Schema } = mongoose;

const rideSchema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    seats: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);

