const { sendMessage } = require('../lib/web-sockets-manager');
const { get } = require('../lib/user-manager');

async function openLink({ url, tabsNumber = 1, login }) {
  const [user] = await get({ email: login });
  if (!user) {
    throw new Error(`User with login [${login}] not found`);
  }
  sendMessage({ value: { link: url, tabsNumber }, userId: user.id });
}

module.exports = { openLink };
