const gigRepository = require('../repositories/gigRepository');

function listGigs() {
  return gigRepository.findAll();
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
  toPublicGig,
};
