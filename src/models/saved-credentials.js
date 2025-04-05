require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  owner: { type: String, ref: 'User', required: true },
  partition: { type: String, default: null, ref: 'Session' },
  hostname: { type: String, default: null },
  login: { type: String, default: null },
  password: { type: String, default: null },
});

module.exports = mongoose.model('SavedCredentials', schema);
