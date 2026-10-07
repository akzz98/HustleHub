const userService = require('../services/userService');
const gigService = require('../services/gigService');
const bookingService = require('../services/bookingService');
const transactionService = require('../services/transactionService');

async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.status(200).json(users.map(userService.toAdminPublicUser));
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(userService.toAdminPublicUser(user));
  } catch (err) {
    next(err);
  }
}

async function listGigs(req, res, next) {
  try {
    const gigs = await gigService.listGigs();
    res.status(200).json(gigs.map(gigService.toPublicGig));
  } catch (err) {
    next(err);
  }
}

async function getGig(req, res, next) {
  try {
    const gig = await gigService.getGigById(req.params.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    res.status(200).json(gigService.toPublicGig(gig));
  } catch (err) {
    next(err);
  }
}

async function listBookings(req, res, next) {
  try {
    const bookings = await bookingService.listAllBookings();
    res.status(200).json(bookings.map((booking) => bookingService.toPublicBooking(booking)));
  } catch (err) {
    next(err);
  }
}

async function getBooking(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    res.status(200).json(bookingService.toPublicBooking(booking));
  } catch (err) {
    next(err);
  }
}

async function listTransactions(req, res, next) {
  try {
    const transactions = await transactionService.listAllTransactions();
    res.status(200).json(transactions.map(transactionService.toPublicTransaction));
  } catch (err) {
    next(err);
  }
}

async function getTransaction(req, res, next) {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    res.status(200).json(transactionService.toPublicTransaction(transaction));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  getUser,
  listGigs,
  getGig,
  listBookings,
  getBooking,
  listTransactions,
  getTransaction,
};
