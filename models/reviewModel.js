const mongoose = require('mongoose')

const Tour = require('./tourModel')
const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, "不能没有评论哟！！"]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date, 
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, "评论应该有旅行"]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "评论应该有用户！！"]
    }
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
}
)

// 组合tour和user并且给uinque属性，所有对于同一个tour每个user只能写一次评论
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// 在find... 之前对 path 值进行填充
reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name'
    // })

    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next()
})



// 对所有评论按照tour来分类，并计算平局rating和总评论数
// 模型的一个静态方法
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating'}
            }
        }
    ])
    // console.log(stats)
    /*
    [
      {
        _id: 5c88fa8cf4afda39709c2955,
        nRating: 9,
        avgRating: 4.888888888888889
       }
    ] 
     */
    // 更新 Tour数据库里的数据
    if(stats.length > 0){

        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    }else{
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }

}
// 在每一次评论后调用评论统计方法
reviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.tour); // this指向这次评论，so this.constructor指的是这次评论的构造函数也就是模型Review
})


// findByIdAndUpdate  和  findByIdAndDelete 方法    每次更新评论或者删除评论后再一次的统计
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne()   // this指向本次查询  本次查询之前把数据库里tour的id给到this.r变量里面，以为post之后也就是查询之后
    // console.log(this.r)                                // findOne()已经没有用了，
    next()
})
reviewSchema.post(/^findOneAnd/, async function() {
    await this.r.constructor.calcAverageRatings(this.r.tour); // this指向本次查询
})


const Review = mongoose.model('Review', reviewSchema)

module.exports = Review