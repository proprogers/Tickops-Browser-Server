const express = require('express');
const router = express.Router();
const { managerAuth, errorHandler } = require('../middleware/index');
const IdentityGenerator = require('../lib/identity-generator');
const IpInformer = require('../lib/ip-informer.js');

router.get('/', managerAuth, async ({ query: { platform, ip }, headers, connection }, response, next) => {
  try {
    if (!ip) {
      const forwarded = headers['x-forwarded-for'] || connection.remoteAddress;
      ip = forwarded && forwarded.split(/, /)[0];
      if (!ip) throw new Error('Unable to get user IP');
    }
    const { timezone, languages } = await IpInformer.getInfo(ip);
    const identity = await IdentityGenerator.generate(platform);
    identity.timezone = timezone;
    identity.languages = languages;
    response.json(identity);
  } catch (e) {
    e.type = 'Get identity';
    e.status = e.status || 400;
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
