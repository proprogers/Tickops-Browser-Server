const model = require('../models/special-url');
const Cache = require('./cache');
const { server: { intervals: { updateSpecialUrls: interval } } } = require('../../config');

class SpecialUrlCache extends Cache {
  constructor() {
    super({ interval });
  }

  async _getData() {
    const list = await model.find({}).exec();
    return list.map((url) => new RegExp(`^(.*?\.)?${url.secondLevelDomain}\.${url.topLevelDomain}`));
  }

  async isUrlMatches(hostname) {
    await super._waitForUpdate();
    const cache = super._getCache();
    return cache.some((url) => url.test(hostname));
  }
}

module.exports = new SpecialUrlCache();
