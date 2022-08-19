const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Booking = require('../models/bookingModel')

exports.getOverview = catchAsync (async (req, res, next) => {

    // 1) 从收集中获取您的数据
    const tours = await Tour.find()

    // 2) 构建模板

    // 3) 使用收集的数据渲染模板
    res.status(200).render('overview', {
        title: "all tours",
        tours: tours
    })
})

exports.getTour = catchAsync (async (req, res, next) => {
    // 1) 获取数据，具体的某个旅行项目  (包括评论和导游)

    const tour = await Tour.findOne({slug: req.params.slug}).populate({
      path: 'reviews'
    })

    if(!tour) {
        return next(new AppError('没有这个名字的tour', 404))
    }
    // console.log(tour)
    // 2) 构建模板

    // 3) 使用收集的数据渲染模板
   

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour: tour
    })
})

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into you account'
    })
}

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'your account'
    })
}


// 没有用API的一个更新数据的demo
exports.updateUserData = catchAsync(async (req, res, next) => {
    console.log('updateUserDate: ', req.body)
    const updateUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    })
    res.status(200).render('account', {
        title: 'your account',
        user: updateUser
    })
})

exports.getMyTours = async (req, res, next) => {

    // 1) 查找所有预订
    const bookings = await Booking.find( { user: req.user.id })

    // 2) 查找带有retrend ID的旅行
    const tourIDs = bookings.map(el => el.tour)
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My tours',
        tours
    })
}