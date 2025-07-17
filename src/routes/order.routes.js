const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/order.controller');
const { getAllOrders } = require('../controllers/order.controller');
const { getOrder } = require('../controllers/order.controller');

router.post('/create', createOrder);
router.get('/allOrder', getAllOrders);
router.get('/singleOrder/:id', getOrder);

module.exports = router;
