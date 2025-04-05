const ProxyChain = require('proxy-chain');
const { server: { port }, luminati, mysterium, soax, isDebug } = require('../../config');
const { checkProxyPassword } = require('./session-manager');
const { writeLog } = require('./logger');
const TrafficManager = require('./traffic-manager');
const UserCache = require('../caches/user-cache');

const userIdConnectionIdMap = new Map();

const proxyServer = new ProxyChain.Server({
  port,
  verbose: isDebug,
  prepareRequestFunction: async ({ username: login, password, connectionId }) => {
    if (!login) {
      return { requestAuthentication: true, upstreamProxyUrl: null };
    }
    try {
      // type-[user/admin/internal]-token-[qwe123]-session-[session123]-country-[us]-state-[ca]-provider-[mysterium]-israndom-[true/false]
      const loginProps = {};
      login.split('-').forEach((item, index, array) => {
        if (index % 2 !== 0) return;
        loginProps[item] = array[index + 1];
      });
      const { type, token, session, country, state, provider, israndom } = loginProps;

      const isInternal = type === 'internal';
      const user = !isInternal && await UserCache.get(token);
      const userId = user && user.id;

      if (!isInternal) {
        //await checkConnectionAllowed(user);
        checkProxyPassword({ password: decodeURIComponent(password), userId });
      }

      userIdConnectionIdMap.set(connectionId, { userId, isInternal, provider });

      const { proxyHeaders, upstreamProxyUrl } = getUpstreamProxy({
        session,
        country,
        state,
        provider,
        israndom,
        isInternal
      });
      return { requestAuthentication: false, upstreamProxyUrl, proxyHeaders }; // TODO: update ProxyChain
    } catch (e) {
      throw new ProxyChain.RequestError(e.message, e.status || 500);
    }
  }
});

proxyServer.on('connectionClosed', ({ connectionId, stats }) => {
  const { userId, isInternal, provider } = updateUserIdConnectionIdMap(connectionId);
  TrafficManager.updateTrafficMaps({ userId, isInternal, stats, provider });
});

proxyServer.on('requestFailed', async ({ request, error }) => {
  writeLog(`Request ${request.url} failed`, error.message || null);
});

proxyServer.listen();

function getUpstreamProxy(proxyInfo) {
  const proxy = {};

  if (!proxyInfo || proxyInfo.isInternal) {
    const zone = proxyInfo && proxyInfo.isInternal ? luminati.sharedResZone : luminati.dataCenterZone;
    const login = `lum-customer-${luminati.customer}-zone-${zone.name}-country-${luminati.defaultTargetingCountry}`;
    proxy.upstreamProxyUrl = `http://${login}:${zone.password}@${luminati.host}:${luminati.port}`;

  } else if (proxyInfo.provider === 'luminati' || !proxyInfo.provider) {
    const zone = proxyInfo.israndom === 'true' ? luminati.sharedResZone : luminati.sharedResZone;
    const state = proxyInfo.state ? `-state-${proxyInfo.state}` : '';
    const location = `country-${proxyInfo.country}${state}`;
    const login = `lum-customer-${luminati.customer}-zone-${zone.name}-${location}-session-${proxyInfo.session}`;
    proxy.upstreamProxyUrl = `http://${login}:${zone.password}@${luminati.host}:${luminati.port}`;

  } else if (proxyInfo.provider === 'soax') {
    var state = proxyInfo.state;
    if(state.indexOf(' ') !==-1){
      state = state.replace(" ", "+");
    }
    soax.password = 'wifi;us;;'+state+';';
    soax.port = Math.floor(Math.random() * 870)+9129;
    proxy.upstreamProxyUrl = `http://${soax.login}:${soax.password}@${soax.host}:${soax.port}`;

  } else if (['mysterium', 'mysterium_us2'].includes(proxyInfo.provider)) {
    const isMystRegular = proxyInfo.provider === 'mysterium';
    const host = isMystRegular ? 'host' : 'host_us2';
    proxy.upstreamProxyUrl = `https://${mysterium.username}:${mysterium.password}@${mysterium[host]}:${mysterium.port}`;
    if (isMystRegular) {
      proxy.proxyHeaders = { 'Session-Id': proxyInfo.session };
      if (proxyInfo.state) proxy.proxyHeaders.State = proxyInfo.state;
    }
  }

  return proxy;
}

function updateUserIdConnectionIdMap(connectionId) {
  const { userId, isInternal, provider } = userIdConnectionIdMap.get(connectionId);
  userIdConnectionIdMap.delete(connectionId);
  return { userId, isInternal, provider };
}

async function checkConnectionAllowed(user) {
  let totalSpent = await TrafficManager.getUsage(user && user.id);
  if (!user || user.isDeleted || totalSpent > user.trafficLimit) {
    const error = new Error('You have exceeded your traffic limit or used machine count');
    error.status = 403;
    throw error;
  }
}
