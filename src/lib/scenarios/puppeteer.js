const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth')();
const timezoneSetter = require('./timezone-setter')();
const IdentityGenerator = require('../identity-generator');
const { writeLog } = require('../logger');
const { server, luminati } = require('../../../config');

pluginStealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(pluginStealth);
puppeteer.use(timezoneSetter);

const defaultTimeout = 90000;

async function getTicketMasterReese84Token({ url, tokenName, attemptCount = 3 }) {
  const platform = process.platform === 'darwin' ? 'MacIntel' : 'Win32';
  const identity = await IdentityGenerator.generate(platform);
  const browser = await loadBrowser(identity.agent);
  try {
    const page = await createPage(browser);
    await page.goto(url);
    await page.waitForNavigation({ timeout: defaultTimeout });
    const cookies = await page.evaluate('document.cookie');
    const cookie = cookies.split(';')
      .find((str) => str.trim().startsWith(tokenName));
    return cookie.split('=').slice(1).join('');
  } catch (e) {
    writeLog(`getTicketMasterReese84Token error, attempt ${attemptCount}`, e.message);
    if (attemptCount === 0) throw e;
    await getTicketMasterReese84Token({ url, tokenName, attemptCount: attemptCount - 1 });
  } finally {
    const pages = await browser.pages();
    for (const page of pages) {
      await page.removeAllListeners();
    }
    await browser.close();
  }
}

async function loadBrowser(agent) {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      `--proxy-server=${server.host}:${server.port}`,
      `--user-agent=${agent}`,
      `--lang=en`,
    ],
  });
}

async function createPage(browser) {
  const page = await browser.newPage();
  await page.authenticate({
    username: `type-internal-country-${luminati.defaultTargetingCountry}`,
    password: '',
  });
  page.setDefaultTimeout(defaultTimeout);
  return page;
}

module.exports = { getTicketMasterReese84Token };
