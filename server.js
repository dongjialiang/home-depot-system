// 引入依赖
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const logger = require('morgan');
const passport = require('passport');
const path = require('path');
const multer = require('multer');

// 创建服务
const app = express();

// 设置上传文件存放的文件夹
const upload = multer({ dest: path.join(__dirname, 'uploads') });
// 引入配置
require('./config/cors')(app);
const { authenticate } = require('./config/auth');
// const { rateLimiterMiddleware } = require('./config/conn');
require('./config/auth');

// 使用中间件
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize()); // 初始化passport
if (process.env.NODE_ENV === 'production') {
    app.use(logger('tiny', {
        skip: (req, res) => (res.statusCode < 400),
    }));
} else {
    app.use(logger('dev'));
}
app.use(helmet());
// app.use(rateLimiterMiddleware);

// 导入路由
const userRoute = require('./api/user');
const { adminRoute, adminUserRoute, adminProductRoute, adminOrderRoute } = require('./api/admin');
const { ProductRoute } = require('./api/product');
const { ShoppingCartRoute } = require('./api/shoppingcart');
const { OrderRoute } = require('./api/order');
const { CollectionRoute } = require('./api/collection');
const { CommentRoute, AllCommentRoute } = require('./api/comment');
const { SearchRoute } = require('./api/search');
const profileRoute = require('./api/profile');
const { uploadAvatar, uploadImage, uploadImages, removeImage } = require('./api/upload');
// 配置路由
app.use('/images', express.static(path.join(__dirname, 'uploads'), { maxAge: 31557600000 }));

app.use('/api/search', SearchRoute); // 查询路由
app.use('/api/user', userRoute);

app.use('/api/secure', authenticate, profileRoute);
app.post('/api/avatar', authenticate, upload.single('avatar'), uploadAvatar);
app.post('/api/images', authenticate, upload.array(20), uploadImages);
app.post('/api/image', authenticate, upload.single('image'), uploadImage);
app.delete('/api/delete/image/:image', authenticate, removeImage);

app.use('/api/product', ProductRoute);                         // 产品路由
app.use('/api/shoppingcart', authenticate, ShoppingCartRoute); // 购物车路由
app.use('/api/order', authenticate, OrderRoute);               // 订单路由
app.use('/api/collect', authenticate, CollectionRoute);        // 收藏路由
app.use('/api/comment', authenticate, CommentRoute);           // 评价路由
app.use('/api/allcomment', AllCommentRoute);                   // 所有用户都可访问的评价路由

app.use('/api/admin/user', adminRoute);
app.use('/api/admin/user_control', authenticate, adminUserRoute);
app.use('/api/admin/product', authenticate, adminProductRoute);
app.use('/api/admin/order', authenticate, adminOrderRoute);

// 服务器设置
const PORT = process.env.PORT || 7326;
app.listen(PORT, err => {
    if (err) { throw err; }
});
// 测试的时候可以直接开放服务器给测试框架使用
module.exports = app;
