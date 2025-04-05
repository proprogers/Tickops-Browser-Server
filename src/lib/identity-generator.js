const crypto = require('crypto');
const { luminati: { defaultTargetingCountry } } = require('../../config');
const UserAgent = require('../models/user-agent');
const {
  browsers,
  platforms,
  audio,
  video,
  allPlugins,
  allMimeTypes,
  allDevices,
  allLanguages,
  screenResolutions
} = require('../consts/identities.json');

function getRandomValue(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function filterDatasetByAttrs(dataset, filters) {
  return dataset.filter(item => {
    const { attrs } = item;
    return Object.keys(filters).every(filterKey => {
      const attrValue = attrs[filterKey];
      const filterValue = filters[filterKey];

      if (Array.isArray(attrValue)) {
        return attrValue.indexOf(filterValue) !== -1;
      }

      return attrValue === filterValue;
    });
  }).map(item => item.value);
}

function getRandomKeyFiltered(dataset, filters) {
  const values = filterDatasetByAttrs(dataset, filters);

  if (values.length === 0) {
    const error = new Error('Unable to find elements matching filter');
    error.details = JSON.stringify(filters);
    error.status = 500;
    throw error;
  }

  return getRandomValue(values);
}

function getCanvasSeed() {
  const arrayBuffer = crypto.randomBytes(128);
  return String.fromCharCode(...arrayBuffer);
}

async function generate(platform) {
  const { attrs: { os, platformName } } = platforms.find(one => one.value === platform);
  const { name: browser, vendor } = getRandomKeyFiltered(browsers, { os });

  const agents = await UserAgent.find({ os, browser }).exec();
  const agentData = getRandomValue(agents);

  const audioFormats = getRandomKeyFiltered(audio, { os, browser });
  const videoFormats = getRandomKeyFiltered(video, { os, browser });
  const screenResolutionsFiltered = filterDatasetByAttrs(screenResolutions, { os });
  const screen = getRandomValue(screenResolutionsFiltered);
  const languages = getRandomKeyFiltered(allLanguages, { country: defaultTargetingCountry.toUpperCase() });
  const canvasSeed = getCanvasSeed();

  let plugins = [], mimeTypes = [], devices = [];
  try {
    plugins = getRandomKeyFiltered(allPlugins, { browser });
  } catch (e) {
  }
  try {
    mimeTypes = getRandomKeyFiltered(allMimeTypes, { browser });
  } catch (e) {
  }
  try {
    devices = getRandomKeyFiltered(allDevices, { browser, os });
  } catch (e) {
  }

  return {
    agent: agentData.value,
    version: agentData.version,
    uaFullVersion: agentData.fullVersion,
    architecture: 'x86',
    bitness: '64',
    platformName,
    platformVersion: agentData.platformVersion,
    vendor,
    plugins,
    os,
    browser,
    languages,
    audioFormats,
    videoFormats,
    canvasSeed,
    mimeTypes,
    devices,
    screenResolutions: screenResolutionsFiltered,
    screen
  };
}

module.exports = { generate };
