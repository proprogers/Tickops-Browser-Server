const express = require('express');
const router = express.Router();
const { auth, errorHandler } = require('../middleware/index');
const PaymentDataManager = require('../lib/payment-data-manager');

router.post('/', auth, async ({ user: { id }, body }, response, next) => {
  try {
    const resp = await PaymentDataManager.saveOne({ data: body, userId: id });
    response.status(201).json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Save payment data';
    next(e);
  }
});

router.get('/', auth, async ({ user: { id: owner } }, response, next) => {
  try {
    const resp = await PaymentDataManager.getListByUser(owner);
    response.json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Get payment data';
    next(e);
  }
});

router.patch('/:id', auth, async ({ params: { id }, body }, response, next) => {
  try {
    const resp = await PaymentDataManager.editOne({ data: body, id });
    response.json(resp);
  } catch (e) {
    e.status = 400;
    e.type = 'Edit payment data';
    next(e);
  }
});

router.delete('/:id', auth, async ({ params: { id } }, response, next) => {
  try {
    await PaymentDataManager.removeOne(id);
    response.sendStatus(200);
  } catch (e) {
    e.status = 400;
    e.type = 'Delete payment data';
    next(e);
  }
});

router.use(errorHandler);

module.exports = router;
