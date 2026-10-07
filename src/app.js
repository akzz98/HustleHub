const express = require('express');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const gigRoutes = require('./routes/gigRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json()); // parse JSON request bodies

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' }); // health check
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler); // after routes — Express only reaches this via next(err)

module.exports = app;
