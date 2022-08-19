const stripe = require('stripe')(process.env.STRIPE_SECTRET_KEY)
const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')

const factory = require('./handlerFactory')
const Booking = require('../models/bookingModel')


exports.getCheckoutSession = catchAsync(async (req, res, next) => {

    // 1) 获得当前预订的旅行
    const tour = await Tour.findById(req.params.tourID)
    
    
    // 2) 创建结帐会话 
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], // 支付方式
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.TourID}&user=${req.user.id}&price=${tour.price}`,  // 支付成功后重定向的链接
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, 
        customer_email: req.user.email,  
        client_reference_id: req.params.tourID,
        
        line_items: [ // 产品描述
            {
                
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: 'http://localhost:1000/img/tours/tour-5-cover.jpg',
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1
            }
        ]
    })
     
    // 3) 创建会话作为响应
    res.status(200).json({
        status: 'success',
        session
    })
})

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query;
    if(!tour && !user && !price) return next()
    await Booking.create({tour, user, price})

    res.redirect(req.originalUrl.split('?')[0]) // 重定向

})

exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)