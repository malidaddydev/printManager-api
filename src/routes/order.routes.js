const express = require('express');
const router = express.Router();
const { createOrder,getAllOrders,getProductColors,getSingleOrders,updateOrder,deleteOrder } = require('../controllers/order.controller');
const upload = require('../middlewares/uploadOrderFiles');
// const { getAllOrders } = require('../controllers/order.controller');
// const { getOrder } = require('../controllers/order.controller');
// const { createOrderComment } = require('../controllers/order.controller');
// const { deleteOrder } = require('../controllers/order.controller');

router.post('/', upload.array('files'), createOrder);
router.get('/', getAllOrders);
router.get('/productColors/:id', getProductColors);
router.get('/:id', getSingleOrders);
router.put('/:id', updateOrder);

router.delete('/:id', deleteOrder);
// router.post('/:orderId/comments', createOrderComment);

module.exports = router;
