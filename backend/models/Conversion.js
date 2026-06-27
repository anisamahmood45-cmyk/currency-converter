const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from:   { type: String, required: true },
  to:     { type: String, required: true },
  amount: { type: Number, required: true },
  result: { type: Number, required: true },
  rate:   { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Conversion', conversionSchema);
