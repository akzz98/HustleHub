const gigService = require('../services/gigService');

async function listGigs(req, res, next) {
  try {
    const gigs = await gigService.listGigs();
    res.status(200).json(gigs.map(gigService.toPublicGig));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  listGigs,
};
