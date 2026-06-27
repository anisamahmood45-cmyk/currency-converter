const express  = require('express');
const Favorite = require('../models/Favorite');
const auth     = require('../middleware/auth');
const router   = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const favs = await Favorite.find({ user: req.user.id });
    res.json(favs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { from, to } = req.body;
    const existing = await Favorite.findOne({ user: req.user.id, from, to });
    if (existing) { await existing.deleteOne(); return res.json({ removed: true, from, to }); }
    const fav = await Favorite.create({ user: req.user.id, from, to });
    res.status(201).json({ added: true, fav });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
