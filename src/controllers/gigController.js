const { validateGigCreate } = require('../utils/validation');
const gigService = require('../services/gigService');

async function listGigs(req, res, next) {
  try {
    const gigs = await gigService.listGigs();
    res.status(200).json(gigs.map(gigService.toPublicGig));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function createGig(req, res, next) {
  try {
    const error = validateGigCreate(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const gig = await gigService.createGig(
      req.body.title,
      req.body.description,
      req.body.price,
      req.userId // ownership from JWT, ignore any client-supplied freelancerId
    );

    res.status(201).json(gigService.toPublicGig(gig));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  listGigs,
  createGig,
};
