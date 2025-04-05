const axios = require('axios');
const UserAgent = require('../models/user-agent');
const Session = require('../models/session');
const { server: { intervals }, isDebug } = require('../../config');
const { writeLog } = require('./logger');

const request = axios.create({
  baseURL: 'https://api.whatismybrowser.com/api/v2/',
  headers: { 'X-API-KEY': '4293d502489e7e57356495504409e7a5' }
});

setTimeout(updateUserAgents, 10000); // TODO: temp
setInterval(updateUserAgents, intervals.updateUserAgents);

async function updateUserAgents() {
  if (isDebug) return;
  let mac, win;
  try {
    const response = await request.get('software_version_numbers/chrome');
    const data = response.data.version_data.chrome;
    mac = data.macos;
    win = data.windows;
    mac.agent = mac.sample_user_agents.standard[0];
    win.agent = win.sample_user_agents.standard[0];
    const macParsed = await request.post('user_agent_parse', {
      user_agent: mac.agent
    });
    mac.platformVersion = macParsed.data.parse.operating_system_version_full.join('.');
  } catch (e) {
    writeLog('Error getting user agents', e.message);
    return;
  }

  const newUas = [{
    os: 'mac',
    browser: 'chrome',
    value: mac.agent,
    version: mac.latest_version[0],
    fullVersion: mac.latest_version.join('.'),
    platformVersion: mac.platformVersion
  }, {
    os: 'windows',
    browser: 'chrome',
    value: win.agent,
    version: win.latest_version[0],
    fullVersion: win.latest_version.join('.'),
    platformVersion: '10.0.0'
  }];

  writeLog('User-agents update happened', null, newUas.map(({ value }) => value)); // temp

  await UserAgent.deleteMany({});
  await UserAgent.insertMany(newUas);
  await updateSessionsUserAgents(newUas);
}

async function updateSessionsUserAgents(uas) {
  const userAgentsSet = new Set(uas.map(({ value }) => value));
  const sessions = await Session.find({ credentials: { $ne: null } }).exec();
  for (const { id, identity } of sessions) {
    if (userAgentsSet.has(identity.agent)) continue;
    const { value, version } = uas.find(({ os }) => identity.os === os);
    identity.agent = value;
    identity.version = version;
    await Session.findByIdAndUpdate(id, { identity }).exec();
  }
}
