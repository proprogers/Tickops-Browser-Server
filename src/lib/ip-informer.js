const path = require('path');
const maxmind = require('maxmind');
const lookupPromise = maxmind.open(path.join(__dirname, '../../GeoLite2-City.mmdb'));
const cl = require('country-language');

async function getInfo(ip) {
  const lookup = await lookupPromise;
  const geoData = await lookup.get(ip);
  const country = geoData.country.iso_code;
  const language = cl.getCountryLanguages(country)[0].iso639_1;
  return {
    timezone: geoData.location.time_zone,
    city: geoData.city ? geoData.city.names.en : 'Unknown',
    country,
    languages: [`${language}-${country}`, language]
  };
}

module.exports = { getInfo };
