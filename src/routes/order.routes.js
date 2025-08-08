const express = require('express');
const router = express.Router();
const { createOrder,getAllOrders,getProductColors,getSingleOrders,updateOrder,deleteOrder,orderFromToken,getProductSizes,cancelOrder,getAllPaginationOrders } = require('../controllers/order.controller');
const upload = require('../middlewares/uploadOrderFiles');
const { authenticate } = require('../middlewares/auth.middleware');


router.post('/', upload.array('files'), createOrder);
router.get('/', getAllOrders);
router.get('/pagination', getAllPaginationOrders);
router.get('/token/:token', orderFromToken);
router.put('/cancel-order/:id', cancelOrder);
router.get('/productColors/:id', getProductColors);
router.get('/productSizes/:id', getProductSizes);
router.get('/:id', getSingleOrders);
router.put('/:id', updateOrder);

router.delete('/:id',authenticate, deleteOrder);


module.exports = router;
