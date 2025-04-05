require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  number: { type: String, required: true },
  owner: { type: String, required: true, ref: 'User' },
  partitions: [String],
});

module.exports = mongoose.model('PhoneNumber', schema);
