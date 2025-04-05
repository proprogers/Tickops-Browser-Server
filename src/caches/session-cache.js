const model = require('../models/session');
const Cache = require('./cache');
const { server: { intervals: { updateSessionsCache: interval } } } = require('../../config');

// not used anywhere
class SessionCache extends Cache {
  constructor() {
    super({ interval, model, isUpdateOnChange: true });
  }

  async _getData() {
    const sessions = await model.find({}).exec();
    const array = sessions.map((curr) => {
      const id = curr.partition;
      delete curr.id;
      return [id, curr];
    });
    return new Map(array);
  }

  async get(partition) {
    await super._waitForUpdate();
    const cache = super._getCache();
    return cache.get(partition);
  }
}

module.exports = new SessionCache();
