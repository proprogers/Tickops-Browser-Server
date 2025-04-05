const PaymentData = require('../models/payment-data');

const fields = '-__v -owner';

async function saveOne({ data, userId }) {
  return new PaymentData({ ...data, owner: userId }).save();
}

async function getListByUser(owner) {
  return PaymentData.find({ owner }, fields).sort('-date').exec();
}

async function editOne({ id, data }) {
  return PaymentData.findByIdAndUpdate(id, data, { new: true }).exec();
}

async function removeOne(id) {
  return PaymentData.findByIdAndDelete(id).exec();
}

module.exports = { saveOne, getListByUser, editOne, removeOne };
