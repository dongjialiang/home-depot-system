/*
 * 连接数据库的文件
 */

// 引入依赖
const mongoose = require('mongoose');
const { RateLimiterMongo } = require('rate-limiter-flexible');

mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://localhost:27017/myapp', {
    useNewUrlParser: true,    // 启用新的字符串连接解释器
    useUnifiedTopology: true, // 启用新的拓扑引擎,删除几个旧的连接选项
})
.then(() => console.log('MongoDB connection succeeded'));
mongoose.connection.on('error', error => console.error(error));
mongoose.Promise = global.Promise;
const mongoConn = mongoose.connection;

const opts = {
    storeClient: mongoConn,
    points: 10, // 10次请求
    duration: 1, // 每秒
}
const rateLimiterMongo = new RateLimiterMongo(opts);
const rateLimiterMiddleware = (req, res, next) => {
    rateLimiterMongo.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
};
module.exports = rateLimiterMiddleware;
