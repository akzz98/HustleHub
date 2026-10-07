const transactionRepository = require('../repositories/transactionRepository');

function toPublicTransaction(transaction) {
  return {
    id: transaction.id,
    bookingId: transaction.bookingId,
    clientId: transaction.clientId,
    freelancerId: transaction.freelancerId,
    amount: transaction.amount,
  };
}

function createForBooking(booking, amount) {
  // Amount comes from the gig price at booking time — not from the client body.
  return transactionRepository.create({
    bookingId: booking.id,
    clientId: booking.clientId,
    freelancerId: booking.freelancerId,
    amount,
  });
}

module.exports = {
  createForBooking,
  toPublicTransaction,
};
