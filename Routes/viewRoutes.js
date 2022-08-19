const express = require('express')
const viewControllers = require('../controllers/viewControllers')
const authController = require('../controllers/authController-身份验证控制器')
const bookingController = require('../controllers/bookingController')
const router = express.Router()



router.get('/',authController.isLoggedIn,bookingController.createBookingCheckout, viewControllers.getOverview)

router.get('/tour/:slug',authController.isLoggedIn, viewControllers.getTour)

router.get('/login',authController.isLoggedIn, viewControllers.getLoginForm)
router.get('/me',authController.protect, viewControllers.getAccount)

router.get('/my-tours',authController.protect, viewControllers.getMyTours)

router.post('/submit-user-data',authController.protect, viewControllers.updateUserData)



module.exports = router