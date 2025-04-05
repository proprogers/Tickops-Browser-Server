const Session = require('../models/session');
const User = require('../models/user');

run();

async function run() {
  await updateSessionsNames();
  await updateUsersIvName()
}

async function updateSessionsNames() {
  const sessions = await Session.find({ credentials: { $ne: null } }).exec();
  const modifiedSessions = sessions.map(({ credentials, partition }) => {
    return {
      updateOne: {
        filter: { partition },
        update: { credentials: { ...credentials, name: `${credentials.firstName} ${credentials.lastName}` } }
      }
    };
  });
  await Session.bulkWrite(modifiedSessions);
}

async function updateUsersIvName() {
  const users = await User.find({}).exec();
  const modifiedUsers = users.map(({ _id, sessionPasswordIv }) => {
    return {
      updateOne: {
        filter: { _id },
        update: { iv: sessionPasswordIv }
      }
    };
  });
  await User.bulkWrite(modifiedUsers);
}
