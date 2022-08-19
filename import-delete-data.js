const dotenv = require('dotenv')
const mongoose = require('mongoose')
const fs = require('fs')
const Tour = require('./models/tourModel')
const User = require('./models/userModel')
const Review = require('./models/reviewModel')

dotenv.config({path: './config.env'})

const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD)

// 本地数据库连接
// mongoose.connect(process.env.DATABASE_LOCAL,function(){})

// 远程数据库连接
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(con => {
    // console.log(con.connections)
    console.log('DB connection successful!')
})

// 从json文件中读取数据
const tours = JSON.parse(fs.readFileSync('../data数据/tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('../data数据/users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('../data数据/reviews.json', 'utf-8'));
console.log(process.argv)

// 写入
const importDate = async () => {
    try{
        await Tour.create(tours)
        await User.create(users, { validateBeforeSave: false })
        await Review.create(reviews)

        console.log("数据成功写入数据库!!!!")

    }catch(err){
        console.log(err)
    }
    // 停止应用程序
    process.exit()
    
}

// 删除
const deleteData = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();

        console.log("数据成功删除")
    }catch(err){
        console.log(err)
    }
    process.exit()
}


//  node  file.js  --import 或者 --delete
//  node import-delete-data.js --import    
if (process.argv[2] === '--import'){
    importDate()
}else if(process.argv[2] === '--delete'){
    deleteData()
}