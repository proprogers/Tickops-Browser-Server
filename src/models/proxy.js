require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  gip: { type: String, required: true },
  timezone: { type: String, default: null },
  countryIso: { type: String, default: null },
  stateIso: { type: String, default: null },
  city: { type: String, default: null },
  infoString: { type: String, default: 'Unknown' },
  isFine: { type: Boolean, default: true }
});

const emitChange = async () => await model.emit('change');
schema.post('insertMany', emitChange);
schema.post('deleteMany', emitChange);

const model = mongoose.model('Proxy', schema);

module.exports = model;
