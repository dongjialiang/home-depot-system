/**
 * 订单模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    product_id: {
        type: String,
        ref: 'Product',
    },
    user_id: {
        type: String,
        ref: 'User',
    },
    first_name: String, // 姓
    last_name: String, // 名
    address: String, // 收货地址
    phone: String, // 联系电话
    num: { type: Number, required: true }, // 订单数量
    store_check_name: String, // 商场名字
    confirm: {
        type: Boolean,
        default: false,
    },
});
const orderModel = mongoose.model('Order', orderSchema);
module.exports = orderModel;
