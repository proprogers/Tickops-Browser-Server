const User = require('../models/user');
const Utils = require('../lib/utils');
const crypto = require('crypto');
const SessionManager = require('./session-manager');
const { server: { secretKeys } } = require('../../config');
const { getHash } = require('./utils');

async function create(body) {
  if (body.number) {
    return createMany(body);
  }
  const { email, password, sessions, traffic, isAdmin = false, proxyProvider, country, proxy_id } = body;
  if (!password || !email) {
    throw new Error('Invalid credentials');
  }
  const existingUser = await User.findOne({ email }).exec();
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  const user = await new User({
    email,
    password: getHash({ string: password, salt: secretKeys.userPassword }),
    masterPasswordSalt: crypto.randomBytes(8).toString('hex'),
    iv: crypto.randomBytes(8).toString('hex'),
    country: country,
    proxy_id: proxy_id,
    savedSessionsLimit: parseInt(sessions),
    trafficLimit: parseInt(traffic),
    isAdmin,
    proxyProvider
  }).save();
  await Utils.distributeSessions(user.id);
  return user; // TODO: .select(fields)
}

async function createMany(body) {
  const existingUserSet = new Set((await User.find({}).exec()).map(({ email }) => email));
  const { number, pattern = 'user', isAdmin = false, proxyProvider = 'mysterium', sessions = 10, mib = 500 } = body;
  let count = 0, failed = 0;
  const users = [];
  const usersRet = [];
  while (count < number) {
    count++;
    const email = `${pattern}_${count}`;
    if (existingUserSet.has(email)) {
      failed++;
      continue;
    }
    const password = crypto.randomBytes(8).toString('hex');
    usersRet.push({ email, password });
    users.push({
      email,
      password: bcrypt.hashSync(password, saltRounds),
      masterPasswordSalt: crypto.randomBytes(8).toString('hex'),
      iv: crypto.randomBytes(8).toString('hex'),
      savedSessionsLimit: sessions,
      trafficLimit: mib * 1024 * 1024,
      isAdmin,
      proxyProvider
    });
  }
  await User.insertMany(users);
  await Utils.distributeSessions();
  return { failed, users: usersRet };
}

async function get({ id, email }) {
  
  return id
    ? [await User.findById(id).exec()]
    : email
      ? [await User.findOne({ email }).exec()]
      : User.find({}).exec();
}

async function edit({ id, data }) {
  return User.findByIdAndUpdate(id, data, { new: true }).exec();
}

async function changeProxyProvider({ userIds, provider, needToSyncSessions = false }) {
  const emptyFilter = { isAdmin: false, isDeleted: false };
  const filter = userIds && userIds.length
    ? { _id: { $in: userIds } }
    : emptyFilter;
  await User.updateMany(filter, { proxyProvider: provider }).exec();
  if (!needToSyncSessions) return;
  const users = userIds && userIds.length ? userIds : (await User.find(emptyFilter).exec()).map(({ _id }) => _id);
  await SessionManager.syncProxyProvider({ provider, userIds: users });
}

async function updateLimits({ id, email, sessions: savedSessionsLimit, traffic: trafficLimit, type, owner }) {
  if (!savedSessionsLimit && !trafficLimit) throw new Error('No data passed to update');
  const fields = '-password -masterPasswordSalt -iv -masterPasswordDoubleHash';
  const update = { savedSessionsLimit, trafficLimit, type, owner };
  const options = { omitUndefined: true, new: true };
  
  const updated = id
    ? await User.findByIdAndUpdate(id, update, options).select(fields).exec()
    : await User.findOneAndUpdate({ email }, update, options).select(fields).exec();
  if (!updated) throw new Error('No users matching the request');
  return updated;
}

async function updateStatus({ id, email, status_type: status_type}) {
  if (!status_type) throw new Error('No data passed to update');
  const fields = '-password -masterPasswordSalt -iv -masterPasswordDoubleHash';
  const update = { status_type };
  const options = { omitUndefined: true, new: true };
  
  const updated = id
    ? await User.findByIdAndUpdate(id, update, options).select(fields).exec()
    : await User.findOneAndUpdate({ email }, update, options).select(fields).exec();
  if (!updated) throw new Error('No users matching the request');
  return updated;
}

module.exports = { get, create, edit, updateLimits, updateStatus, changeProxyProvider };
