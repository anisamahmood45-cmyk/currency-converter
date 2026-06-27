const express = require('express');
const { v4: uuid } = require('uuid');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const history = db.get('conversions')
      .filter({ user: req.user.id })
      .orderBy('createdAt', 'desc')
      .take(20)
      .value();
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { from, to, amount, result, rate } = req.body;
    const conv = { _id: uuid(), user: req.user.id, from, to, amount, result, rate, createdAt: new Date().toISOString() };
    db.get('conversions').push(conv).write();
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
