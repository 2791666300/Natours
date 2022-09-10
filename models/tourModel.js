const mongoose = require('mongoose')
const slugify = require('slugify')
const User = require('./userModel')  // 嵌入
// 验证库
const validator = require('validator')
// 构建一个数据库模型架构
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },

    // 起始位置  
    startLocation: {
      // GeoJson 地理空间数据
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {

        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // little demo
    // guides: Array

    guides: [
      {
        type: mongoose.Schema.ObjectId,  // _id 类型
        ref: 'User'        // reference 引用
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


// 创建索引 index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere' })

// virtual properties 虚拟属性  
// 就是在数据库文档显示的时候多出来的属性,但是它们并不是数据库的一部分
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})


// reviews: {
//   type: mongoose.Schema.ObjectId,
//   ref: 'Review',
//   required: [true, "评论应该有旅行"]
// }
// virtual Populate  虚拟填充
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'

})

// 1) document middleware  文档中间件
// pre 在实际事件之前运行  在触发 save 和 create 事件之前，进行回调
tourSchema.pre('save', function (next) {
  // 相当于一个虚拟属性
  this.slug = slugify(this.name, { lower: true }) // this 关键字将指向当前要保存的文档(document middleware)
  next()
})

// save 之前 读取嵌入在guides里面的 _id 并把结果再一次放入 guides里
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id))
//   this.guides = await Promise.all(guidesPromises)
//   next()
// })


// post 在实际事件之后运行 ...
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// })

// 2) query middleware   查询中间件
tourSchema.pre(/^find/, function (next) {
  // 只显示secretTour 属性为false 的文档
  this.find({ secretTour: { $ne: true } }) // this 指向当前查询
  this.start = Date.now();
  next()
})

// 在每次查询之前填充guides里面的 _id 也就是嵌入的数据  
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  })
  next()
})
// post 查询完之后
tourSchema.post(/^find/, function (docs) {
  // console.log(docs);
  console.log(`查询时间: ${Date.now() - this.start}`)
})

// 3) aggregation middleware 聚合中间件
// tourSchema.pre('aggregate', function(next) {
//     // 在聚合中也只显示secretTour 属性为false 的文档
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true }}}) // unshift 在数组开头添加 $match 方法
//     next()
// })


// 模型
const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour