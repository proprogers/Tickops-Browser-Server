const crypto = require('crypto');
const { server: { secretKeys } } = require('../../config');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');
const UserManager = require('./user-manager');
const SessionManager = require('./session-manager');
const UserCache = require('../caches/user-cache');
const { getHash } = require('./utils');
const bcrypt = require('bcrypt');

function checkManagerAuth(token) {
  if (token !== secretKeys.managerAuth) throw Error('Invalid authorization key');
}

async function getUserByToken(token) {
  const user = await UserCache.get(token);
  if (user) {
    await SessionManager.updateLogins({ owner: user.id, token });
    return user;
  }
  const error = new Error('The browser session has been expired. Please try to restart browser');
  error.status = 403;
  throw error;
}

async function login({ credentials: { email, login, password, device }, isChangeDevice }) {
  let user = await User.findOne({ email: email || login }).exec();

  try {
    user = await _checkUserCredentials({ user, password });
  } catch (e) {
    e.status = 401;
    throw e;
  }

  if (!user.iv || !user.masterPasswordSalt) {
    const data = {};
    !user.masterPasswordSalt && (data.masterPasswordSalt = crypto.randomBytes(8).toString('hex'));
    !user.iv && (data.iv = crypto.randomBytes(8).toString('hex'));
    user = await UserManager.edit({ id: user.id, data });
  }

  // if (!isChangeDevice && user.deviceId && device.id !== user.deviceId) {
  //   const error = new Error(user.deviceName);
  //   error.status = 409;
  //   throw error;
  // }

  if (isChangeDevice || !user.deviceId || !user.token) {
    const token = uuidv4().replace(/-/g, '');
    user = await User.findByIdAndUpdate(user.id, {
      token,
      deviceId: device.id,
      deviceName: device.name
    }, { omitUndefined: true, new: true }).exec();
    await SessionManager.updateLogins({ owner: user.id, token });
  }

   //await SessionManager.updateLogins({ owner: user.id, token:user.token });

  return user.token;
}

async function _checkUserCredentials({ user, password }) {
  if (!user) {
    throw new Error('Wrong email');
  }
  const passwordSha256 = getHash({ string: password, salt: secretKeys.userPassword });

  if (user.password === passwordSha256 || bcrypt.compareSync(password, user.password)) {
    return user;
  }
  throw new Error('Wrong password');
}

module.exports = {
  login,
  getUserByToken,
  checkManagerAuth
};
