const Integrations = require('../models/integrations');

const fields = '-__v -owner';

async function getServiceUser({service, owner}){
  return await Integrations.findOne({ service, owner }).exec();
}

async function getTokenUser({key}){
  return await Integrations.findOne({ key}).exec();
}

async function get({ service, key }) {
  return service
    ? [await Integrations.findOne({service}).exec()]
    : key
      ? [await Integrations.findOne({key}).exec()]
      : Integrations.find({}).exec();
}


async function saveOne({ data, userId }) {
  return new Integrations({ ...data, owner: userId }).save();
}

async function getListByUser(owner) {
  return Integrations.find({ owner }, fields).sort('-date').exec();
}

async function editOne({ id, data }) {
  return Integrations.findByIdAndUpdate(id, data, { new: true }).exec();
}

async function removeOne(id) {
  return Integrations.findByIdAndDelete(id).exec();
}

module.exports = { get, saveOne, getListByUser, getServiceUser, getTokenUser,editOne, removeOne };
