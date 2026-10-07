const mongoose = require('mongoose');
const { Gig } = require('../models/Gig');

function toGigRecord(doc) {
  if (!doc) {
    return null;
  }

  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    price: doc.price,
    freelancerId: doc.freelancerId.toString(),
  };
}

async function findAll() {
  const docs = await Gig.find().sort({ _id: -1 });
  return docs.map(toGigRecord);
}

async function findById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const doc = await Gig.findById(id);
  return toGigRecord(doc);
}

async function create(gig) {
  const doc = await Gig.create({
    title: gig.title,
    description: gig.description,
    price: gig.price,
    freelancerId: gig.freelancerId,
  });

  return toGigRecord(doc);
}

async function update(id, fields) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const doc = await Gig.findByIdAndUpdate(
    id,
    {
      title: fields.title,
      description: fields.description,
      price: fields.price,
    },
    { returnDocument: 'after', runValidators: true }
  );

  return toGigRecord(doc);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
};
