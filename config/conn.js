/*
 * 连接数据库的文件
 */

// 引入依赖
const mongoose = require('mongoose');
// const redis = require('redis'); // 使用redis客户端*2
const { RateLimiterMongo } = require('rate-limiter-flexible');
// 引入配置
require('dotenv').config({ path: `${process.cwd()}/config/.env` });
// 设置连接地址
const mongoDBConnUrl = process.env.MONGODB_CONNURL;
const mongoDBTestConnUrl = process.env.MONGODB_TESTCONNURL;
// const REDIS_POST = process.env.PORT || 6379; // *2
// const redisClient = redis.createClient(REDIS_POST); // *2

const mongoDBConn = (URL) => {
    mongoose.set('useCreateIndex', true);
    mongoose.connect(URL, {
        useNewUrlParser: true,    // 启用新的字符串连接解释器
        useUnifiedTopology: true, // 启用新的拓扑引擎,删除几个旧的连接选项
    })
    .then(() => { /* console.log('MongoDB connection succeeded'); */ });
    mongoose.connection.on('error', error => console.error(error));
    mongoose.Promise = global.Promise;
    return mongoose.connection;
}
const mongoConn = mongoDBConn(mongoDBConnUrl);

const opts = {
    storeClient: mongoConn,
    points: 20,  // 单位时间内发起的请求数
    duration: 1, // 以每秒为单位
}
const rateLimiterMongo = new RateLimiterMongo(opts);
const rateLimiterMiddleware = (req, res, next) => {
    rateLimiterMongo.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).json({ message: 'Too Many Requests.' });
        });
};
module.exports = { rateLimiterMiddleware, mongoDBConn, mongoDBConnUrl, mongoDBTestConnUrl };
