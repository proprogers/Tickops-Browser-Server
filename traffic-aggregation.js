const connection = new Mongo();
const db = connection.getDB('browser-prod');
db.auth('browser-prod', '3PM6ee8py3DXjk');
// const db = connection.getDB('browser-dev');
// db.auth('browser-dev', 'wVvm(E)VH7qY');

const dayMilliseconds = 60 * 60 * 24 * 1000;

async function aggregate() {
  const now = Date.now();
  const yesterday = new Date(now - dayMilliseconds);
  const cursor = await db.traffics.find({ timestamp: { $lt: yesterday } });

  const aggregatedArray = getAggregatedArray(cursor.toArray());
  for (const trafficItem of aggregatedArray) {
    await db.aggregatedtraffics.save(trafficItem);
  }

  await db.traffics.deleteMany({ timestamp: { $lt: yesterday } });
}

function getAggregatedArray(trafficArray) {
  const aggregated = [];
  while (trafficArray.length) {
    const initValue = trafficArray.splice(0, 1)[0];
    const indexesToRemove = [];

    const aggregatedItem = trafficArray.reduce((accumulator, current, index) => {
      const isDateMatches = accumulator.timestamp.toLocaleDateString() === current.timestamp.toLocaleDateString();
      const isUserMatches = accumulator.userId === current.userId;
      const isProviderMatches = accumulator.provider === current.provider;
      if (isDateMatches && isUserMatches && isProviderMatches) {
        accumulator.sentBytes += current.sentBytes;
        accumulator.receivedBytes += current.receivedBytes;
        indexesToRemove.push(index);
      }
      return accumulator;
    }, initValue);

    aggregated.push(aggregatedItem);

    for (const index of indexesToRemove) {
      trafficArray.splice(indexesToRemove, 1);
    }
  }

  return aggregated;
}

aggregate().catch(error => print(error));
