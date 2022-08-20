const express = require('express')
const morgan = require('morgan')
const path = require('path')


// 限制访问
const rateLimit = require('express-rate-limit')

const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const compression = require('compression')
const cors = require('cors')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const tourRouter = require('./Routes/tourRouter')
const userRouter = require('./Routes/userRouter')
const reviewRouter = require('./Routes/reviewRouter')

const viewRouter = require('./Routes/viewRoutes')
const bookingRouter = require('./Routes/bookingRouter')

const app = express()

// views
app.set('view engine', 'pug') // 设置引擎
app.set('views', path.join(__dirname, 'views')) // 引入views文件夹 ./views


// 实施CORS
// 实现跨域请求
app.use(cors())

// ptions 请求就是预检请求，可用于检测服务器允许的 http 方法。当发起跨域请求时，
// 由于安全原因，触发一定条件时浏览器会在正式请求之前自动先发起 OPTIONS 请求，
// 即 CORS 预检请求，服务器若接受该跨域请求，浏览器才继续发起正式请求。
app.options('*', cors())



// 设置安全 HTTP headers 
// app.use(helmet())

// 开发日志
console.log(process.env.NODE_ENV)
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

// 限制来自同一个API的请求
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: '来自此ip的请求太多，请在一小时后重试'
})
app.use('/api', limiter)


// body parse，将数据从主体读取到req.body中
app.use(express.json())

// 解析url的编码数据
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// 解析数据里面的cookie
app.use(cookieParser())

// 针对Nosql查询注入 的数据清理
app.use(mongoSanitize())

// 针对XSS的数据清理
app.use(xss())

// 防止参数污染
app.use(hpp({
    // whitelist 指的是可以重复出现的参数 白名单
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
      ]
}))

app.use(compression())
// 提供静态文件 中间件
app.use(express.static('./public'))

// 中间件 middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    // console.log(req.cookies)
    next()
})



// view
app.use('/', viewRouter)

//
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/booking', bookingRouter)
   
// 中间件会按照中间件堆栈顺序执行，下面的中间件会处理未处理的路由
app.all('*', (req, res, next) =>{
    // 1) 常规处理
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Cat't find ${req.originalUrl} on the server!`
    // })

    // 2) 创造错误
    // const err = new Error(`Cat't find ${req.originalUrl} on the server!`)
    // err.status = 'fail';
    // err.statusCode = 404;

    // 3) AppError 类的一个实例化
    next(new AppError(`Cat't find ${req.originalUrl} on the server!`, 404)) // 如果next里面有参数，那么一定会跳到处理错误的中间件
})

// 实现全局错误处理中间件
app.use(globalErrorHandler)
module.exports = app

