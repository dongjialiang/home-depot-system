/**
 * 购物车模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// 编写规则
const shoppingCartSchema = new Schema({
    product_id: {
        type: String,
        ref: 'Product',
    },
    user_id: {
        type: String,
        ref: 'User',
    },
    num: { type: Number, required: true },
    store_check_name: String,
});
// 构筑模型
const ShoppingCartModel = mongoose.model('ShoppingCart', shoppingCartSchema);
// 导出模型
module.exports = ShoppingCartModel;
