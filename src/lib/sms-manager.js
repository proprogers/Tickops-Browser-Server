const PhoneNumberManager = require('./phone-number-manager');
const { isDebug } = require('../../config');
const { sendMessage } = require('./web-sockets-manager');

async function forwardSmsText({ number, message }) {
  const docs = await PhoneNumberManager.get(number);
  if (!docs.length) {
    if (isDebug) {
      console.log(`No user for the ${number}`);
    }
    return;
  }
  for (const { owner } of docs) {
    try {
      sendMessage({ userId: owner, value: { number, message } });
    } catch (e) {
      console.error('SMS text forwarding error:', e);
    }
  }
}

module.exports = { forwardSmsText };
