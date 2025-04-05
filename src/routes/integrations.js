const express = require('express');
const router = express.Router();
const { auth, errorHandler } = require('../middleware/index');
const IntegrationsManager = require('../lib/integrations-manager');

router.post('/', auth, async ({ user: { id }, body }, response, next) => {
  try {
    const resp = await IntegrationsManager.saveOne({ data: body, userId: id });
    response.status(201).json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Save integrations data';
    next(e);
  }
});

router.get('/', auth, async ({ user: { id: owner } }, response, next) => {
  try {
    const resp = await IntegrationsManager.getListByUser(owner);
    response.json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Get integrations data';
    next(e);
  }
});

router.get('/service', auth, async ({ query = {} }, response, next) => {
  try {
    const integrations = await IntegrationsManager.get(query);
    response.json(integrations);
  } catch (e) {
    e.status = 400;
    e.type = 'Get integrations';
    next(e);
  }
});

router.patch('/:id', auth, async ({ params: { id }, body }, response, next) => {
  try {
    const resp = await IntegrationsManager.editOne({ data: body, id });
    response.json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Edit integrations data';
    next(e);
  }
});

router.delete('/:id', auth, async ({ params: { id } }, response, next) => {
  try {
    await IntegrationsManager.removeOne(id);
    response.sendStatus(200);
  } catch (e) {
    e.status = 400;
    e.type = 'Delete integrations data';
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;

