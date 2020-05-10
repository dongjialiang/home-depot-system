// 引入依赖
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const logger = require('morgan');
const passport = require('passport');
const path = require('path');
const app = express();
const multer = require('multer');
// 设置上传文件存放的文件夹
const upload = multer({ dest: path.join(__dirname, 'uploads') });
// 引入配置
require('./config/cors')(app);
const { authenticate } = require('./config/auth');
// const { rateLimiterMiddleware } = require('./config/conn');
require('./config/auth');

// 使用中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize()); // 初始化passport
app.use(logger('dev'));
app.use(helmet());
// app.use(rateLimiterMiddleware);

// 配置路由
const userRoute = require('./api/user');
const ProductRoute = require('./api/product');
const profileRoute = require('./api/profile');
const { uploadAvatar, uploadImages } = require('./api/upload');
app.use('/images', express.static(path.join(__dirname, 'uploads'), { maxAge: 31557600000 }));
app.use('/api/user', userRoute);
app.use('/api/secure', authenticate, profileRoute);
app.use('/api', ProductRoute);
app.post('/api/avatar', upload.single('avatar'), uploadAvatar);
app.post('/api/images', upload.array('images', 20), uploadImages);

// 服务器设置
const PORT = process.env.PORT || 7326;
app.listen(PORT, err => {
    if (err) { throw err; }
    console.log(`Server is running on ${PORT}`);
});
// 测试的时候可以直接开放服务器给测试框架使用
module.exports = app;
