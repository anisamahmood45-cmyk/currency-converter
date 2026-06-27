const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/history',   require('./routes/history'));
app.use('/api/rates',     require('./routes/rates'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5002, () =>
      console.log(`FX Convert API running on port ${process.env.PORT || 5002}`)
    );
  })
  .catch(err => console.error('DB error:', err));
