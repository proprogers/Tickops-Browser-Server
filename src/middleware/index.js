const AuthManager = require('../lib/auth-manager');
const { writeLog } = require('../lib/logger');

async function auth(request, response, next) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization) throw new Error('No authorization');
    const token = authorization.split(' ')[1];
    request.user = await AuthManager.getUserByToken(token);
    next();
  } catch (e) {
    e.status = 401;
    e.type = 'User auth';
    next(e);
  }
}

async function managerAuth(request, response, next) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization) throw new Error('No authorization');
    const token = authorization.split(' ')[1];
    AuthManager.checkManagerAuth(token);
    next();
  } catch (e) {
    e.status = 401;
    e.type = 'Manager auth';
    next(e);
  }
}

async function managerFileAuth(request, response, next) {
  try {
    const token = request.query.token;
    if (!token) throw new Error('No authorization');
    AuthManager.checkManagerAuth(token);
    next();
  } catch (e) {
    e.status = 401;
    e.type = 'Manager file auth';
    next(e);
  }
}

async function errorHandler(error, request, response, next) {
  if (!error.status) error.status = 500;
  if (error.status === 500) {
    writeLog(`"${error.type}" server error`, error.message, error.details);
  }
  response.status(error.status).json({ message: error.message });
}

module.exports = { auth, managerAuth, managerFileAuth, errorHandler };
