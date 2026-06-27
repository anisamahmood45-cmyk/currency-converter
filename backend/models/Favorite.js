const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: String, required: true },
  to:   { type: String, required: true },
}, { timestamps: true });

favoriteSchema.index({ user: 1, from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
