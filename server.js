// 引入依赖
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const logger = require('morgan');
const helmet = require('helmet');
const app = express();

// 引入配置
require('./config/cors')(app);
const { rateLimiterMiddleware } = require('./config/conn');
require('./config/auth');

// 使用中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize()); // 初始化passport
app.use(logger('dev'));
app.use(helmet());
app.use(rateLimiterMiddleware);

// 配置路由
const userRoute = require('./api/user');
const profileRoute = require('./api/profile');
app.use('/api/user', userRoute);
app.use('/api/secure', passport.authenticate('jwt', { session: false }), profileRoute);

// 服务器设置
const PORT = process.env.PORT || 7326;
app.listen(PORT, err => {
    if (err) { throw err; }
    console.log(`Server is running on ${PORT}`);
});
// 测试的时候可以直接开放服务器给测试框架使用
module.exports = app;
