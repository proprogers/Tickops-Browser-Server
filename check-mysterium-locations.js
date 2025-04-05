const states = require('./src/consts/us-states.json').map(([abr, { mysterium }]) => mysterium);
const { mysterium } = require('./config');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

run();

async function run() {
  let count = 0;
  for (const state of states) {
    try {
      await checkMysteriumLocation(state);
      console.log(++count, state);
    } catch (e) {
      console.error(state, e.response.status);
    }
  }
}

async function checkMysteriumLocation(state) {
  return axios({
    method: 'get',
    url: 'https://ipinfo.io',
    proxy: false,
    httpsAgent: new HttpsProxyAgent({
      protocol: 'https:',
      host: mysterium.host,
      port: mysterium.port,
      auth: `${mysterium.username}:${mysterium.password}`,
      headers: { State: state }
    })
  });
}
