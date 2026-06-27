const express = require('express');
const { v4: uuid } = require('uuid');
const db      = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

router.get('/', auth, (req, res) => {
  try {
    const favs = db.get('favorites').filter({ user: req.user.id }).value();
    res.json(favs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { from, to } = req.body;
    const existing = db.get('favorites').find({ user: req.user.id, from, to }).value();
    if (existing) {
      db.get('favorites').remove({ user: req.user.id, from, to }).write();
      return res.json({ removed: true, from, to });
    }
    const fav = { id: uuid(), user: req.user.id, from, to };
    db.get('favorites').push(fav).write();
    res.status(201).json({ added: true, fav });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
