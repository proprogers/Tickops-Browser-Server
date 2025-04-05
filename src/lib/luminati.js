const axios = require('axios');
const { luminati: { customer, zone: { name: zone }, BASE_API_URL, token } } = require('../../config');
const { writeLog } = require('./logger');

const request = axios.create({
  baseURL: BASE_API_URL,
  headers: { 'Authorization': `Bearer ${token}` }
});

async function refreshGips(gips) {
  try {
    const { data: { vips } } = await request.post('zone/ips/refresh', { customer, zone, vips: gips });
    return vips.map(({ vip }) => vip); // returns all the gips
  } catch (e) {
    writeLog('Error refreshing gips', e.message);
    return gips;
  }
}

async function getPoolGips() {
  try {
    const { data } = await request.get(`zone/route_vips?customer=${customer}&zone=${zone}`);
    return data;
  } catch (e) {
    writeLog('Error getting gips', e.message);
  }
}

module.exports = { getPoolGips, refreshGips };
