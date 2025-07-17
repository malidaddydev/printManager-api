const express=require('express');
const router=express.Router()
const usersController=require('../controllers/users.controller')
const { authenticate } = require('../middlewares/auth.middleware');

// router.post('/',authenticate,usersController.createUser)
// router.get('/',authenticate,usersController.getAllUser)
router.post('/',usersController.createUser)
router.get('/',usersController.getAllUser)

module.exports = router;