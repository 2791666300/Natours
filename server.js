const dotenv = require('dotenv')
const mongoose = require('mongoose')


// 全局异常捕获
process.on('uncaughtExceptionMonitor', err => {
    console.log('uncaught exception')
    console.log(err.name, err.message)
})



dotenv.config({path: './config.env'})
const app = require('./app')

const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD)

// 本地数据库连接
// mongoose.connect(process.env.DATABASE_LOCAL,function(){})

// 远程数据库连接
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
}).then(con => {
    // console.log(con.connections)
    console.log('DB connection successful!')
}).catch(err => {
    console.log('数据库连接失败！！')
})



const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...............`);
})


// 未处理的 reject   unhandledRejection
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1)
    })
    
})


// 捕获的异常 exception
// process.on('uncaughtExceptionMonitor', err => {
//     console.log('uncaught exception')
//     console.log(err.name, err.message)
// })

