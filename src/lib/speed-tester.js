const request = require('request');

async function speedTest(data) {
  if (data.provider !== 'luminati'
    && data.provider !== 'oxylabs'
    && data.provider !== 'geosurf'
    && data.provider !== 'mysterium'
    && data.provider !== 'netnut') {
    throw new Error('Wrong provider');
  }

  const resArray = [];
  resArray.push(...(await test(data)));

  const values = resArray.map(({ speed, timings, bytes }) => {
    return {
      bytes,
      speed: speed.toFixed(),
      timings: {
        download: timings.download.toFixed(),
        wait: timings.wait.toFixed(),
        firstByte: timings.firstByte.toFixed(),
        total: timings.total.toFixed(),
      }
    };
  });

  const bytes = resArray[0].bytes;
  const speed = getArrayStatistics(resArray.map((item) => item.speed));
  const timings = {
    download: getArrayStatistics(resArray.map((item) => item.timings.download)),
    wait: getArrayStatistics(resArray.map((item) => item.timings.wait)),
    firstByte: getArrayStatistics(resArray.map((item) => item.timings.firstByte)),
    total: getArrayStatistics(resArray.map((item) => item.timings.total)),
  };

  return {
    statistics: { bytes, speed, timings },
    values
  };
}

async function test(data) {
  const promises = [];
  for (let count = data.count || 10; count > 0; count--) {
    promises.push(testRequest(data));
  }
  return Promise.all(promises);
}

function getArrayStatistics(array) {
  array.sort((a, b) => a - b);
  const half = Math.floor(array.length / 2);
  const median = array.length % 2
    ? array[half]
    : (array[half - 1] + array[half]) / 2;

  return {
    min: array[0].toFixed(),
    median: median.toFixed(),
    max: array[array.length - 1].toFixed(),
    standardDeviation: getArrayStandardDeviation(array),
  };
}

function getArrayStandardDeviation(array) {
  const variance = getArrayVariance(array);
  return Math.sqrt(variance);
}

function getArrayVariance(array) {
  const mean = getArrayMean(array);
  return getArrayMean(array.map((num) => Math.pow(num - mean, 2)));
}

function getArrayMean(array) {
  const sum = array.reduce((acc, curr) => acc + curr);
  return sum / array.length;
}

async function testRequest({ url, ipInfo, provider }) {
  const options = { uri: url, time: true };

  switch (provider) {
    case 'luminati':
      options.proxy = `http://lum-customer-c_154c57cc-zone-browsertwo-${ipInfo}:z08f5d06b8rx@zproxy.lum-superproxy.io:22225`;
      break;
    case 'oxylabs':
      options.proxy = `http://customer-rtickops-${ipInfo}:k6JcBFe43z@pr.oxylabs.io:7777`;
      break;
    case 'geosurf':
      options.proxy = `http://${ipInfo}:xpUbvr*_QX7Zqu@us-30m.geosurf.io:8000`;
      break;
    case 'netnut':
      options.proxy = `http://tpefyi-cc-${ipInfo}:HZdnDaQp@gw.ntnt.io:5959`;
      break;
    case 'mysterium':
      options.proxy = 'http://tickops:PVQoMhtinRVFRzsQr99UdYjF@supernode-us.mysterium.network:10001';
      break;
  }

  return new Promise((resolve, reject) => {
    const stream = request(options);
    let bytes = 0;
    stream.on('data', (chunk) => bytes += chunk.length);
    stream.on('end', () => {
      const timings = {
        download: stream.response.timingPhases.download,
        wait: stream.response.timingPhases.wait,
        firstByte: stream.response.timingPhases.firstByte,
        total: stream.response.timingPhases.total,
      };
      resolve({ bytes, timings, speed: bytes / timings.download });
    });
    stream.on('error', reject);
    setTimeout(() => reject(new Error(`${provider} speed test timeout`)), 60000);
  });
}

module.exports = speedTest;
