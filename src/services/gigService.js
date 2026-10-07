const gigRepository = require('../repositories/gigRepository');

function listGigs() {
  return gigRepository.findAll();
}

function getGigById(id) {
  return gigRepository.findById(id);
}

function createGig(title, description, price, freelancerId) {
  // freelancerId always comes from the verified JWT — never from the request body.
  return gigRepository.create({
    title: title.trim(),
    description: description.trim(),
    price,
    freelancerId,
  });
}

function toPublicGig(gig) {
  // Safe fields only — no internal Mongo metadata
  return {
    id: gig.id,
    title: gig.title,
    description: gig.description,
    price: gig.price,
    freelancerId: gig.freelancerId,
  };
}

module.exports = {
  listGigs,
  getGigById,
  createGig,
  toPublicGig,
};
