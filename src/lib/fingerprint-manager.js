const Fingerprint = require('../models/fingerprint');

async function save({ hash, data, userId }) {
  const isUnique = !(await Fingerprint.findOne({ hash }));
  if (isUnique) {
    const fp = new Fingerprint({ hash, data, userId });
    return fp.save();
  }
}

async function getAll() {
  return Fingerprint.find({}).exec();
}

module.exports = { save, getAll };
