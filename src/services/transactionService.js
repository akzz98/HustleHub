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

function listAllTransactions() {
  return transactionRepository.findAll();
}

function getTransactionById(id) {
  return transactionRepository.findById(id);
}

module.exports = {
  createForBooking,
  listAllTransactions,
  getTransactionById,
  toPublicTransaction,
};
