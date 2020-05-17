/**
 * 连接数据库的文件
 */
// 引入依赖
const mongoose = require('mongoose');
const redis = require('redis');
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
    useFindAndModify: false,
})
.then(() => { /* console.log('MongoDB connection successful...'); */ });
mongoose.connection.on('error', error => console.error(error));
mongoose.Promise = global.Promise;
// 配置redis错误输出
redisClient.on('error', (err) => {
    console.error(err);
});
module.exports = { mongoDBConnUrl, mongoDBTestConnUrl, redisClient };
