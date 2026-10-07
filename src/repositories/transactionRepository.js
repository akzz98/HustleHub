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

async function findByFreelancerId(freelancerId) {
  if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
    return [];
  }

  const docs = await Transaction.find({ freelancerId }).sort({ _id: -1 });
  return docs.map(toTransactionRecord);
}

async function sumAmountByFreelancerId(freelancerId) {
  if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
    return { totalIncome: 0, transactionCount: 0 };
  }

  const [result] = await Transaction.aggregate([
    { $match: { freelancerId: new mongoose.Types.ObjectId(freelancerId) } },
    {
      $group: {
        _id: '$freelancerId',
        totalIncome: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  if (!result) {
    return { totalIncome: 0, transactionCount: 0 };
  }

  return {
    totalIncome: result.totalIncome,
    transactionCount: result.transactionCount,
  };
}

async function findAll() {
  const docs = await Transaction.find().sort({ _id: -1 });
  return docs.map(toTransactionRecord);
}

module.exports = {
  create,
  findByBookingId,
  findById,
  findByFreelancerId,
  sumAmountByFreelancerId,
  findAll,
};
