/**
 * 家具模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    price: String,
    is_new: String,
    online_sellable: Boolean,
    colors: Array,
    pic_array: Array,
    desc: Array,
    designer_thought: Array,
    detail: Array,
    doc: Array,
    enviroment_and_material: Array,
    instruction: Array,
    size_array: Array
});
const ProductModel = mongoose.model('Product', productSchema);
module.exports = ProductModel;
