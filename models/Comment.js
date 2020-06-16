/**
 * 评价模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// 编写规则
const commentSchema = new Schema({
    user_id: {
        type: String,
        ref: 'User',
    },
    markdown: String,
    html: String,
}, {
    timestamps: true,
});
// 构筑模型
const CommentModel = mongoose.model('Comment', commentSchema);
// 导出模型
module.exports = CommentModel;
