const Session = require('../models/session');
const SavedCredentialsManager = require('../lib/saved-credentials-manager');

run();

async function run() {
  const sessions = await Session.find({ credentials: { $ne: null } }).exec();
  for (const { owner, partition, credentials: { password, email: login } } of sessions) {
    const res = await SavedCredentialsManager.saveOne({
      password,
      login,
      hostname: 'ticketmaster.com',
      userId: owner,
      partition
    });
    console.log(res);
  }
}
