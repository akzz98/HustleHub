const { prepareBookingInput } = require('../utils/validation');
const bookingService = require('../services/bookingService');

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
