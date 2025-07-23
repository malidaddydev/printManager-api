const express = require('express');
const router = express.Router();
const { createOrder,getProductColors } = require('../controllers/order.controller');
// const { getAllOrders } = require('../controllers/order.controller');
// const { getOrder } = require('../controllers/order.controller');
// const { createOrderComment } = require('../controllers/order.controller');
// const { deleteOrder } = require('../controllers/order.controller');

router.post('/', createOrder);
// router.get('/', getAllOrders);
router.get('/productColors/:id', getProductColors);
// router.get('/:id', getOrder);
// router.delete('/:id', deleteOrder);
// router.post('/:orderId/comments', createOrderComment);

module.exports = router;
