/**
 * 收藏模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// 编写规则
const collectionSchema = new Schema({
    collect_url: {
        type: String,
    },
    collect_desc: {
        type: String,
    },
    user_id: {
        type: String,
        ref: 'User',
    }
});
// 构筑模型
const CollectionModel = mongoose.model('Collection', collectionSchema);
// 导出模型
module.exports = CollectionModel;
