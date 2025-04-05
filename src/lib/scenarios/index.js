const { getTicketMasterReese84Token } = require('./puppeteer');
const { writeLog } = require('../logger');
const SettingsManager = require('../settings-manager');
const Reese = require('../../models/reese');
const { isDebug, server: { intervals } } = require('../../../config');

const dayMilliseconds = 60 * 60 * 24 * 1000;

async function saveNewReeseToken() {
  const tokenName = 'reese84';
  const url = await SettingsManager.get(`${tokenName}Url`);
  if (!url) {
    writeLog('No reese84 url found in settings');
    return;
  }
  try {
    const token = await getTicketMasterReese84Token({ url, tokenName });
    await Reese.create({ token });
  } catch (e) {
    writeLog(`Couldn't get ${tokenName} token`, e.message);
  }
  try {
    const now = Date.now();
    const yesterday = new Date(now - dayMilliseconds);
    await Reese.deleteMany({ createdAt: { $lt: yesterday } });
  } catch (e) {
    writeLog('Cannot clear old reese84 tokens', e.message);
  }
}
