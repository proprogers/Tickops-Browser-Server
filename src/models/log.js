require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  message: { type: String, required: true },
  error: { type: String, default: '-' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Log', schema);
