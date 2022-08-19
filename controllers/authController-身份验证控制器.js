const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')

// 生成token的sign方法
const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}


function creatSendToken(user, statusCode, res) {
    token = signToken(user._id)

    // 设置cookie
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // 发送cookie
    res.cookie('jwt', token, cookieOptions)

    // 在输出中去掉密码
   user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

// 1.注册
exports.signup = catchAsync(async (req, res, next) => {

    const newUser = await User.create(req.body)

    creatSendToken(newUser, 201, res)
})

// 2.登录
exports.login = catchAsync(async(req, res, next) => {

    // 解构赋值
    const {email, password} = req.body
    // 1) 检查电子邮件和密码是否存在
    if (!email || !password){
        return next(new AppError('请提供email或者pasword', 400))
    }

    // 2) 检查用户是否存在以及密码是否正确
    const user = await User.findOne({ email }).select('+password')
    
    const correct = await user.correctPassword(password, user.password)

    if(!user || !correct){
        return next(new AppError('Email或者password错误！！', 401))
    }
   
    // 3) 如果一切正常，在客户端发送令牌
    creatSendToken(user, 200, res)
    
})

// 登出
exports.logout = (req, res) => {
    // 重置cookie
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({
        status: 'success'
    })
}
// 3.验证令牌 控制请求数据的权限
exports.protect = catchAsync(async (req, res, next) => {
    
    // 1） 获取令牌并检查是否存在
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    {
        token = req.headers.authorization.split(' ')[1]

        // 用户也可以通过cookie来验证登录
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    // console.log(token)

    if (!token){
        return next(new AppError('您尚未登录，请登录以获取访问权限！！', 401))
    }
    
    // 2） 验证令牌     
    // promisify 是util库的一个方法， 负责创造异步函数的promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log(decoded)  { id: '62e917ff3a25680204465d52', iat: 1659448239, exp: 1668088239 }
    
    // 3） 检查用户是否仍然存在
    const currentUser = await User.findById(decoded.id)

    // console.log(currentUser)
    if ( !currentUser ){
        return next(new AppError('属于此令牌的用户不再存在！！', 401))
    }
    // 4） 检查用户是否在令牌发出后更改了密码
    if (currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('用户更改了密码，请重新登录！！', 401))
    }

    // 5) 有访问权限了
    req.user = currentUser
    res.locals.user = currentUser
    next()
})

exports.isLoggedIn = async (req, res, next) => {
    try{

        if (req.cookies.jwt) {
    
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
        
       
            const currentUser = await User.findById(decoded.id)
            if ( !currentUser ){
                return next()
            }
            
            if (currentUser.changedPasswordAfter(decoded.iat)){
                return next()
            }
    
            // 把user数据存入locals供pug模板使用
            res.locals.user = currentUser
            return next()
        }
      
    }catch(err){
        return next()
    }
    next()
}


// 4.控制删除数据的权限
exports.restrictTo = (...roles) => {
    // console.log(roles)  [ 'admin', 'lead-guide' ]
   
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){ // 从上一个中间件获取 req.user
            return next(new AppError('你没有执行此操作的权限！！', 403))
        }
        next()
    }
}


// 5.忘记密码
exports.forgotPassword = catchAsync(async(req, res, next) => {
    // console.log(req.body)

    // 1） 根据发布的电子邮件获取用户
    const user = await User.findOne({ email: req.body.email});
    if (!user) {
        return next(new AppError('没有具有此电子邮件地址的用户', 404))
    }

    // 2） 生成随机重置令牌
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false}) // 关闭一切验证器

    // 3） 发送到用户的电子邮件
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    console.log(resetURL)
    const message = `忘记密码了？使用新密码和密码提交补丁请求确认：${resetURL}，如果您没有忘记密码，请忽略此电子邮件！`

    try {

        res.status(200).json({
            status: '成功！！',
            resetToken,
            resetURL,
            message
        })

        // await sendEmail({
        //     email: user.email,
        //     subject: `给你十分钟`,
        //     message
        // })
    
        // res.status(200).json({
        //     status: 'success',
        //     message: '令牌已发送到电子邮件！！'
        // })
    }catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false})

        return next(new AppError('发送电子邮件时出错，请稍后再试！！', 500))
    }

    next()
})


// 6. 重置密码
exports.resetPassword = catchAsync(async(req, res, next) => {

    //1）基于令牌获取用户
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        // 加密发过来的令牌再和数据库里加过密的进行比较，是否超时...... 10分钟
    const user = await User.findOne({passwordResetToken: hashedToken});
    
    //2）如果令牌尚未过期，并且有用户，请设置新密码
    if (!user) {
        return next(new AppError('令牌无效或已过期！！', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken=undefined
    user.PasswordResetExpires=undefined
    await user.save()
    //3）为用户更新changedPasswordAt属性


    //4）登录用户，发送JWT
    creatSendToken(user, 200, res)
    next()
})


// 7.更新当前用户密码(登录用户)
exports.updatePassword = catchAsync(async(req, res, next) => {


    // 1） 从数据库集合中获取用户
    const user = await User.findById(req.user.id).select('+password')

    // 2） 检查当前用户的密码是否正确
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('您当前的密码错误', 401))
    }
   
    // 3） 如果是，更新密码
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    // 4） 登录用户，发送JWT
    creatSendToken(user, 200, res)
    next()
  
})

