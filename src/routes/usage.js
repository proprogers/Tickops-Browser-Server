const express = require('express');
const router = express.Router();
const { auth,managerAuth, managerFileAuth, errorHandler } = require('../middleware/index');
const { getUsage, getTrafficReportCSV,getUsageList } = require('../lib/traffic-manager');
const UserCache = require('../caches/user-cache');
const UserManager = require('../lib/user-manager');

router.get('/', auth, async ({ user }, response, next) => {
  try {
    const { trafficLimit,totalSpent } = await getUsage(user.id);
    const traffic = {
      totalSpent: totalSpent,
      limit: trafficLimit
    };
    const savedSessionsLimit = 1000;
    response.json({ traffic, savedSessionsLimit});
  } catch (e) {
    e.status = 400;
    e.type = 'Get usage';
    next(e);
  }
});

router.get('/traffic', managerAuth, async ({ query = {} }, response, next) => {
  try {

    const users = await UserManager.get(query);
    const user = users[0];
    const { trafficLimit,totalSpent } = await getUsage(user.id);
    const traffic = {
        totalSpent: totalSpent,
        limit: trafficLimit
    };

    response.json({traffic});
    
  } catch (e) {
    e.status = 400;
    e.type = 'Get usage';
    next(e);
  }
});


router.get('/stat', managerAuth, async ({ query = {} }, response, next) => {
  try {

    const users = await UserManager.get(query);
    const user = users[0];
    const traffic = await getUsageList(user.id);
    response.json({traffic});
    
  } catch (e) {
    e.status = 400;
    e.type = 'Get usage';
    next(e);
  }
});

router.get('/report', managerFileAuth, async (request, response, next) => {
  try {
    const { from, to, provider } = request.query;
    const { content, filename } = await getTrafficReportCSV({ from, to, provider });
    response.setHeader('Content-Type', 'text/csv');
    response.attachment(filename);
    response.send(content);
  } catch (e) {
    e.status = 400;
    e.type = 'Get usage report';
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
