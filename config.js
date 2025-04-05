const mergeJSON = require('merge-json');
const extraConfig = process.env.CONFIG_PATH ? require(process.env.CONFIG_PATH) : {};

const minute = 1000 * 60;
const hour = minute * 60;
const fiveMinutes = minute * 5;

const config = {
  server: {
    platform: process.platform === 'darwin' ? 'MacIntel' : 'Win32',
    database: {
      host: '35.224.111.142'
    },
    intervals: {
      cleanUserIpCache: minute,
      updateSpecialUrls: minute * 10,
      updateTraffic: fiveMinutes,
      updateUsersCache: fiveMinutes,
      updateSessionsCache: fiveMinutes,
      updatePhoneNumbersCache: fiveMinutes,
      syncProxies: hour,
      updateProxiesCache: minute * 10,
      updateUserAgents: hour * 24,
      getNewReeseToken: hour,
    },
    secretKeys: {
      token: 'pineapple',
      proxyPassword: 'sugar',
      userPassword: 'MZqYyxcq88B3GQxx',
      managerAuth: 'b50d9323-fc6a-4dd0-86cf-dfb6e3bac8e9',
      textchestToken: 'c5b7f901-42a4-42b1-8d07-ae381f170721'
    },
  },
  luminati: {
    BASE_API_URL: 'https://luminati.io/api/',
    host: 'zproxy.lum-superproxy.io',
    port: 22225,
    customer: 'c_154c57cc',
    login: 'vysotskiy.petr@gmail.com',
    password: 'Hw2YwQJPDfq9',
    token: 'b96b2780e10de00308968303777324dd',
    defaultTargetingCountry: 'us',
    dataCenterZone: {
      name: "browser_data_center",
      password: "v0gk68l9xirt"
    },
    sharedResZone: {
      name: "browser_shared_res",
      password: "baew7re1z88n"
    },
    zone: {
      name: "browser_prod",
      password: "z3vkcrds30u3"
    }

  },
  mysterium: {
    host: 'supernode-tickops-us.mysterium.network',
    host_us2: 'supernode-tickops-us2.mysterium.network',
    port: 10001,
    username: 'tickops',
    password: 'tBf9iymAM6afNLVY3HuRKb4n'
  },
  soax:{
    host: 'proxy.soax.com',
    port: 9001,
    login:'gSWUaLhJhOvHcR7K',
    password: 'wifi;us;;;'
  },
  sentry: {
    dsn: 'https://8e70a728cf8b479d8ed4fc6c76b80172@o361133.ingest.sentry.io/5842717',
  },
};

module.exports = mergeJSON.merge(config, extraConfig);
