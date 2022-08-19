const express = require('express')
const userContoller = require('../controllers/userController')
const authContoller = require('../controllers/authController-身份验证控制器')


const router = express.Router();

router.post('/signup', authContoller.signup)
router.post('/login', authContoller.login)
router.get('/logout', authContoller.logout)
router.post('/forgotPassword', authContoller.forgotPassword)
router.patch('/resetPassword/:token', authContoller.resetPassword)


// 限制或保护对之后的路由， 利用中间件按顺序执行原理
router.use(authContoller.protect)


router.patch('/updatePassword', authContoller.updatePassword)

router.patch('/updateMe', userContoller.uploadUserPhoto,userContoller.resizeUserPhoto, userContoller.updateMe)

router.delete('/deleteMe', userContoller.deleteMe)

router.get('/Me', userContoller.getMe, userContoller.getUser)


// 之后的路由只允许 admin( 管理员 ) 用户执行
router.use(authContoller.restrictTo('admin'))

router
   .route('/')
   .get(userContoller.getAllUsers)
   .post(userContoller.creatUser)

router
   .route('/:id')
   .get(userContoller.getUser)
   .patch(userContoller.updateUser)
   .delete(userContoller.deleteUser)

module.exports = router