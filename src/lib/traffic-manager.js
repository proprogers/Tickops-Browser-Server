const Traffic = require('../models/traffic');
const AggregatedTraffic = require('../models/aggregated-traffic');
const User = require('../models/user');
const { writeLog } = require('./logger');
const { server: { intervals } } = require('../../config');
const UserManager = require('./user-manager');

const trafficCountMap = new Map();
const trafficCacheMap = new Map();

setInterval(saveTraffic, intervals.updateTraffic);

async function saveTraffic() {
  for (let [userId, { isInternal, sentBytes, receivedBytes, provider }] of trafficCountMap.entries()) {
    try {
      trafficCountMap.delete(userId);
      const traffic = new Traffic({ userId, isInternal, sentBytes, receivedBytes, provider });
      await traffic.save();
    } catch (e) {
      writeLog('Traffic saving error', e.message);
    }
  }
}

async function updateTrafficMaps({ userId, isInternal, stats, provider }) {
  ///test
  const users = await UserManager.get({id:userId});
  const user = users[0];

  if(user.type != 'primary' && user.owner != 'owner'){
    const users_owner = await UserManager.get({email:user.owner});
    const user_owner = users_owner[0];
    userId = user_owner.id;
  }

  const traffic = new AggregatedTraffic({ userId, isInternal, sentBytes:stats.trgTxBytes, receivedBytes:stats.trgRxBytes, provider });
  await traffic.save();

  const item = trafficCountMap.get(userId) || {};
  trafficCountMap.set(userId, {
    sentBytes: (item.sentBytes || 0) + stats.trgTxBytes,
    receivedBytes: (item.receivedBytes || 0) + stats.trgRxBytes,
    isInternal,
    provider
  });
  const item2 = trafficCacheMap.get(userId) || {};
  trafficCacheMap.set(userId, isInternal ? { isInternal } : {
    totalSpent: item2.totalSpent || 0 + stats.trgTxBytes + stats.trgRxBytes
  });

}

function getTrafficListSum(list) {
  return list.reduce((acc, curr) => curr.receivedBytes + curr.sentBytes + acc, 0);
}

async function getUsage(userId) {
  if (!userId) return;

    const users = await UserManager.get({id:userId});
    if (users) {
      const user = users[0];
      trafficLimit = user.trafficLimit;
      
      if(user.type != 'primary' && user.owner != 'owner'){
        const users_owner = await UserManager.get({email:user.owner});
        const user_owner = users_owner[0];
        userId = user_owner.id;
        trafficLimit = user_owner.trafficLimit;
      }
    }

    const date = new Date();
    const now = Date.now();
    const first = date.setMonth(date.getMonth() - 1);
    const list = await AggregatedTraffic.find({ timestamp: { $gte: first, $lt: now }, userId}).exec();

    totalSpent = await getTrafficListSum(list);
    trafficCacheMap.set(userId, { totalSpent });
    
  
  return {totalSpent, trafficLimit};
}

async function getUsageList(userId) {
  if (!userId) return;

    const users = await UserManager.get({id:userId});
  
      const user = users[0];
      trafficLimit = user.trafficLimit;
      
      if(user.type != 'primary' && user.owner != 'owner'){
      const users_owner = await UserManager.get({email:user.owner});
      const user_owner = users_owner[0];
      userId = user_owner.id;
      trafficLimit = user_owner.trafficLimit;
    }
    
  // const info = trafficCacheMap.get(userId);
  // let totalSpent = info ? info.totalSpent : null;
  // if (!totalSpent) {
    const list = await AggregatedTraffic.find({ userId }).exec();
    totalSpent = await getTrafficListSum(list);
    trafficCacheMap.set(userId, { totalSpent });
    
  // }
  return {totalSpent, trafficLimit};
}

// async function getUsageList(userId) {
//   if (!userId) return;

//     const list = await Traffic.find({ userId }).exec();
   
//   return list;
// }

async function getMonthSpent({ userId, month, provider }) {
  const date = new Date();
  month = month || date.getMonth();
  const currentMonth = date.getMonth();
  const beginningOfTheMonth = new Date(date.getFullYear(), month, 1);
  const endOfTheMonth = currentMonth === month
    ? date
    : new Date(date.getFullYear(), month + 1, 1);
  let list = await AggregatedTraffic.find({
    userId,
    provider,
    timestamp: { $gte: beginningOfTheMonth, $lt: endOfTheMonth }
  }).exec();
  const isRequiredMonthPrevious = currentMonth === month || currentMonth === 0 && month === 11;
  if (currentMonth === month || isRequiredMonthPrevious && date.getDate() === 1) {
    const additionalList = await Traffic.find({
      userId,
      provider,
      timestamp: { $lt: endOfTheMonth }
    }).exec();
    list = [...list, ...additionalList];
  }
  return getTrafficListSum(list);
}

async function getTrafficReport({ month, providers = ['luminati', 'mysterium', 'mysterium_us2', 'soax', undefined] }) {
  const data = [];
  const users = await User.find({ isDeleted: false }).exec();
  for (const user of users) {
    for (const provider of providers) {
      const monthSpent = await getMonthSpent({ userId: user.id, month, provider });
      if (monthSpent === 0) continue;
      data.push({
        id: user.id,
        email: user.email,
        limit: `${(user.trafficLimit / 1024 / 1024 / 1024).toFixed(3)} Gib`,
        monthSpent: `${(monthSpent / 1024 / 1024).toFixed(3)} Mib`,
        provider: provider || 'unknown'
      });
    }
  }
  return data;
}

async function getTrafficReportCSV({ from, to, provider }) {
  const date = new Date();
  const currentYear = date.getFullYear();
  if (!from && to) from = to;
  if (from && !to) to = from;
  if (!from && !to) {
    from = `${currentYear}-${date.getMonth() + 1}`;
    to = from;
  }
  const [yearFrom, monthFrom, yearTo, monthTo] = `${from}-${to}`.split('-').map(number => parseInt(number));
  const data = [];

  if (monthFrom > 12 || monthFrom < 1 || monthTo > 12 || monthTo < 1
    || currentYear < yearFrom || currentYear < yearTo || yearFrom > yearTo) {
    throw new Error('Invalid date');
  }

  for (let year = yearFrom; year <= yearTo; year++) {
    const firstMonth = year === yearFrom ? monthFrom - 1 : 0;
    const lastMonth = year === yearTo ? monthTo - 1 : 11;
    for (let month = firstMonth; month <= lastMonth; month++) {
      const info = await getTrafficReport({ month, providers: provider && [provider] });
      const date = new Date(year, month);
      const monthName = date.toLocaleString('en', { month: 'long' });
      data.push({ month: monthName, year, info });
    }
  }

  let content = 'ID, Email, Limit, Spent, Date, Provider\n'
  for (const item of data) {
    for (const key in item.info) {
      const { id, email, limit, monthSpent, provider: p } = item.info[key];
      content += [id, email, limit, monthSpent, `${item.month}-${item.year}`, p].join(',') + '\n';
    }
  }
  const dateTo = `-${yearTo}_${monthTo}`;
  const filename = `traffic-report-${yearFrom}_${monthFrom}${from === to ? '' : dateTo}.csv`;
  return { content, filename };
}

module.exports = { updateTrafficMaps, getUsage, getUsageList, getTrafficReportCSV };
