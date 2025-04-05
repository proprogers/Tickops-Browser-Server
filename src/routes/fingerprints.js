const express = require('express');
const router = express.Router();
const { auth, managerAuth, errorHandler } = require('../middleware/index');
const FingerprintManager = require('../lib/fingerprint-manager');

router.post('/', auth, async (request, response, next) => {
  try {
    const { hash, data } = request.body;
    await FingerprintManager.save({ hash, data, userId: request.user.id });
    response.sendStatus(201);
  } catch (e) {
    e.status = 400;
    e.type = 'Save fingerprint';
    next(e);
  }
});

router.get('/', managerAuth, async (request, response, next) => {
  try {
    const fingerprints = await FingerprintManager.getAll();
    response.json(fingerprints);
  } catch (e) {
    e.status = 400;
    e.type = 'Get fingerprints';
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
