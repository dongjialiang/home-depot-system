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
        .then(async (b_title_info) => {
            if (!b_title_info) {
                return res.status(422).json({ message: 'The b_title list is empty.' });
            }
            const total = await b_title_info.length;
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
        .then(async (s_title_info) => {
            if (!s_title_info) {
                return res.status(422).json({ message: 'The s_title list is empty.' });
            }
            const total = await s_title_info.length;
            return res.json({ s_title_info, total });
        });
});
/**
 * GET /keyword/:keyword/:page
 * 通过关键字查找产品列表
 */
SearchRoute.get('/keyword/:keyword/:page', async (req, res) => {
    const keyword = req.params.keyword; // 获取关键字
    const reg = new RegExp(keyword, 'i'); // 不区分大小写
    const page = req.params.page;
    const page_size = 24;
    // 多条件模糊查询参数
    const query_param = {
        $or: [
            { b_title: { $regex: reg }},
            { s_title: { $regex: reg }},
            { name: { $regex: reg }},
            { type_name: { $regex: reg }},
            { desc: { $regex: reg }},
            { doc: { $regex: reg }},
            { detail: { $regex: reg }},
            { enviroment_and_material: { $regex: reg }},
            { instruction: { $regex: reg }},
        ]
    };
    ProductModel
        .find(query_param)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .then(async (search_data) => {
            if (!search_data) {
                return res.status(422).json({ message: 'The search data is empty.' });
            }
            const total = await ProductModel.find(query_param).countDocuments();
            return res.json({ search_data, total });
        });
});
// 导出路由
module.exports = { SearchRoute };
