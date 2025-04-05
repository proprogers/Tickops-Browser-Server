const model = require('../models/user');
const Cache = require('./cache');
const { server: { intervals: { updateUsersCache: interval } } } = require('../../config');

class UserCache extends Cache {
  constructor() {
    super({ interval, model, isUpdateOnChange: true });
  }

  async _getData() {
    const users = await model.find({}).exec();
    const array = users.map((curr) => [curr.token, curr]);
    return new Map(array);
  }

  async get(token) {
    await super._waitForUpdate();
    const cache = super._getCache();
    return cache.get(token);
  }
}

module.exports = new UserCache();
