const express = require('express');
const router = express.Router();
const { auth, errorHandler } = require('../middleware/index');
const SavedCredentialsManager = require('../lib/saved-credentials-manager');

router.post('/', auth, async ({ user: { id }, body: { login, password, hostname, partition } }, response, next) => {
  try {
    const resp = await SavedCredentialsManager.saveOne({ userId: id, password, login, hostname, partition });
    response.status(201).json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Save site account credentials';
    next(e);
  }
});

router.post('/bulk', auth, async ({ user: { id }, body }, response, next) => {
  try {
    const resp = await SavedCredentialsManager.saveMany(body.map((curr) => ({ ...curr, owner: id })));
    response.status(201).json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Bulk save site account credentials';
    next(e);
  }
});

router.get('/', auth, async ({ user: { id }, body }, response, next) => {
  try {
    const list = await SavedCredentialsManager.getListByUser(id);
    response.json(list);
  } catch (e) {
    e.status = 400;
    e.type = 'Get all saved account credentials';
    next(e);
  }
});

router.patch('/:id', auth, async ({ params: { id }, body }, response, next) => {
  try {
    const resp = await SavedCredentialsManager.editOne({ data: body, id });
    response.json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Edit site credentials';
    next(e);
  }
});

router.patch('/', auth, async ({ user: { id: owner }, body }, response, next) => {
  try {
    await SavedCredentialsManager.editMany({ array: body, owner });
    response.sendStatus(204);
  } catch (e) {
    e.status = 400;
    e.type = 'Edit sites credentials';
    next(e);
  }
});

router.delete('/:id', auth, async ({ params: { id } }, response, next) => {
  try {
    await SavedCredentialsManager.removeOne(id);
    response.sendStatus(200);
  } catch (e) {
    e.status = 400;
    e.type = 'Delete site credentials';
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
