const { prepareBookingInput } = require('../utils/validation');
const bookingService = require('../services/bookingService');
const { logger } = require('../utils/logger');

async function createBooking(req, res, next) {
  try {
    const prepared = prepareBookingInput(req.body);

    if (prepared.error) {
      return res.status(400).json({ error: prepared.error });
    }

    const result = await bookingService.createBooking(prepared.value.gigId, req.userId);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    logger.info(
      {
        event: 'booking_created',
        bookingId: result.booking.id,
        gigId: result.booking.gigId,
        clientId: result.booking.clientId,
        freelancerId: result.booking.freelancerId,
      },
      'booking created'
    );

    logger.info(
      {
        event: 'transaction_created',
        transactionId: result.transaction.id,
        bookingId: result.transaction.bookingId,
        clientId: result.transaction.clientId,
        freelancerId: result.transaction.freelancerId,
        amount: result.transaction.amount,
      },
      'transaction created'
    );

    res
      .status(201)
      .json(
        bookingService.toPublicBooking(
          result.booking,
          result.confirmation,
          result.transaction
        )
      );
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function listMyBookings(req, res, next) {
  try {
    const bookings = await bookingService.listBookingsForUser(req.userId, req.userRole);

    // List responses are ownership-scoped; omit create-time confirmation payload.
    res.status(200).json(bookings.map((booking) => bookingService.toPublicBooking(booking)));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  createBooking,
  listMyBookings,
};
