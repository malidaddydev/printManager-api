const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware.js');
const {
  sendFileApprovalEmail
} = require('../controllers/customerApproval.controller.js');

// Create with file upload
router.post('/:id',sendFileApprovalEmail);

// Get all files (filter by orderId or productId)
// router.get('/', getOrderFiles);

// // Update with optional file
// router.put('/:id', upload.single('file'), updateOrderFile);

// // Delete
// router.delete('/:id', deleteOrderFile);

module.exports = router;