const Session = require('../models/session');

addSessionsExtraTimestamps();

async function addSessionsExtraTimestamps() {
  const sessions = await Session.find({}).exec();
  for (const { id, updatedAt } of sessions) {
    if (updatedAt) continue;
    await Session.findByIdAndUpdate(id, { updatedAt: Date.now() });
  }
}
