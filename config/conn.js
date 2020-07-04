/**
 * 连接数据库的文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Redis = require('ioredis');

// 引入配置
require('dotenv').config({ path: `${process.cwd()}/config/.env` });

// 设置连接地址
const mongoDBConnUrl = process.env.MONGODB_CONNURL;
const mongoDBTestConnUrl = process.env.MONGODB_TESTCONNURL;
const redisConfig = process.env.REDIS_CONFIG;

// 使用redis客户端
let redisClient;
if (redisConfig) {
    const redisNodes = JSON.parse(redisConfig);
    if (redisNodes.length > 1) {
        redisClient = new Redis.Cluster(redisNodes, {
            scaleReads: 'slave',
            enableOfflineQueue: false,
        });
    } else if (redisNodes.length === 1) {
        redisClient = new Redis(`redis://${redisNodes[0].host}:${redisNodes[0].port}`, {
            enableOfflineQueue: false,
        });
    }
}

// mongoose连接mongodb数据库的设置
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.isTest ? mongoDBTestConnUrl : mongoDBConnUrl, {
    useNewUrlParser: true,    // 启用新的字符串连接解释器
    useUnifiedTopology: true, // 启用新的拓扑引擎,删除几个旧的连接选项
    useFindAndModify: false,
})
.then(() => { /* console.log('MongoDB connection successful...'); */ });
mongoose.connection.on('error', error => {
    console.error(error);
});
mongoose.Promise = global.Promise;
// 配置redis错误输出
redisClient.on('error', (err) => {
    console.error(err);
});
module.exports = { redisClient };
