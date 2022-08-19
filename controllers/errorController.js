const AppError = require("../utils/appError");

// 句柄转换错误
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 404)
    
}

// 重复字段处理
const handleDuplicateFieldsDB = err => {
    const message = `Duplicate field value: ${err.keyValue.name}    Please use another value!`;
    return new AppError(message, 404)
}

// Mongoose验证错误处理
const handleValidationErrorDB = err => {

    const val = JSON.parse(JSON.stringify(err)).message
    const message = `Invalid input data:  ${val}`;
    return new AppError(message, 404)
}

// jsonwebtoken 签名出错
const handleJWTError = err => new AppError('令牌无效，请重新登录', 401)

// jsonwebtoken 过期
const handleJWTExpireError = err => new AppError('令牌过期，请重新登录', 401)

// development 状态下
const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
      return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });
    }
  
    // B) RENDERED WEBSITE
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  };
  
// production
const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {

        // A) Operational, trusted error: send message to client
        if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
      }
      // B) Programming or other unknown error: don't leak error details
      // 1) Log error
      console.error('ERROR 💥', err);
      // 2) Send generic message
      return res.status(500).json({

          status: 'error',
          message: 'Something went very wrong!'
      });
    }
  
    // B) RENDERED WEBSITE
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        console.log(err);
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, req, res)
    }else if(process.env.NODE_ENV === 'production'){
        // console.log(JSON.parse(JSON.stringify(err)))
        
        // ConstError
        if (JSON.parse(JSON.stringify(err)).name === 'CastError') err = handleCastErrorDB(err);

        // MongoError
        if(err.code === 11000) err = handleDuplicateFieldsDB(err)

        // ValidationError
        if(JSON.parse(JSON.stringify(err)).name === 'ValidationError') err = handleValidationErrorDB(err)

        // JsonWebTokenError
        if(JSON.parse(JSON.stringify(err)).name === 'JsonWebTokenError') err = handleJWTError(err)

        // TokenExpiredError
        if(JSON.parse(JSON.stringify(err)).name === 'TokenExpiredError') err = handleJWTExpireError(err)


        sendErrorProd(err, req, res)
    }
}
