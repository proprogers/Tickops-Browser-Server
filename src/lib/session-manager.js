const { server, mysterium, luminati, soax } = require('../../config');
const IdentityGenerator = require('./identity-generator');
const Session = require('../models/session');
const User = require('../models/user');
const ProxyCache = require('../caches/proxy-cache');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const PhoneNumberManager = require('./phone-number-manager');
const LocationManager = require('./location-manager');
const PaymentDataManager = require('../lib/payment-data-manager');
const SavedCredentialsManager = require('../lib/saved-credentials-manager');
const { getHash } = require('./utils');
const states = require('../consts/us-states.json');
const fields = '-_id -__v -owner';

async function getSaved(owner) {
  return Session.find({ owner, credentials: { $ne: null } }, fields).exec();
}

async function getRandom({ owner, platform, count, proxyProvider, token }) {
  const { proxy, partition, timezone } = await getSessionInfo({ owner, count, isRandom: true, proxyProvider, token });
  const identity = await IdentityGenerator.generate(platform);
  return { partition, proxy, timezone, identity };
}

async function set({ owner, credentials, platform, proxyProvider, token, paymentDataId, userProxy }) {
  const { proxy, partition, timezone } = await getSessionInfo({ owner, proxyProvider, token, userProxy });
  const identity = await IdentityGenerator.generate(platform);

  const newSessions = [];
  newSessions.push({ owner});
  await Session.insertMany(newSessions);

  const session = await Session.findOneAndUpdate({ owner, credentials: null }, {
    timestamp: Date.now(),
    identity,
    credentials,
    paymentDataId,
    proxy,
    partition,
    timezone,
  }, { new: true, fields }).exec();

  if (credentials.tel) {
    await PhoneNumberManager.save({ number: credentials.tel, owner, partition });
  }
  return session;
}

