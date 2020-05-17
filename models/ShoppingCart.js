/**
 * 家具模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shoppingCartSchema = new Schema({
    product_id: String,
    user_id: String,
    num: { type: Number, required: true },
});
const ShoppingCartModel = mongoose.model('ShoppingCart', shoppingCartSchema);
module.exports = ShoppingCartModel;
