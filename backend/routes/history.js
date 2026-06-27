const express    = require('express');
const Conversion = require('../models/Conversion');
const auth       = require('../middleware/auth');
const router     = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const history = await Conversion.find({ user: req.user.id })
      .sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { from, to, amount, result, rate } = req.body;
    const conv = await Conversion.create({ user: req.user.id, from, to, amount, result, rate });
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
