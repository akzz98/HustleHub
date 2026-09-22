const mongoose = require('mongoose');
const { User } = require('../models/User');

function toUserRecord(doc) {
  if (!doc) {
    return null;
  }

  // Public API uses id; MongoDB stores _id. Never return password as plaintext.
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
  };
}

async function findAll() {
  const docs = await User.find();
  return docs.map(toUserRecord);
}

async function findByEmail(email) {
  // Match on lowercased email so John@x.com and john@x.com are the same account.
  const normalised = email.trim().toLowerCase();
  const doc = await User.findOne({ email: normalised });
  return toUserRecord(doc);
}

async function findById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const doc = await User.findById(id);
  return toUserRecord(doc);
}

async function create(user) {
  const doc = await User.create({
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
  });

  return toUserRecord(doc);
}

module.exports = {
  findAll,
  findByEmail,
  findById,
  create,
};
