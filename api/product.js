/**
 * 家具接口文件
 */
// 引入依赖
const express = require('express');
const ProductModel = require('../models/Product');
const { redisClient } = require('../config/conn');
const { getProductionStockCheckNum, queryProductInfo } = require('../config/product-info');
const HttpStatus = require('http-status-codes');
// 创建路由
const ProductRoute = express.Router();
/**
 * GET /:product_id/:schema
 * 根据产品ID获取产品信息
 * @param product_id [产品id]
 * @param schema     [获取规则]
 */
ProductRoute.get('/:product_id/:schema', async (req, res) => {
    const product_id = req.params.product_id;
    const schema = req.params.schema.replace(/[{}]/g, '');
    redisClient.get(product_id, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data !== null) {
            const result = JSON.parse(data);
            return res.json(queryProductInfo(result, schema));
        } else {
            ProductModel
                .findOne({ 'product_id': product_id })
                .then(product => {
                    if (!product) {
                        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                            message: 'The product is not find.',
                        });
                    }
                    redisClient.setex(product_id, 3600, JSON.stringify(product));
                    return res.json(queryProductInfo(product, schema));
                });
        }
    });
});
/**
 * GET /all/:query_params/:schema
 * 根据查询规则获取产品信息
 * @param query_params [产品搜索关键词]
 * @param schema       [获取规则]
 * @param page         [页码]
 */
ProductRoute.get('/all/:query_params/:schema/:page', async (req, res) => {
    const query_params = req.params.query_params;
    const schema = req.params.schema.replace(/[{}]/g, '');
    const page = req.params.page;
    const page_size = 24;
    const filter_query = {};
    if (query_params !== 'all') {
        const string_filter_param = ['b_title', 's_title', 'name', 'is_new', 'online_sellable', 'type_name'];
        await query_params.split('&').map(v => {
            const query_param = v.split('=');

            if (string_filter_param.includes(query_param[0])) {
                filter_query[query_param[0]] = query_param[1];
            }
            // 查询颜色
            if (query_param[0] === 'color') {
                if (query_param[1].includes(',')) {
                    const colors_query_param = [];
                    query_param[1].split(',').map(v => {
                        colors_query_param.push({
                            'colors.name': v,
                        });
                    });
                    filter_query['$or'] = colors_query_param;
                } else {
                    filter_query['colors.name'] = query_param[1];
                }
            }
            // 查询价格
            if (query_param[0] === 'price') {
                const price_range = query_param[1].split('-');
                const price_query = {};
                if (price_range[0] != '') {
                    price_query['$gte'] = parseFloat(price_range[0]);
                }
                if (price_range[1] != '') {
                    price_query['$lte'] = parseFloat(price_range[1]);
                }
                filter_query['price'] = price_query;
            }
        });
    }
    ProductModel
        .find(filter_query)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .then(async products => {
            if (!products) {
                return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                    message: 'The products is empty.',
                });
            }
            const products_info = [];
            products.map(product => {
                products_info.push(queryProductInfo(product, schema));
            });
            const total = await ProductModel.find(filter_query).countDocuments();
            const color = await ProductModel.find(filter_query).distinct('colors.name');
            return res.json({ products_info, total, color });
        });
});
/**
 * GET /:product_id/stores/:store_check_num
 * 根据产品ID获取产品库存
 * @param product_id      [产品id]
 * @param store_check_num [库存地址的代号]
 */
ProductRoute.get('/:product_id/stores/:store_check_num', async (req, res) => {
    const store_check_num = req.params.store_check_num;
    const product_id = req.params.product_id;
    const product_id_store_check_num = `${product_id}_${store_check_num}`;
    redisClient.get(product_id_store_check_num, async (err, data) => {
        if (err) {
            console.error(err);
        }
        let prouduct_available_stock = JSON.parse(data);
        prouduct_available_stock = prouduct_available_stock || await getProductionStockCheckNum(product_id, store_check_num, product_id_store_check_num);
        res.json(prouduct_available_stock);
    });
});
// 导出路由
module.exports = { ProductRoute };
