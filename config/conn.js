/**
 * 连接数据库的文件
 */
// 引入依赖
const mongoose = require('mongoose');
const redis = require('redis');
// const { RateLimiterRedis } = require('rate-limiter-flexible');
// 引入配置
require('dotenv').config({ path: `${process.cwd()}/config/.env` });
// 设置连接地址
const mongoDBConnUrl = process.env.MONGODB_CONNURL;
const mongoDBTestConnUrl = process.env.MONGODB_TESTCONNURL;
// 使用redis客户端
const redisClient = redis.createClient({
    enable_offline_queue: false,
});
// mongoose连接mongodb数据库的设置
mongoose.set('useCreateIndex', true);
mongoose.connect(mongoDBConnUrl, {
    useNewUrlParser: true,    // 启用新的字符串连接解释器
    useUnifiedTopology: true, // 启用新的拓扑引擎,删除几个旧的连接选项
})
.then(() => { console.log('MongoDB connection successful...'); });
mongoose.connection.on('error', error => console.error(error));
mongoose.Promise = global.Promise;
// 配置redis错误输出
redisClient.on('error', (err) => {
    console.log(err);
});
// 设置速率限制器
// const opts = {
//     storeClient: redisClient,
//     points: 20,  // 单位时间内发起的请求数
//     duration: 1, // 以每秒为单位
// }
// const rateLimiterMongo = new RateLimiterRedis(opts);
// const rateLimiterMiddleware = (req, res, next) => {
//     rateLimiterMongo.consume(req.ip)
//         .then(() => {
//             next();
//         })
//         .catch(() => {
//             res.status(429).json({ message: 'Too Many Requests.' });
//         });
// };
module.exports = { mongoDBConnUrl, mongoDBTestConnUrl, redisClient };
