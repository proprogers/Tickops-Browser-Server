const Proxy = require('../models/proxy');
const { getPoolGips, refreshGips } = require('../lib/luminati');
const { server: { intervals } } = require('../../config');
const { writeLog } = require('./logger');
const LocationManager = require('./location-manager');

setTimeout(syncProxies, 10000); // TODO: temp
setInterval(syncProxies, intervals.syncProxies);

async function syncProxies() {
  const pool = (await getPoolGips()) || [];
  const poolSet = new Set(pool);
  let db = await Proxy.find({}).exec();

  const proxiesToDelete = db.reduce((filtered, { gip, _id }) => {
    const needToDelete = !poolSet.has(gip);
    if (needToDelete) filtered.push({ _id });
    return filtered;
  }, []);

  await remove(proxiesToDelete);

  // check if new ones need to be added
  db = await Proxy.find({}).exec();
  if (pool.length === db.length) return;

  const dbSet = new Set(db.map((curr) => curr.gip));
  const newGips = pool.reduce((filtered, gip) => {
    const includes = dbSet.has(gip);
    if (!includes) filtered.push(gip);
    return filtered;
  }, []);

  await save(newGips);
}

async function remove(proxies) {
  if (!proxies.length) return
  try {
    await Proxy.deleteMany({ $or: proxies }).exec();
  } catch (e) {
    writeLog('Error deleting proxies from database', e.message);
  }
}

async function save(gips) {
  if (!gips.length) return;
  const { fine, bad } = checkGips(gips);
  const refreshed = await getRefreshedProxies({ bad, fine });
  try {
    await Proxy.insertMany([...fine, ...refreshed]);
  } catch (e) {
    writeLog('Error adding proxies to database', e.message);
  }
}

function checkGips(gips) {
  const fine = [], bad = [];
  for (const gip of gips) {
    try {
      fine.push(getGipInfo(gip));
    } catch (e) {
      bad.push(gip);
    }
  }
  return { fine, bad };
}

// gip e.g. us_12271_ny_newyork_337
function getGipInfo(gip) {
  const [countryIso, num, stateIso, city] = gip.split('_');
  const { name, timezone } = LocationManager.getInfo(stateIso);
  return { gip, countryIso, city, stateIso, timezone, infoString: `${name}, ${countryIso.toUpperCase()}` };
}

async function getRefreshedProxies(gips) {
  if (!gips.bad.length) return [];
  const allGips = await refreshGips(gips.bad);
  const set = new Set(gips.fine);
  const { fine, bad } = checkGips(allGips.filter((curr) => !set.has(curr)));
  return [...fine, ...bad.map((gip) => {
    return { gip, isFine: false };
  })];
}
