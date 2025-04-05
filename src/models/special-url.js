require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  topLevelDomain: { type: String, trim: true, required: true },
  secondLevelDomain: { type: String, trim: true, required: true },
});

module.exports = mongoose.model('SpecialURL', schema);
