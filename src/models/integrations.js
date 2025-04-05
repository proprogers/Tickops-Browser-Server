require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  owner: { type: String, ref: 'User', required: true },
  service: { type: String, default: null},
  key: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Integrations', schema);
