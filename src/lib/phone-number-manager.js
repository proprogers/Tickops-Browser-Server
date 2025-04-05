const PhoneNumber = require('../models/phone-number');

async function save({ number, owner, partition }) {
  const doc = await PhoneNumber.findOne({ number, owner }).exec();
  if (doc) {
    doc.partitions.push(partition);
    await doc.save();
    return;
  }
  return new PhoneNumber({ number, owner, partitions: [partition] }).save();
}

async function remove({ number, owner, partitions }) {
  const doc = await PhoneNumber.findOneAndUpdate({
    number,
    owner
  }, { $pullAll: { partitions } }, { new: true }).exec();
  if (!doc || doc && doc.partitions.length) return;
  return PhoneNumber.findByIdAndDelete(doc._id).exec();
}

async function get(number) {
  return PhoneNumber.find({ number }).exec();
}

module.exports = { save, remove, get };
