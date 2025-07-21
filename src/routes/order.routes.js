const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/order.controller');
const { getAllOrders } = require('../controllers/order.controller');
const { getOrder } = require('../controllers/order.controller');
const { createOrderComment } = require('../controllers/order.controller');

router.post('/create', createOrder);
router.get('/allOrder', getAllOrders);
router.get('/singleOrder/:id', getOrder);
router.post('/:orderId/comments', createOrderComment);

module.exports = router;
