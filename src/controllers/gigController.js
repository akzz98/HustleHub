const { prepareGigInput } = require('../utils/validation');
const gigService = require('../services/gigService');

async function listGigs(req, res, next) {
  try {
    const gigs = await gigService.listGigs();
    res.status(200).json(gigs.map(gigService.toPublicGig));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function getGig(req, res, next) {
  try {
    const gig = await gigService.getGigById(req.params.id);

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    res.status(200).json(gigService.toPublicGig(gig));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function createGig(req, res, next) {
  try {
    const prepared = prepareGigInput(req.body);

    if (prepared.error) {
      return res.status(400).json({ error: prepared.error });
    }

    const gig = await gigService.createGig(
      prepared.value.title,
      prepared.value.description,
      prepared.value.price,
      req.userId // ownership from JWT, ignore any client-supplied freelancerId
    );

    res.status(201).json(gigService.toPublicGig(gig));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function updateGig(req, res, next) {
  try {
    const prepared = prepareGigInput(req.body);

    if (prepared.error) {
      return res.status(400).json({ error: prepared.error });
    }

    const existing = await gigService.getGigById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    // Ownership: JWT user must own the gig — never trust a body freelancerId.
    if (existing.freelancerId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const gig = await gigService.updateGig(
      req.params.id,
      prepared.value.title,
      prepared.value.description,
      prepared.value.price
    );

    res.status(200).json(gigService.toPublicGig(gig));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function deleteGig(req, res, next) {
  try {
    const existing = await gigService.getGigById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    // Ownership: JWT user must own the gig.
    if (existing.freelancerId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    await gigService.deleteGig(req.params.id);

    res.status(204).send();
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  listGigs,
  getGig,
  createGig,
  updateGig,
  deleteGig,
};
