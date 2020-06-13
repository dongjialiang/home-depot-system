/**
 * 购物车接口文件
 */
// 引入依赖
const express = require('express');
const CollectionCartModel = require('../models/Collection');
// 创建路由
const CollectionCartRoute = express.Router();
/**
 * POST /collect
 * 收藏或取消收藏商品或文章
 * @param collect_url  [收藏的商品或者文章的地址]
 * @param collect_desc [收藏的商品或者文章的描述]
 */
CollectionCartRoute.post('/collect', async (req, res) => {
    try {
        const collect_url = req.body.collect_url;
        const collect_desc = req.body.collect_desc;
        const user_id = req.user._id;
        const collect = await CollectionCartModel.findOne({ collect_url, user_id });
        if (collect !== null) {
            CollectionCartModel.deleteOne({ collect_url, collect_desc, user_id });
            return res.json({ message: '取消收藏成功' });
        } else {
            CollectionCartModel.create({ collect_url, collect_desc, user_id });
            return res.json({ message: '收藏成功' });
        }
    } catch (error) {
        res.json({ message: '操作失败', error });
    }
});
/**
 * GET /collect/all/:page
 * 查看收藏列表
 */
CollectionCartRoute.get('/collect/all/:page', async (req, res) => {
    const user_id = req.user._id;
    const page = req.params.page;
    const page_size = 20;
    CollectionCartModel
        .find({ user_id })
        .skip((page - 1) * page_size)
        .limit(page_size)
        .then((collects) => {
            if (!collects) {
                return res.status(422).json({ message: 'The collect list is empty.' });
            }
            return res.json({ collects });
        });
});
// 导出路由
module.exports = { CollectionCartRoute };
