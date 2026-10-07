const bookingRepository = require('../repositories/bookingRepository');
const gigService = require('./gigService');
const transactionService = require('./transactionService');
const { simulateBookingConfirmation } = require('./bookingConfirmation');

function toPublicBooking(booking, confirmation = null, transaction = null) {
  const publicBooking = {
    id: booking.id,
    gigId: booking.gigId,
    clientId: booking.clientId,
    freelancerId: booking.freelancerId,
    status: booking.status,
  };

  if (confirmation) {
    publicBooking.confirmation = {
      paymentSimulated: confirmation.paymentSimulated,
      message: confirmation.message,
    };
  }

  if (transaction) {
    publicBooking.transaction = transactionService.toPublicTransaction(transaction);
  }

  return publicBooking;
}

async function createBooking(gigId, clientId) {
  const gig = await gigService.getGigById(gigId);

  if (!gig) {
    return { error: 'not_found' };
  }

  // Simulated confirmation replaces a real payment step.
  const confirmation = simulateBookingConfirmation();

  // clientId from JWT; freelancerId copied from the gig (not client-supplied).
  const booking = await bookingRepository.create({
    gigId: gig.id,
    clientId,
    freelancerId: gig.freelancerId,
    status: confirmation.status,
  });

  try {
    // Every confirmed booking must create a linked transaction for income tracking.
    const transaction = await transactionService.createForBooking(booking, gig.price);
    return { booking, confirmation, transaction };
  } catch (err) {
    // Avoid an orphan booking if transaction creation fails.
    await bookingRepository.remove(booking.id);
    throw err;
  }
}

async function listBookingsForUser(userId, role) {
  // Scope by JWT identity — never accept a user id from the query/body.
  if (role === 'client') {
    return bookingRepository.findByClientId(userId);
  }

  if (role === 'freelancer') {
    return bookingRepository.findByFreelancerId(userId);
  }

  return [];
}

module.exports = {
  createBooking,
  listBookingsForUser,
  toPublicBooking,
  simulateBookingConfirmation,
};
