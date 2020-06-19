/**
 * 评价接口文件
 */
// 引入依赖
const express = require('express');
const CommentModel = require('../models/Comment');
// 创建路由
const CommentRoute = express.Router();
/**
 * POST /add
 * 创建评价
 * @param markdown [markdown内容]
 * @param html     [html渲染的内容]
 */
CommentRoute.post('/add', async (req, res) => {
    const user_id = req.user._id;
    const markdown = req.body.markdown;
    const html = req.body.html;
    const comment = await CommentModel.create({ user_id, markdown, html });
    res.json({ comment, message: '评价成功' });
});
/**
 * DELETE /:comment_id/remove
 * 删除评价
 * @param comment_id [评价id]
 */
CommentRoute.delete('/:comment_id/remove', async (req, res) => {
    const comment_id = req.params.comment_id;
    CommentModel.findByIdAndDelete(comment_id, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (!data) {
            return res.status(422).json({ message: 'The comment is delete failed.' });
        }
        res.json({ message: 'The comment is delete successful.' });
    });
});
/**
 * POST /:comment_id/update
 * 修改评价
 * @param comment_id [评价id]
 * @param markdown   [markdown内容]
 * @param html       [html渲染的内容]
 */
CommentRoute.post('/:comment_id/update', async (req, res) => {
    const comment_id = req.params.comment_id;
    const markdown = req.body.markdown;
    const html = req.body.html;
    CommentModel.findOneAndUpdate({ _id: comment_id }, {
        markdown,
        html,
    }, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (!data) {
            return res.status(422).json({ message: 'The comment is update failed.' });
        }
        res.json({ message: 'The comment is update successful.' });
    });
});
/**
 * Get /get/:comment_id
 * 根据评价id获取评价
 * @param comment_id [评价id]
 */
CommentRoute.get('/get/:comment_id', async (req, res) => {
    const comment_id = req.params.comment_id;
    CommentModel.findOne({ _id: comment_id },
        (err, comment_info) => {
        if (err) {
            console.error(err);
        }
        if (!comment_info) {
            return res.status(422).json({ message: 'The comment is not exist.' });
        }
        res.json({ comment_info });
    });
});
/**
 * GET /get/all/:user/:page
 * 查看自己所有的评价
 * @param page [页码]
 * @param user [是全体用户还是个人用户]
 */
CommentRoute.get('/get/all/:user/:page', async (req, res) => {
    const user_id = req.user._id;
    const page = req.params.page;
    const user = req.params.user;
    const page_size = 20;
    const query_param = (user === 'user') ? { user_id } : {};
    CommentModel
        .find(query_param)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .then(async (comments_info) => {
            if (!comments_info) {
                return res.status(422).json({ message: 'The comment list is empty.' });
            }
            const total = await CommentModel.find(query_param).countDocuments();
            return res.json({ comments_info, total });
        });
});
// 导出路由
module.exports = { CommentRoute };
