const { server: { host, port } } = require('../../../config');
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth')();
const timezoneSetter = require('./timezone-setter')();
const { writeLog } = require('../logger');
const Interceptor = require('./request-interceptor');
const { keyword, defaultTimeout, selectors, urls } = require('../../consts/proxy-checker');
const { filterBan, filterSignInBan, filterAxs } = require('./ban-filters');
const { newWindowOpen, waitForFrameNavigated, waitForConsoleEvent } = require('./utils');

pluginStealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(pluginStealth);
puppeteer.use(timezoneSetter);

let interceptor;

async function checkIp({ timezone, agent, sessionId, location }) {
  timezoneSetter.set(timezone);
  const browser = await loadBrowser(agent);
  setRequestInterception(browser);
  try {
    return await check({ timezone, agent, sessionId, location, browser });
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
    headless: false,
    args: [
      '--no-sandbox',
      `--proxy-server=${host}:${port}`,
      // `--proxy-server=supernode-us.mysterium.network:10001`,
      // `--proxy-header=userid:session-123`
      `--user-agent=${agent}`,
      `--lang=en`,
    ],
  });
}

function setRequestInterception(browser) {
  browser.on('targetcreated', async target => {
    if (target.type() !== 'page') return;

    const page = await target.page();
    await page.setRequestInterception(true);

    interceptor = new Interceptor(page);
  });
}

async function check({ sessionId, location, browser }) { // TODO: check event url to be tm not tw etc.
  const errors = [];

  let page = await createPage({ sessionId, location, browser });
  // await loadUrl({ page, url: 'https://2ip.ru' });
  await Promise.race([
    interceptor.waitFor(filterBan),
    loadUrl({ page, url: urls.ticketmaster.main }),
  ]);

  try {
    await Promise.race([
      interceptor.waitFor(filterSignInBan),
      checkSignIn(page),
    ]);
  } catch (e) {
    errors.push(e);
    await loadUrl({ page, url: urls.ticketmaster.main });
  }

  try {
    await seeTickets({ page, sessionId, location, browser });
  } catch (e) {
    errors.push(e);
    page = await createPage({ sessionId, location, browser });
    await Promise.race([
      interceptor.waitFor(filterBan),
      loadUrl({ page, url: urls.ticketmaster.event }),
    ]);
    try {
      await seeTickets({ page, sessionId, location, browser });
    } catch (e) {
      errors.push(e);
    }
  }

  try {
    await Promise.race([
      interceptor.waitFor(filterAxs),
      loadUrl({ page, url: urls.axs.main }),
    ]);
  } catch (e) {
    errors.push(e);
  }

  return errors;
}

async function seeTickets({ page, sessionId, location, browser }) {
  const url = await Promise.race([
    interceptor.waitFor(filterBan),
    openEvent(page),
  ]);

  page = await createPage({ sessionId, location, browser });
  await Promise.race([
    interceptor.waitFor(filterBan),
    loadUrl({ page, url }),
  ]);
}

async function pickEvent(page) {
  if (page.url() !== urls.ticketmaster.main) return;
  await page.waitForSelector(selectors.discoverConcertsButton);
  await page.click(selectors.discoverConcertsButton);
  await page.waitForNavigation();
  await page.waitForSelector(selectors.locationPanelHeader);

  const headerHandle = await page.$(selectors.locationPanelHeader);
  const handleProperty = await headerHandle.getProperty('textContent');
  const text = await handleProperty.jsonValue();
  const eventNumber = text.replace(/\D+/g, '');
  if (eventNumber === '0') {
    throw new Error('No events');
  }
}

async function openEvent(page) {
  await pickEvent(page);

  page.evaluate(newWindowOpen);

  await page.waitForSelector(selectors.seeTicketsButton);

  const consolePromise = waitForConsoleEvent({
    page, filter: text => text.startsWith('tickets')
  });

  await page.click(selectors.seeTicketsButton);

  const text = await consolePromise;
  return text.split(' ')[1];
}

async function checkSignIn(page) {
  const promise = waitForFrameNavigated({ page, url: urls.ticketmaster.auth }); //
  await page.waitForSelector(selectors.signInButton);
  await page.click(selectors.signInButton);
  const frame = await promise; //
  await frame.waitForSelector(selectors.closeSignInButton);
  await frame.waitForSelector(selectors.spinner, { hidden: true });
  await frame.click(selectors.closeSignInButton);
}

async function createPage({ sessionId, location, browser }) {
  const page = await browser.newPage();
  await page.authenticate({
    username: `${keyword}-1-${sessionId}-${location}`,
    password: keyword
    // username: `tickops`,
    // password: 'PVQoMhtinRVFRzsQr99UdYjF'
  });
  page.setDefaultTimeout(defaultTimeout);

  return page;
}

async function loadUrl({ page, url }) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return page;
  } catch (e) {
    writeLog('Load page error', e.message);
    e.status = -1;
    throw e;
  }
}

module.exports = { checkIp };
