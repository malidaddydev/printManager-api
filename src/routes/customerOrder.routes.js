const express = require('express');
const router = express.Router();
const { createCustomerOrder } = require('../controllers/customerOrder.controller');
const upload = require('../middlewares/uploadOrderFiles');
const { authenticate } = require('../middlewares/auth.middleware');


router.post('/', upload.array('files'), createCustomerOrder);



// router.post('/:orderId/comments', createOrderComment);

module.exports = router;
