/**
 * 家具模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// 编写规则
const productSchema = new Schema({
    product_id: {
        type: String,
        unique: true,
    },
    b_title: String,
    s_title: String,
    name: String,
    type_name: String,
    pic: String,
    size: String,
    price: Number,
    is_new: String,
    online_sellable: Boolean,
    colors: Array,
    pic_array: Array,
    desc: String,
    designer_thought: String,
    detail: String,
    doc: String,
    enviroment_and_material: String,
    instruction: String,
    size_array: String
});
// 构筑模型
const ProductModel = mongoose.model('Product', productSchema);
// 导出模型
module.exports = ProductModel;
