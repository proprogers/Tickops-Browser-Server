const states = require('../consts/us-states.json');
const statesMap = new Map(states);
const statesNameToIsoMap = new Map(states.map(([iso, { name }]) => [name, iso]));

function getInfo(stateIso) {
  const info = statesMap.get(stateIso);
  if (!info) throw new Error('No info of the given location');
  return info;
}

function getIsoByStateName(name) {
  return statesNameToIsoMap.get(name);
}

module.exports = { getInfo, getIsoByStateName };
