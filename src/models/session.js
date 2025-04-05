require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  partition: { type: String, default: null },
  owner: { type: String, default: null, ref: 'User' },
  timezone: { type: String, default: null },
  proxy: { type: Object, default: null },
  identity: { type: Object, default: null },
  credentials: { type: Object, default: null },
  paymentDataId: { type: String, default: null, ref: 'PaymentData' },
  timestamp: { type: Date, default: null } // = savedAt
}, { timestamps: true });

const emitChange = async () => await model.emit('change');
schema.post('save', emitChange);
schema.post('insertMany', emitChange);
schema.post('updateOne', emitChange);
schema.post('findOneAndUpdate', emitChange);
schema.post('updateMany', emitChange);
schema.post('deleteMany', emitChange);

const model = mongoose.model('Session', schema);

module.exports = model;
