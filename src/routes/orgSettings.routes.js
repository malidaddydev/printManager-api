const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware.js');
const { getSettings, updateSettings, createSettings } = require('../controllers/orgSettings.controller');
const { isAdmin } = require('../middlewares/auth.middleware');




router.get('/', isAdmin, getSettings);
router.put('/', isAdmin, upload.single('logo'), updateSettings);
router.post('/',  upload.single('logo'), createSettings);


module.exports = router;
