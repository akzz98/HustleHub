const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json()); // parse JSON request bodies

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' }); // health check
});

app.use('/api/auth', authRoutes);

module.exports = app;
