const multer = require('multer')
// const sharp = require('sharp')

const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')




// 1. 构建内存存引擎 memoryStorage
const multerStorage = multer.memoryStorage();

// 2. 过滤器
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('不是图像！ 请上传图像'), false)
  }
}


// 3. 创建对象
const upload = multer({ storage: multerStorage, fileFilter: multerFilter })


// 4. API、
exports.uploadTourImages = upload.fields([ // fields 多个文件
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
])
// 调整图片大小并且存入
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) next();

  // 1) Cover image
  // req.body 因为tour更新数据的API是基于req.body实现的
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  console.log(req.body.imageCover)
  // await sharp(req.files.imageCover[0].buffer)
  //   .resize(2000, 1333)
  //   .toFormat('jpeg')
  //   .jpeg({ quality: 90 })
  //   .toFile( `public/img/tours/${ req.body.imageCover}` );

  // 2) Images
  req.body.images = []

  // Promise.all  处理map返回的promise数组
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `user-${req.params.id}-${Date.now()}-${i + 1}.jpeg`
      // await sharp(file.buffer)
      //   .resize(2000, 1333)
      //   .toFormat('jpeg')
      //   .jpeg({ quality: 90 })
      //   .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename)
    }))
  console.log(req.body)
  next()
})





// 一个提供某些特殊值的路由中间件  比如： 前5个最便宜的东西......
exports.getTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '';
  req.query.fields = '';
  next();
}

exports.getAllTours = factory.getAll(Tour)
exports.getSomethingTour = factory.getOne(Tour, { path: 'reviews' })
exports.creatTour = factory.createOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)
exports.updateTour = factory.updateOne(Tour)

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {


  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// /tours-within/233/center/20,39/unit/mi
// /tours-within/:distance/center/:latlng/unit/:unit
// 地理查询，返回目的地的距离半径在233英里以内的所有tour
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params
  const [lng, lat] = latlng.split(',')

  // 把距离换算成地球的弧度数
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('请以lat, lng格式提供纬度和经度', 400))
  }
  console.log(lng, lat)
  // 1) $geoWithin: 选择边界GeoJSON几何内的几何。2dsphere和2D指标支持 。
  // 2) $centerSphere: 使用球形几何图形时，使用传统坐标对或GeoJSON格式指定一个圆 用于$geoWithin查询。2dsphere和 2D指标支持。
  // 3) {startLocation: {$geoWithin: { $centerSphere: [ [ -114.6875608299163, 45.59293403932144 ], 0.25562977019862804 ]}}}
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  })

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})


// 计算某个点到所有tour的距离并且一一显示距离
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params
  const [lng, lat] = latlng.split(',')
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lng || !lat) {
    next(new AppError('请以lat，lng格式提供纬度和经度', 400))
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        // 字段名为distance
        distanceField: 'distance',
        // 所有数乘以0.001
        distanceMultiplier: multiplier
      }
    },
    {
      // 显示的数据
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])
  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances
    }
  })
})