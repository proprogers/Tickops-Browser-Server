require('../lib/mongoose');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  owner: { type: String, ref: 'User', required: true },
  partition: { type: String, default: null, ref: 'Session' },
  cardNumber: { type: String, required: true },
  cardExpMonth: { type: String, required: true },
  cardExpYear: { type: String, required: true },
  cardCvc: { type: String, required: true },
  nameOnCard: { type: String, required: true },
  country: { type: String, default: null },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  province: { type: String, default: null },
  city: { type: String, default: null },
  zip: { type: String, default: null },
  address1: { type: String, default: null },
  address2: { type: String, default: null },
  tel: { type: String, default: null },
  email: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PaymentData', schema);
