/**
 * 查询接口文件
 */
// 引入依赖
const express = require('express');
const ProductModel = require('../models/Product');
// 创建路由
const SearchRoute = express.Router();
/**
 * GET /get/all/b_title
 * 查看产品大分类列表
 */
SearchRoute.get('/get/all/b_title', async (req, res) => {
    ProductModel
        .distinct('b_title')
        .then((b_title_info) => {
            if (!b_title_info) {
                return res.status(422).json({ message: 'The b_title list is empty.' });
            }
            const total = b_title_info.length;
            return res.json({ b_title_info, total });
        });
});
/**
 * GET /get/all/s_title/:b_title
 * 查看产品小分类列表
 */
SearchRoute.get('/get/all/s_title/:b_title', async (req, res) => {
    const b_title = req.params.b_title;
    ProductModel
        .find({ b_title })
        .distinct('s_title')
        .then((s_title_info) => {
            if (!s_title_info) {
                return res.status(422).json({ message: 'The collect list is empty.' });
            }
            const total = s_title_info.length;
            return res.json({ s_title_info, total });
        });
});
// 导出路由
module.exports = { SearchRoute };
