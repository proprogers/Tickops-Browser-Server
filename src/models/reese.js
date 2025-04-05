require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  token: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Reese', schema);
