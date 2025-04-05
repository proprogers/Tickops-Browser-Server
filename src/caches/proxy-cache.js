const Cache = require('./cache');
const model = require('../models/proxy');
const { server: { intervals: { updateProxiesCache: interval } } } = require('../../config');

class ProxyCache extends Cache {
  // NOTE: cache excludes proxies with duplicated location
  constructor() {
    super({ interval, model, isUpdateOnChange: true });
  }

  async _getData() {
    const proxies = await model.find({ isFine: true }).exec();
    return new Map(proxies.map((curr) => [`${curr.countryIso}-${curr.stateIso}`, curr]));
  }

  _getRandomValue(collection) {
    const index = Math.floor(Math.random() * (collection.size - 1));
    let count = 0;
    for (const value of collection.values()) {
      if (count++ === index) return value;
    }
  }

  async get(location) {
    await super._waitForUpdate();
    let cache = super._getCache();
    if (!cache || !cache.size) {
      const error = new Error('No proxies in the pool');
      error.status = 503;
      throw error;
    }
    return (location && cache.get(location)) || this._getRandomValue(cache);
  }
}

module.exports = new ProxyCache();
