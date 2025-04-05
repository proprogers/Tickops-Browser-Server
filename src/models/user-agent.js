require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  value: { type: String, required: true },
  os: { type: String, required: true },
  browser: { type: String, required: true },
  version: { type: String },
  fullVersion: { type: String },
  platformVersion: { type: String },
});

module.exports = mongoose.model('UserAgent', schema);
