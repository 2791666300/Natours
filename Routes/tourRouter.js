const express = require('express')

const tourController = require('../controllers/tourController')
const authContoller = require('../controllers/authController-身份验证控制器')
const reviewController = require('../controllers/reviewController')
const reviewRouter = require('./reviewRouter')
const router = express.Router();


// 嵌套路由 http://127.0.0.1:1000/api/v1/tours/:tourId/reviews
// 1.
// router
//    .route('/:tourId/reviews')
//    .post(authContoller.protect, authContoller.restrictTo('user'), reviewController.creatReview)

// 2. 匹配到 /api/v1/tours/:tourId/reviews 的时候会重定向到reviewRouter路由
router.use('/:tourId/reviews', reviewRouter)



router
   .route('/top5')
   .get(tourController.getTopTours, tourController.getAllTours)

router
   .route('/stats')
   .get(tourController.getTourStats)

router
   .route('/monthly-plan/:year')
   .get(authContoller.protect, authContoller.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)


// /tours-within/3963/center/-23.819634328141934,-58.15945011345032/unit/mi
router
   .route('/tours-within/:distance/center/:latlng/unit/:unit')
   .get(tourController.getToursWithin);

router
   .route('/distances/:latlng/unit/:unit')
   .get(tourController.getDistances)

router
   .route('/')
   .get(tourController.getAllTours)
   .post(authContoller.protect, authContoller.restrictTo('admin', 'lead-guide'), tourController.creatTour)


router
   .route('/:id')
   .get(tourController.getSomethingTour)
   .patch(
      authContoller.protect, 
      authContoller.restrictTo('admin', 'lead-guide'),
      tourController.uploadTourImages,
      tourController.resizeTourImages,
      tourController.updateTour)
   .delete(
      authContoller.protect, 
      authContoller.restrictTo('admin', 'lead-guide'), 
      tourController.deleteTour)


module.exports = router