const express = require('express');
const fetch   = require('node-fetch');
const router  = express.Router();

let cache = { rates: null, ts: 0 };
const TTL = 60 * 1000; // 1 min

router.get('/latest', async (req, res) => {
  try {
    if (cache.rates && Date.now() - cache.ts < TTL)
      return res.json({ rates: cache.rates, cached: true });
    const r = await fetch('https://api.frankfurter.app/latest?from=USD');
    if (!r.ok) throw new Error('API error');
    const data = await r.json();
    cache = { rates: { USD: 1, ...data.rates }, ts: Date.now() };
    res.json({ rates: cache.rates, cached: false });
  } catch {
    res.status(503).json({ message: 'Rate service unavailable' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { from = 'USD', to = 'PKR', days = 7 } = req.query;
    const end   = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days));
    const fmt = d => d.toISOString().split('T')[0];
    const r = await fetch(
      `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${from}&to=${to}`
    );
    if (!r.ok) throw new Error('History API error');
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: err.message });
  }
});

module.exports = router;
