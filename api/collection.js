/**
 * 购物车接口文件
 */
// 引入依赖
const express = require('express');
const CollectionModel = require('../models/Collection');
// 创建路由
const CollectionRoute = express.Router();
/**
 * POST /action
 * 收藏或取消收藏商品或文章
 * @param collect_url  [收藏的商品或者文章的地址]
 * @param collect_desc [收藏的商品或者文章的描述]
 */
CollectionRoute.post('/action', async (req, res) => {
    try {
        const collect_id = req.body.collect_id;
        const collect_desc = req.body.collect_desc;
        const pic = req.body.pic;
        const collect_type = req.body.collect_type;
        const user_id = req.user._id;
        const collect = await CollectionModel.findOne({ collect_id, user_id, collect_type });
        if (collect !== null) {
            await CollectionModel.findOneAndDelete({ collect_id });
            return res.json({ message: '取消收藏成功' });
        } else {
            await CollectionModel.create({ collect_id, collect_desc, collect_type, pic, user_id });
            return res.json({ message: '收藏成功' });
        }
    } catch (error) {
        res.status(422).json({ message: '操作失败', error });
    }
});
/**
 * GET /collect/get/all/:page
 * 查看收藏列表
 */
CollectionRoute.get('/get/all/:page', async (req, res) => {
    const user_id = req.user._id;
    const page = req.params.page;
    const page_size = 20;
    CollectionModel
        .find({ user_id })
        .skip((page - 1) * page_size)
        .limit(page_size)
        .then((collects_info) => {
            if (!collects_info) {
                return res.status(422).json({ message: 'The collect list is empty.' });
            }
            const total = collects_info.length;
            return res.json({ collects_info, total });
        });
});
/**
 * GET /collect/get/:collect_id/:collect_type
 * 查看是否收藏
 */
CollectionRoute.get('/get/:collect_id/:collect_type', async (req, res) => {
    const user_id = req.user._id;
    const collect_id = req.params.collect_id;
    const collect_type = req.params.collect_type;
    CollectionModel
        .findOne({ collect_id, user_id, collect_type })
        .then((collect_info) => {
            if (!collect_info) {
                return res.json({ message: 'The collect is not exist.' });
            }
            return res.json({ collect_info });
        });
});
// 导出路由
module.exports = { CollectionRoute };
