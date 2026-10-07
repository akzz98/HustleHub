const mongoose = require('mongoose');
const { Transaction } = require('../models/Transaction');

function toTransactionRecord(doc) {
  if (!doc) {
    return null;
  }

  return {
    id: doc._id.toString(),
    bookingId: doc.bookingId.toString(),
    clientId: doc.clientId.toString(),
    freelancerId: doc.freelancerId.toString(),
    amount: doc.amount,
  };
}

async function create(transaction) {
  const doc = await Transaction.create({
    bookingId: transaction.bookingId,
    clientId: transaction.clientId,
    freelancerId: transaction.freelancerId,
    amount: transaction.amount,
  });

  return toTransactionRecord(doc);
}

async function findByBookingId(bookingId) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return null;
  }

  const doc = await Transaction.findOne({ bookingId });
  return toTransactionRecord(doc);
}

async function findById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const doc = await Transaction.findById(id);
  return toTransactionRecord(doc);
}

module.exports = {
  create,
  findByBookingId,
  findById,
};
