const mongoose = require('mongoose')
const crypto = require('crypto')
// 有一系列验证数据或者数据格式是否正确的库
const validator = require('validator')
// 加密库
const bcrypt = require('bcryptjs')


const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true , '请输入你的名字'],
        maxlength: [20, 'name字段应该小于或等于20！！']
    },
    email: {
        type: String,
        required: [true , '请输入你的Email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, '请提供有效的电子邮件']
    },
    
    photo: {
        type: String,
        default: 'default.jpg'
    },
    // 管理者
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },

    password: {
        type: String,
        required: [true , '请输入你的密码'],
        minlength: 2,
        select: false // 有查询操作时不显示password
    },
    passwordConfirm: {
        type: String,
        required: [true , '请确认你的密码'],
        validate: {

            // 这只适用于保存和创建
            validator: function(el) {
                return el === this.password;
            },
            message: '两次密码不一样，请重新确认或者输入你的密码'
        }
    },
    passwordChangedAt: Date,

    passwordResetToken: String,

    PasswordResetExpires: Date,

    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

// 密码加密 在数据保存之前进行加密操作
userSchema.pre('save', async function(next) {
    // isModified 方法 password字段是否被修改
    if (!this.isModified('password')) return next()

    // .hash 方法会返回一个promise
    this.password = await bcrypt.hash(this.password, 12)

    // 加密过后就没必要显示passwordConfirm
    this.passwordConfirm = undefined;

    next() 
})

// 在数据保存之前 更改passwordChangedAt 的值 也就是 密码更改时间
userSchema.pre('save', function(next) {
    if (!this.isModified('password')) return next()
    // 再更改密码后 有时 Json Web Token 令牌可能会早一点，这会引发 （令牌在发出后更改了密码）这个事件 所以要提前1秒更改   
    this.passwordChangedAt = Date.now() - 1000  

    next()
})

// 在所有find运行的中间件 只允许显示active属性不为false的数据被找到
userSchema.pre(/^find/, function(next) {
    // this 指向当前的query
    this.find({active: { $ne: false}})
    next()
})

// 比较两个密码是否相等
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {

    // 比较candidatePassword (候选密码) 和userPassword是否相等
    return await bcrypt.compare(candidatePassword, userPassword)
}

// 通过比较初始密码创建的时间和令牌发布的时间 来判断用户是否在令牌发出后更改了密码
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if ( this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        // console.log(JWTTimestamp, changedTimestamp)

        return JWTTimestamp < changedTimestamp
    }
    // false 意味着密码没有更改
    return false
}

// 生成随机重置令牌
userSchema.methods.createPasswordResetToken = function() {
    // crypto 模块加密
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.PasswordResetExpires = Date.now() + 10 * 60 * 1000
    // console.log(resetToken)
    return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User