async function getSessionInfo({ owner, count = '', isRandom = false, proxyProvider = 'mysterium', token, userProxy }) {
  let locationInfo, timezone, location, stateIsoCode, countryIsoCode;
  ///a.n.c
  const user = await User.findById(owner).exec();

  const sessionId = Date.now() + count;

  if (userProxy) {
    try {
      const { data } = await checkLocation({
        provider: 'custom',
        username: userProxy.username,
        password: userProxy.password,
        port: userProxy.port,
        host: userProxy.host
      });
      timezone = data.timezone;
      locationInfo = `${data.region}, ${data.country.toUpperCase()}`;
    } catch (e) {
      const status = e.status || e.response && e.response.status;
      switch (status) {
        case 407:
          e.message = 'Invalid proxy auth';
          break;
        default:
          e.message = 'Invalid proxy';
          break;
      }
      throw e;
    }
  } else if (proxyProvider === 'luminati') {
    if (isRandom) {
      var country = 'us';

      if(user.email.indexOf("_uk") !== -1){
        country = 'uk';
      }

      const { data } = await checkLocation({
        provider: 'luminati',
        username: `lum-customer-${luminati.customer}-zone-${luminati.sharedResZone.name}-country-${country}-session-${sessionId}`,
        password: luminati.sharedResZone.password,
        port: luminati.port,
        host: luminati.host
      });
      customer_server = `lum-customer-${luminati.customer}-zone-${luminati.sharedResZone.name}-country-${country}-session-${sessionId}`;
      password_server = luminati.sharedResZone.password;
      proxy_server = `${luminati.host}:${luminati.port}`;
      locationInfo = `${data.region}, ${data.country.toUpperCase()}`;
      timezone = data.timezone;
      location = ['country', country].join('-');

      // 'state', LocationManager.getIsoByStateName(data.region)
    } else {
      const proxy = await ProxyCache.get();
      stateIsoCode = proxy.stateIso;
      stateInfo = LocationManager.getInfo(stateIsoCode);
      countryIsoCode = proxy.countryIso;
      location = ['country', countryIsoCode.toLowerCase(), 'state', proxy.stateIso].join('-');
      locationInfo = proxy.infoString || 'Unknown';
      timezone = stateInfo.timezone;

      if(user.email.indexOf("_uk") !== -1){
        countryIsoCode = 'uk';
        location = ['country', countryIsoCode.toLowerCase(), 'state', 'gb'].join('-');
        locationInfo = 'London, UK';
        timezone = 'Europe/London';
      }

    }
  } else if(proxyProvider === 'mysterium') {
    let count = 0;
    let stateIso, stateInfo; // [] - temp
    while (true) {
      const states = ['ca', 'ny', 'tx'];
      stateIso = states[Math.floor(Math.random() * states.length)]; // temp
      try {
        stateInfo = LocationManager.getInfo(stateIso);
        await checkLocation({
          sessionId,
          state: stateInfo.mysterium,
          provider: 'mysterium',
          username: mysterium.username,
          password: mysterium.password,
          port: mysterium.port,
          host: mysterium.host
        });

        customer_server = mysterium.username;
        password_server = mysterium.password;
        proxy_server = mysterium.host + ':' + mysterium.port;

        break;
      } catch (e) {
        if (count > 5) {
          throw new Error('Unable to get any proxy node'); // 'Proxies of your area is temporary unavailable'
        }
        count++;
      }
    }
    countryIsoCode = 'us';

    if(user.email.indexOf("_uk") !== -1){
        countryIsoCode = 'uk';
    }

    stateIsoCode = stateIso;
    location = ['country', countryIsoCode, 'state', stateInfo.mysterium].join('-');
    locationInfo = `${stateInfo.name}, ${countryIsoCode.toUpperCase()}`;
    timezone = stateInfo.timezone;
  } else if(proxyProvider === 'soax'){
    // if (isRandom) {
      const states = ["delaware","massachusetts","west virginia","california","kentucky","arkansas","north carolina","nevada", "washington","georgia","pennsylvania","rhode island","new mexico","maine","vermont","alaska","colorado","district of columbia","north dakota","minnesota","oregon","virginia","ohio","illinois","wyoming","new york","louisiana","kansas","montana","new hampshire","idaho","missouri","hawaii","arizona","connecticut","alabama","iowa","indiana","oklahoma","florida","south carolina","nebraska","tennessee","maryland","mississippi","south dakota","utah","new jersey","michigan","wisconsin"];
      var state = states[Math.floor(Math.random() * states.length)];
      if(state.indexOf(' ') !==-1){
        var state_revis = state.replace(" ", "+");
      } 
      soax.password = state_revis ? 'wifi;us;;'+state_revis+';' : 'wifi;us;;'+state+';';
      soax.port = Math.floor(Math.random() * 999)+9000;

      const { data } = await checkLocation({
              provider: 'soax',
              username: soax.login,
              password: soax.password,
              port: soax.port,
              host: soax.host
      });
      proxy_server = soax.host + ':' + soax.port;
      countryIsoCode = 'us';
      timezone = data.timezone;
      location = ['country', countryIsoCode, 'state', state].join('-');
      locationInfo = `${state}, ${data.country.toUpperCase()}`;
    // } else {
    //   const proxy = await ProxyCache.get();
    //   stateIsoCode = proxy.stateIso;
    //   stateInfo = LocationManager.getInfo(stateIsoCode);
    //   countryIsoCode = proxy.countryIso;
    //   location = ['country', countryIsoCode.toLowerCase(), 'state', proxy.stateIso].join('-');
    //   locationInfo = proxy.infoString || 'Unknown';
    //   timezone = stateInfo.timezone;
    // }
  }

  const type = isRandom ? 'admin' : 'user';
  const login = userProxy
    ? userProxy.username
    : ['type', type, 'token', token, 'session', sessionId, location, 'provider', proxyProvider, 'israndom', isRandom].join('-');
  const password = userProxy
    ? userProxy.password
    : getHashForProxyPassword(owner);
  const address = userProxy ? `${userProxy.host}:${userProxy.port}` : `${server.host}:${server.port}`
 
  // type-[user/admin]-token-[qwe123]-session-[session123]-country-[us]-state-[ca]-provider-[mysterium]-israndom-[true/false]
  return {
    partition: `persist:s_${sessionId}`,
    timezone,
    token,
    proxy: {
      isCustom: !!userProxy,
      info: locationInfo,
      address,
      login,
      password,
      proxy_server:address,
      customer_server:login,
      password_server:password,
    }
  };
}

async function edit({ owner, body }) {
  if (!body) return;
  const paymentDataId = body.paymentDataId;
  const previousPaymentDataId = body.previousPaymentDataId;
  const dataToUpdate = body;
  if (body.tel) {
    dataToUpdate['credentials.tel'] = body.tel;
    await PhoneNumberManager.remove({ number: body.oldTel, owner, partitions: [body.partition] });
    await PhoneNumberManager.save({ owner, partition: body.partition, number: body.tel });
  }
  if (body.proxy) {
    dataToUpdate['proxy.password'] = body.proxy.password;
    dataToUpdate['proxy.login'] = body.proxy.login;
    dataToUpdate['proxy.address'] = body.proxy.address;
    dataToUpdate['proxy.proxy_server'] = body.proxy.proxy_server;
    dataToUpdate['proxy.customer_server'] = body.proxy.customer_server;
    dataToUpdate['proxy.password_server'] = body.proxy.password_server;
  }
  if (paymentDataId !== previousPaymentDataId) {
    dataToUpdate.paymentDataId = paymentDataId;
    if (previousPaymentDataId) {
      await PaymentDataManager.editOne({ id: previousPaymentDataId, data: { partition: null } });
    }
    if (paymentDataId) {
      await PaymentDataManager.editOne({ id: paymentDataId, data: { partition: body.partition } });
    }
  }
  delete body.proxy;
  return Session.findOneAndUpdate({ partition: body.partition, owner }, dataToUpdate, { new: true }).exec();
}

