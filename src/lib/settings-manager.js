const Setting = require('../models/setting');

async function get(key) {
  const doc = await Setting.findOne({ key }).exec();
  return doc && doc.value;
}

async function set(key, value) {
  return Setting.updateOne({ key }, { value }, { upsert: true }).exec();
}

module.exports = { get, set };
