const express = require('express');
const router = express.Router();
const { managerAuth, errorHandler } = require('../middleware/index');
const Utils = require('../lib/utils');
const SettingsManager = require('../lib/settings-manager');
const speedTest = require('../lib/speed-tester');
const { writeLog } = require('../lib/logger');

/**
 * Service route.
 */

let isDistributionRunning = false;

router.get('/distribute-sessions', managerAuth, async (request, response, next) => {
  try {
    const report = await Utils.checkForMissingUserSessions();
    response.send(report || 'No missing or extra sessions for users');
  } catch (e) {
    e.status = 500;
    e.type = 'Missing user sessions check';
    next(e);
  }
});

router.patch('/reset-tokens', managerAuth, resetTokens);

router.patch('/reset-tokens/:id', managerAuth, resetTokens);

router.post('/distribute-sessions', managerAuth, distributeSessions);

router.post('/distribute-sessions/:id', managerAuth, distributeSessions);

router.post('/speed-test', managerAuth, async ({ body: { provider, url, ipInfo, count } }, response, next) => {
  try {
    const result = await speedTest({ provider, url, ipInfo, count });
    response.send(result);
  } catch (e) {
    e.status = 400;
    e.type = 'Speed test';
    next(e);
  }
});

router.get('/settings', managerAuth, async ({ query: { key } }, response, next) => {
  try {
    const result = await SettingsManager.get(key);
    response.send(result || `No setting with key ${key}`);
  } catch (e) {
    e.status = 400;
    e.type = 'Get setting pair';
    next(e);
  }
});

router.post('/settings', managerAuth, async ({ body }, response, next) => {
  try {
    for (const key in body) {
      await SettingsManager.set(key, body[key]);
    }
    response.sendStatus(201);
  } catch (e) {
    e.status = 400;
    e.type = 'Set settings pair(s)';
    next(e);
  }
});

router.get('/reese/latest', managerAuth, async (request, response, next) => {
  try {
    const result = await Utils.getLatestReese();
    response.send(result);
  } catch (e) {
    e.status = 400;
    e.type = 'Get latest TM reese84';
    next(e);
  }
});

router.patch('/carting/:id', managerAuth, async ({ params: { id }, body }, response, next) => {
  try {
    const result = await Utils.setIsCartingVisible({ userId: id, value: body.value });
    response.send(result);
  } catch (e) {
    e.status = 400;
    e.type = 'Set is carting visible';
    next(e);
  }
});

async function distributeSessions(request, response, next) { // TODO
  const errorType = `Add missing user sessions`;
  try {
    let message = 'Already running';
    if (!isDistributionRunning) { // add manual stopping
      isDistributionRunning = true;
      Utils.distributeSessions(request.params.id)
        .catch((e) => writeLog(`"${errorType}" error`, e.message))
        .finally(() => isDistributionRunning = false);
      message = 'Success';
    }
    response.send(message);
  } catch (e) {
    isDistributionRunning = false;
    e.status = 500;
    e.type = errorType;
    next(e);
  }
}

async function resetTokens(request, response, next) {
  try {
    await Utils.resetTokens(request.params.id);
    response.sendStatus(204);
  } catch (e) {
    e.status = 500;
    e.type = 'Reset tokens';
    next(e);
  }
}

router.use(errorHandler);

module.exports = router;