async function refresh({ owner, partition, sessionLogin }) {
  const currId = Date.now();
  const loginArray = sessionLogin.split('-');
  const index = loginArray.findIndex((curr) => curr === 'session');
  if (index === -1) throw new Error('No previous session detected');
  const prev = loginArray.splice(index + 1, 1, currId);
  const prevId = prev[0];
  const newLogin = loginArray.join('-');
  await Session.findOneAndUpdate({ partition, owner }, { 'proxy.login': newLogin }).exec();
  return { prevId, currId, newLogin };
}

async function updateLogins({ owner, token }) {
  const allUserSessions = await Session.find({ owner, credentials: { $ne: null } }).exec();
  const modifiedSessions = allUserSessions.map(({ proxy, partition }) => {
    const loginArray = proxy.login.split('-');
    const index = loginArray.findIndex((curr) => curr === 'token');
    if (index !== -1){
      loginArray.splice(index + 1, 1, token);
      return {
        updateOne: {
          filter: { partition },
          update: { 'proxy.login': loginArray.join('-') }
        }
      }
    } else {
      return {
        updateOne: {
          filter: { partition },
          update: { 'proxy.login': proxy.login}
        }
      }
    }
  });
  await Session.bulkWrite(modifiedSessions);
}

async function remove({ owner, partitions }) {
  const filter = {
    $or: partitions.map((partition) => {
      return { owner, partition };
    })
  };
  const sessions = await Session.find(filter).exec();
  const sessionNumbersSet = new Set(sessions.map(({ credentials }) => credentials.tel));
  for (const number of sessionNumbersSet) {
    await PhoneNumberManager.remove({ number, owner, partitions });
  }
  const res = await Session.updateMany(filter, {
    identity: null,
    credentials: null,
    proxy: null,
    partition: null,
    timezone: null
  }).exec();
  const credentialsIds = await SavedCredentialsManager.resetAttachedSession(partitions);
  return { credentialsIds, res };
}

async function checkLocation({ state, sessionId, provider, username, password, port, host }) {
  const config = {};
  if (provider === 'mysterium') {
    config.headers = { 'Session-Id': sessionId };
    if (state) config.headers.State = state;
  }
  return axios({
    ...config,
    method: 'get',
    url: 'https://ipinfo.io',
    proxy: false,
    httpsAgent: new HttpsProxyAgent({
      protocol: 'http:',
      host,
      port,
      auth: `${username}:${password}`,
    })
  });
}

async function syncProxyProvider({ provider, userIds }) {
  const sessions = await Session.find({ owner: { $in: userIds }, credentials: { $ne: null } }).exec();
  const modifiedSessions = [];
  for (const { proxy, partition } of sessions) {
    let state, timezone, infoString;
    switch (provider) {
      case 'luminati':
        const newProxy = await ProxyCache.get();
        state = newProxy.stateIso;
        infoString = newProxy.infoString || 'Unknown';
        timezone = newProxy.timezone;
        break;
      case 'mysterium':
        // TODO
        throw new Error('Mysterium sessions reprovidering is not supported yet');
      case 'soax':
        // TODO
        throw new Error('Soax sessions reprovidering is not supported yet');
      default:
        return;
    }
    const loginArray = proxy.login.split('-');
    const stateKeyIndex = loginArray.findIndex((curr) => curr === 'state');
    const providerKeyIndex = loginArray.findIndex((curr) => curr === 'provider');
    if (stateKeyIndex === -1 || providerKeyIndex === -1) throw new Error('Unknown error updating sessions providers');
    loginArray.splice(stateKeyIndex + 1, 1, state);
    loginArray.splice(providerKeyIndex + 1, 1, provider);
    modifiedSessions.push({
      updateOne: {
        filter: { partition },
        update: {
          'proxy.login': loginArray.join('-'),
          'proxy.info': infoString,
          timezone,
        }
      }
    });
  }
  await Session.bulkWrite(modifiedSessions);
}

function getHashForProxyPassword(userId) {
  return getHash({ string: userId, salt: server.secretKeys.proxyPassword });
}

function checkProxyPassword({ password, userId }) {
  const passwordHash = getHashForProxyPassword(userId);
  if (password !== passwordHash) throw new Error('Invalid password');
}

module.exports = {
  set,
  edit,
  refresh,
  getSaved,
  getRandom,
  remove,
  updateLogins,
  checkProxyPassword,
  syncProxyProvider
};
