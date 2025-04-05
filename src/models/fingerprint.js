require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  hash: { type: String, required: true },
  data: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Fingerprint', schema);
