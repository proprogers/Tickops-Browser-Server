const Session = require('../models/session');
const User = require('../models/user');
const Reese = require('../models/reese');
const crypto = require('crypto');
const { sendMessage } = require('./web-sockets-manager');


async function forwardLink({user, event_url, selections, fansight, axs_ecomm }) {

    try {
      sendMessage({ value: { link: event_url, tabsNumber:1, selections:selections, fansight:fansight, axs_ecomm: axs_ecomm}, userId: user });
    } catch (e) {
      console.error('SMS text forwarding error:', e);
    }
  
}


async function checkForMissingUserSessions() {
  const report = [];
  const users = await User.find({ isDeleted: false }).exec();
  let sessions, missingCount;
  for (const { id, email, savedSessionsLimit } of users) {
    sessions = await Session.find({ owner: id }).exec();
    missingCount = savedSessionsLimit - sessions.length;
    if (missingCount) {
      report.push(`${id} (${email}): missing ${missingCount}/${savedSessionsLimit}`);
    }
  }
  return report.length && report;
}

async function distributeSessions(userId) {
  let users;
  if (userId) {
    const user = await User.findById(userId).exec();
    users = user ? [user] : [];
  } else {
    users = await User.find({ isDeleted: false }).exec();
  }
  if (!users.length) throw new Error('Wrong user ID or no active users in database');

  const existingSessions = await Session.aggregate([{
    $group: {
      _id: '$owner',
      count: { $sum: 1 }
    }
  }]);
  const existingSessionsMap = new Map(existingSessions.map(({ _id, count }) => [_id, count]));

  const newSessions = [];
  for (const { id, savedSessionsLimit } of users) {
    const existingSessionsLength = existingSessionsMap.get(id) || 0;
    let count = savedSessionsLimit - existingSessionsLength;
    if (count < 0) continue;
    while (count--) {
      newSessions.push({ owner: id });
    }
  }

  await Session.insertMany(newSessions);
}

async function resetTokens(id) {
  const data = { token: null };
  return id ? User.findByIdAndUpdate(id, data).exec() : User.updateMany({}, data).exec();
}

function getHash({ string, salt }) {
  return crypto.createHash('sha256')
    .update(string + salt)
    .digest('hex');
}

async function getLatestReese() {
  const result = await Reese.find({}, '-__v -_id -updatedAt').sort({ _id: -1 }).limit(1).exec();
  return result && result[0];
}

async function setIsCartingVisible({ userId, value }) {
  return User.findByIdAndUpdate(userId, {
    isCartingVisible: !!value,
  }, { new: true }).exec();
}

module.exports = {
  forwardLink,
  distributeSessions,
  checkForMissingUserSessions,
  resetTokens,
  getHash,
  getLatestReese,
  setIsCartingVisible,
};
