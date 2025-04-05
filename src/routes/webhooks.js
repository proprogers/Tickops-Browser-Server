const express = require('express');
const router = express.Router();
const { writeLog } = require('../lib/logger');
const { forwardSmsText } = require('../lib/sms-manager');
const { getTokenUser } = require('../lib/integrations-manager');
const { openLink } = require('../lib/drop-checker-manager');
const PhoneNumberManager = require('../lib/phone-number-manager');
const { server: { secretKeys: { textchestToken } } } = require('../../config');
const { managerAuth, errorHandler } = require('../middleware/index');
const { sendMessage } = require('../lib/web-sockets-manager');
const { forwardLink } = require('../lib/utils');

router.post('/axs', async ({ query: { token, user}, body: { selections, fansight, event_url, axs_ecomm } }, response, next) => {
  try {
    const key = token;
    
    if (token == 'A2D3Token' && selections && event_url) {
      forwardLink({user:user, event_url:event_url, selections:selections, fansight:fansight, axs_ecomm:axs_ecomm})
      response.status(201).json({message: "Processing AXS", status: 201})
    } else {
      response.status(401).json({message: "Error processing", status: 401})
    }
  } catch (e) {
    writeLog(`"AXS webhook" server error`, e.message);
  }
});


router.post('/textchest', async ({ query: { token }, body: { data } }, response, next) => {
  try {
    const key = token;
    const existingIntegration = await getTokenUser({key});
    if (existingIntegration) {
      await forwardSmsText({ number: data.recipient, message: data.message });
    }
  } catch (e) {
    writeLog(`"Textchest webhook" server error`, e.message);
  }
  response.sendStatus(200);
});

router.get('/phones', managerAuth, async ({ query : {owner,number,message} }, response, next) => {
  try {

    sendMessage({ userId: owner, value: { number, message } });
    response.sendStatus(200);
  } catch (e) {
    e.status = 400;
    e.type = 'Get usage';
    next(e);
  }
});

router.post('/drop-checker', managerAuth, async ({ body: { url, login, tabsNumber } }, response, next) => {
  try {
    await openLink({ url, login, tabsNumber });
    response.sendStatus(200);
  } catch (e) {
    e.status = 400;
    e.type = `"Drop-checker" server error`;
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
