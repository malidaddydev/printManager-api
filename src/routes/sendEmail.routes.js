const express = require('express');
const router = express.Router();
const { workflowStatusChange,orderStatusChange } = require('../controllers/sendEmail.controller');
const upload = require('../middlewares/uploadOrderFiles');
const { authenticate } = require('../middlewares/auth.middleware');



router.put('/workflow/:id', workflowStatusChange);
router.put('/orderstatus/:id', orderStatusChange);


module.exports = router;
