const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Registration send JSON, so parse it before the routes run.
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

module.exports = app;
