const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const upload = require('../middlewares/uploadOrderFiles');
const {authenticate} = require('../middlewares/auth.middleware');

router.post('/', authenticate, upload.array('files'), productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', authenticate, upload.array('files'),productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

module.exports = router;
