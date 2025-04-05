require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  isAdmin: { type: Boolean, required: true },
  email: { type: String, trim: true, required: true },
  password: { type: String, required: true },
  token: { type: String },
  savedSessionsLimit: { type: Number, min: 0 },
  trafficLimit: { type: Number, min: 0 },
  deviceId: { type: String },
  deviceName: { type: String },
  isDeleted: { type: Boolean, default: false },
  masterPasswordSalt: { type: String },
  masterPasswordDoubleHash: { type: String },
  mpDecode: { type: String },
  sessionPasswordIv: { type: String },
  iv: { type: String },
  country: { type: String, default: "us"},
  status_type: { type: String, default: "activated"},
  type: { type: String, default: "primary"},
  owner: { type: String, default: "owner"},
  proxy_id: { type: String },
  proxyProvider: { type: String, default: "soax"},
  isCartingVisible: { type: Boolean, default: false }
});

const emitChange = async () => await model.emit('change');
schema.post('save', emitChange);
schema.post('findOneAndUpdate', emitChange);

const model = mongoose.model('User', schema)

module.exports = model;
