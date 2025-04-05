const express = require('express');
const router = express.Router();
const { auth, managerAuth, errorHandler } = require('../middleware/index');
const AuthManager = require('../lib/auth-manager');
const UserManager = require('../lib/user-manager');

router.post('/token', async ({ body: { token } }, response, next) => {
  try {
    let user = null;
    try {
      user = await AuthManager.getUserByToken(token);
    } catch (e) {
    }
    response.json(user);
  } catch (e) {
    e.type = 'Check token';
    next(e);
  }
});

router.post('/login', async ({ body }, response, next) => {
  try {
    const token = await AuthManager.login(body);
    response.send(token);
  } catch (e) {
    e.type = 'Login';
    next(e);
  }
});

router.post('/', managerAuth, async ({ body }, response, next) => {
  try {
    const resp = await UserManager.create(body);
    response.status(201).json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Create users';
    next(e);
  }
});

router.get('/', managerAuth, async ({ query = {} }, response, next) => {
  try {
    const users = await UserManager.get(query);
    response.json(users);
  } catch (e) {
    e.status = 400;
    e.type = 'Get users';
    next(e);
  }
});

router.patch('/master-password', auth, async ({ user: { id }, body }, response, next) => {
  try {
    const user = await UserManager.edit({ id, data: { masterPasswordDoubleHash: body.hash } });
    response.json(user);
  } catch (e) {
    e.status = 400;
    e.type = 'Set master password';
    next(e);
  }
});

router.patch('/password', managerAuth, async (request, response, next) => {
  try {
    const { body: { password }, query: { id } } = request;
    const user = await UserManager.edit({ id, data: { password:password } });
    response.json(user);
  } catch (e) {
    e.status = 400;
    e.type = 'Update master password';
    next(e);
  }
});

router.patch('/mpDecode', auth, async ({ user: { id }, body }, response, next) => {
  try {
    const user = await UserManager.edit({ id, data: { mpDecode: body.mpDecode } });
    response.json(user);
  } catch (e) {
    e.status = 400;
    e.type = 'Set mpDecode';
    next(e);
  }
});

router.patch('/status', managerAuth, async (request, response, next) => {
  try {
    const { body: { status_type }, query: { email, id } } = request;
    const user = await UserManager.updateStatus({ id, email, status_type });
    response.status(204).json(user);
  } catch (e) {
    e.status = 400;
    e.type = `Update user status`;
    next(e);
  }
});

router.patch('/', managerAuth, async (request, response, next) => {
  try {
    const { body: { traffic, sessions, type, owner }, query: { email, id } } = request;
    const user = await UserManager.updateLimits({ id, email, traffic, sessions, type, owner  });
    response.status(204).json(user);
  } catch (e) {
    e.status = 400;
    e.type = `Update user's limits`;
    next(e);
  }
});

router.patch('/provider', managerAuth, async ({ body: { users, provider, sync } }, response, next) => {
  try {
    await UserManager.changeProxyProvider({ userIds: users, provider, needToSyncSessions: sync });
    response.sendStatus(204);
  } catch (e) {
    e.status = 400;
    e.type = `Change users' proxy provider`;
    next(e);
  }
});

router.delete('/:id', managerAuth, async ({ params: { id } }, response, next) => {
  try {
    const user = await UserManager.edit({ id, data: { isDeleted: true } });
    // mb need delete all stuck sessions too
    response.json(user);
  } catch (e) {
    e.status = 400;
    e.type = 'Delete user';
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
