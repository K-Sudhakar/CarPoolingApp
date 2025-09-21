const mongoose = require('mongoose');
const { Schema } = mongoose;

const requestSchema = new Schema(
  {
    passenger: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seats: { type: Number, default: 1, min: 1 },
    message: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const rideSchema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    seats: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String },
    requests: { type: [requestSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
