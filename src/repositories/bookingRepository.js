const mongoose = require('mongoose');
const { Booking } = require('../models/Booking');

function toBookingRecord(doc) {
  if (!doc) {
    return null;
  }

  return {
    id: doc._id.toString(),
    gigId: doc.gigId.toString(),
    clientId: doc.clientId.toString(),
    freelancerId: doc.freelancerId.toString(),
    status: doc.status,
  };
}

async function create(booking) {
  const doc = await Booking.create({
    gigId: booking.gigId,
    clientId: booking.clientId,
    freelancerId: booking.freelancerId,
    status: booking.status,
  });

  return toBookingRecord(doc);
}

async function findById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const doc = await Booking.findById(id);
  return toBookingRecord(doc);
}

async function remove(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const doc = await Booking.findByIdAndDelete(id);
  return toBookingRecord(doc);
}

async function findByClientId(clientId) {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return [];
  }

  const docs = await Booking.find({ clientId }).sort({ _id: -1 });
  return docs.map(toBookingRecord);
}

async function findByFreelancerId(freelancerId) {
  if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
    return [];
  }

  const docs = await Booking.find({ freelancerId }).sort({ _id: -1 });
  return docs.map(toBookingRecord);
}

module.exports = {
  create,
  findById,
  remove,
  findByClientId,
  findByFreelancerId,
};
