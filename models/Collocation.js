/**
 * 搭配模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// 编写规则
const collocationSchema = new Schema({
    user_id: {
        type: String,
        ref: 'User',
    },
    products_id: {
        type: Array,
    },
});
// 构筑模型
const CollocationModel = mongoose.model('Collocation', collocationSchema);
// 导出模型
module.exports = CollocationModel;
