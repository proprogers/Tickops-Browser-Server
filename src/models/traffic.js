const mongoose = require('mongoose');
require('../lib/mongoose');

const schema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  isInternal: { type: Boolean, required: true },
  sentBytes: { type: Number, min: 0 },
  receivedBytes: { type: Number, min: 0 },
  timestamp: { type: Date, default: Date.now },
  provider: { type: String }
});

module.exports = mongoose.model('Traffic', schema);
