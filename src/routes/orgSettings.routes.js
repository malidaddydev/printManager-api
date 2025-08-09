const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadOrderFiles');
const { getSettings, updateSettings, createSettings } = require('../controllers/orgSettings.controller');
const { isAdmin } = require('../middlewares/auth.middleware');
const {authenticate} = require('../middlewares/auth.middleware');




router.get('/', getSettings);
router.put('/', authenticate, upload.single('logo'), updateSettings);
router.post('/', authenticate, upload.single('logo'), createSettings);


module.exports = router;
