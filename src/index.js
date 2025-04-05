const express = require('express');
const cors = require('cors')();
const app = express();
const port = 3000;
require('./lib/proxy-server');
require('./lib/proxy-manager');
require('./lib/identity-manager');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../user-management-docs.json');
const { sentry: { dsn }, isDebug } = require('../config');
const Sentry = require('@sentry/node');
const { onUpgradeServer } = require('./lib/web-sockets-manager');

if (!isDebug) {
  Sentry.init({ dsn, debug: isDebug });
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());

app.use('/users', cors, require('./routes/users'));
app.use('/sessions', cors, require('./routes/sessions'));
app.use('/payment-data', cors, require('./routes/payment-data'));
app.use('/saved-credentials', cors, require('./routes/saved-credentials'));
app.use('/usage', cors, require('./routes/usage'));
app.use('/utils', cors, require('./routes/utils'));
app.use('/fingerprints', cors, require('./routes/fingerprints'));
app.use('/identities', cors, require('./routes/identities'));
app.use('/webhooks', cors, require('./routes/webhooks'));
app.use('/integrations', cors, require('./routes/integrations'));

const server = app.listen(port);
server.on('upgrade', onUpgradeServer);
