const express = require('express')

const authContoller = require('../controllers/authController-身份验证控制器')
const reviewController = require('../controllers/reviewController')


const router = express.Router({ mergeParams: true }) // 参数合并


router.use(authContoller.protect)
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authContoller.restrictTo('user'), reviewController.setTourUserIds, reviewController.creatReview)
    
router
    .route('/:id')
    .get(reviewController.getReview)
    .delete(authContoller.restrictTo('user', 'admin'), reviewController.deleteReview)
    .patch(authContoller.restrictTo('user', 'admin'), reviewController.updateReview)
module.exports = router