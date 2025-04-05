const express = require('express');
const router = express.Router();
const { auth, errorHandler } = require('../middleware/index');
const SessionManager = require('../lib/session-manager');
const Sentry = require('@sentry/node');

router.get('/', auth, async ({ user: { id } }, response, next) => {
  try {
    const sessions = await SessionManager.getSaved(id);
    response.json(sessions);
  } catch (e) {
    e.type = 'Get saved sessions';
    next(e);
  }
});

router.post('/', auth, async ({ user: { id, proxyProvider, token }, body: { credentials, platform, paymentDataId, userProxy } }, response, next) => {
  try {
    const session = await SessionManager.set({
      owner: id,
      token,
      credentials,
      platform,
      proxyProvider,
      paymentDataId,
      userProxy
    });
    response.json(session);
  } catch (e) {
    e.type = 'Set session';
    e.status = e.status || 400;
    next(e);
  }
});

router.patch('/refresh', auth, async ({ user: { id, email }, body: { sessionLogin, partition } }, response, next) => {
  try {
    const { prevId, currId, newLogin } = await SessionManager.refresh({ owner: id, partition, sessionLogin });
    response.json(newLogin);
    Sentry.captureMessage('Session has been refreshed', (scope) => {
      scope.setTag('partition', partition);
      scope.setTag('oldSessionId', prevId);
      scope.setTag('newSessionId', currId);
      scope.setUser({ id, username: email });
      return scope;
    });
  } catch (e) {
    e.type = 'Refresh session';
    e.status = e.status || 400;
    next(e);
  }
});

router.patch('/edit', auth, async ({ user: { id: owner }, body }, response, next) => {
  try {
    const session = await SessionManager.edit({ owner, body });
    response.json(session);
  } catch (e) {
    e.status = 400;
    e.type = 'Edit session';
    next(e);
  }
});

router.get('/random', auth, async ({ user: { id, isAdmin, proxyProvider, token }, query: { platform, count } }, response, next) => {
  try {
    const session = await SessionManager.getRandom({ owner: id, platform, count, proxyProvider, token });
    response.json(session);
  } catch (e) {
    e.type = 'Get session';
    next(e);
  }
});

router.delete('/:ids', auth, async ({ user: { id }, params: { ids } }, response, next) => {
  try {
    const partitions = ids.split(',');
    const { res: { nModified }, credentialsIds } = await SessionManager.remove({ owner: id, partitions });
    if (nModified !== partitions.length) {
      const e = new Error(`Modified ${nModified} of ${ids.length}, owner ${id}`);
      e.details = JSON.stringify(ids);
      e.status = 404;
      throw e;
    }
    response.json(credentialsIds); // sorry
  } catch (e) {
    e.status = e.status || 500;
    e.type = 'Delete session';
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
