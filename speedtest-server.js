// const express = require('express');
// const cors = require('cors')();
// const app = express();
// const port = 3000;
// app.use(express.json());
// app.listen(port);

const ProxyChain = require('proxy-chain');

const proxyServer = new ProxyChain.Server({
  port: 8020,
  verbose: false,
  prepareRequestFunction: async ({ username: login, password, connectionId }) => {
    if (!login) {
      return { requestAuthentication: true, upstreamProxyUrl: null };
    }
    try {
      const loginProps = {};
      login.split('-').forEach((item, index, array) => {
        if (index % 2 !== 0) return;
        loginProps[item] = array[index + 1];
      });
      const { session, state } = loginProps;
      const upstreamProxyUrl = 'https://tickops:tBf9iymAM6afNLVY3HuRKb4n@supernode-tickops-us.mysterium.network:10001';
      const proxyHeaders = {
        "Session-Id": session,
        "State": state
      };
      return { requestAuthentication: false, upstreamProxyUrl, proxyHeaders };
    } catch (e) {
      throw new ProxyChain.RequestError(e.message, e.status || 500);
    }
  }
});

proxyServer.on('connectionStarted', () => console.log('connectionStarted', Date.now()));
proxyServer.on('tunnelConnectResponded', () => console.log('tunnelConnectResponded', Date.now()));

proxyServer.listen();
