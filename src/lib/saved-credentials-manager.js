const SavedCredentials = require('../models/saved-credentials');

const fields = '-__v -owner';

async function saveOne({ password, login, hostname, userId, partition }) {
  return new SavedCredentials({ password, login, hostname, owner: userId, partition }).save();
}

async function saveMany(data) {
  return SavedCredentials.insertMany(data);
}

async function getListByUser(owner) {
  return SavedCredentials.find({ owner }, fields).exec();
}

async function editOne({ id, data }) {
  return SavedCredentials.findByIdAndUpdate(id, data, { new: true }).exec();
}

async function editMany({ array, owner }) {
  for (const { ids, partition } of array) {
    if (!ids.length) continue;
    await SavedCredentials.updateMany({
      $or: ids.map((_id) => ({ _id, owner }))
    }, { partition }, { new: true }).exec();
  }
}

async function removeOne(id) {
  return SavedCredentials.findByIdAndDelete(id).exec();
}

async function resetAttachedSession(partitions) {
  const sc = await SavedCredentials.find({
    $or: partitions.map((partition) => {
      return { partition };
    })
  }).exec();
  const ids = [];
  const modifiedCredentials = sc.map(({ _id }) => {
    ids.push(_id);
    return {
      updateOne: {
        filter: { _id },
        update: { partition: null }
      }
    };
  });
  await SavedCredentials.bulkWrite(modifiedCredentials);
  return ids;
}

module.exports = { saveOne, saveMany, getListByUser, editOne, editMany, removeOne, resetAttachedSession };
