const Session = require('../models/session');

// update proxy-server name in sessions

run();

async function run() {
  const result = await Session.updateMany({ credentials: { $ne: null } }, {
    'proxy.address': 'proxy.tickops.com:30333'
  }).exec();
  console.log(result);
}
