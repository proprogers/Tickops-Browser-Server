const Session = require('../models/session');
const User = require('../models/user');

// run();
// save db before do it
async function run() {
  const users = await User.find({}).exec();
  const usersMap = new Map(users.map((user) => [user.id, user]));
  const sessions = await Session.find({ credentials: { $ne: null } }).exec();
  // type-[user/admin]-token-[qwe123]-session-[session123]-country-[us]-state-[ca]-provider-[mysterium]
  // type-user-token-25c18978913a46cda3fe14cb2f5-session-1627549081448-country-us-state-texas-provider-mysterium
  // user-5f1c401b6a87933ea023c9d0-1627549081448-us-texas-mysterium
  for (const { id, proxy: { login }, owner } of sessions) {
    const [prefix, userId, sessionId, country, state, provider] = login.split('-');
    const token = usersMap.get(owner).token;
    const newLogin = `type-${prefix}-token-${token}-session-${sessionId}-country-${country}-state-${state}-provider-${provider}`;
    await Session.findByIdAndUpdate(id, { 'proxy.login': newLogin });
  }
}
