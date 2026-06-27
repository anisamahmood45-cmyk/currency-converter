const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/history',   require('./routes/history'));
app.use('/api/rates',     require('./routes/rates'));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`FX Convert API running on port ${PORT}`));
