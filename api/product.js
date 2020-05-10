/**
 * 家具接口文件
 */
// 引入依赖
const express = require('express');
const ProductModel = require('../models/Product');
const { redisClient } = require('../config/conn');
const fetch = require('node-fetch');

const router = express.Router();

const store_check = {
    '802': '北京四元桥商场',
    '214': '北京西红门商场',
    '418': '成都成华商场',
    '466': '成都高新商场',
    '495': '大连商场',
    '459': '佛山商场',
    '544': '广州番禺商场',
    '584': '广州天河商场',
    '571': '贵阳商场',
    '485': '哈尔滨商场',
    '401': '杭州商场',
    '521': '济南商场',
    '481': '南京商场',
    '512': '南通商场',
    '279': '宁波商场',
    '247': '上海宝山商场',
    '885': '上海北蔡商场',
    '856': '上海徐汇商场',
    '585': '上海杨浦',
    '833': '深圳商场',
    '886': '沈阳商场',
    '484': '苏州商场',
    '058': '天津东丽商场',
    '558': '天津中北商场',
    '164': '无锡商场',
    '340': '武汉商场',
    '424': '西安商场',
    '568': '徐州商场',
    '572': '郑州商场',
    '330': '重庆商场',
};

const queryProductInfo = (result, schema) => {
    const product = {};
    schema.split(',').map(v => {
        product[v] = result[v];
    });
    return product;
}
/**
 * Get /product/:product_id/:schema
 * 根据产品ID获取产品信息
 * @param product_id [产品id]
 * @param schema     [获取规则]
 */
router.get('/product/:product_id/:schema', async (req, res) => {
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
                        return res.status(422).json({
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
 * Get /products/:query_params/:schema
 * 根据产品ID获取产品信息
 * @param query_params [产品搜索关键词]
 * @param schema       [获取规则]
 */
router.get('/products/:query_params/:schema', async (req, res) => {
    const query_params = req.params.query_params;
    const schema = req.params.schema.replace(/[{}]/g, '');
    const filter_query = {};
    query_params.split('&').map(v => {
        const query_param = v.split('=');
        filter_query[query_param[0]] = query_param[1];
    });
    ProductModel
        .find(filter_query)
        .then(products => {
            if (!products) {
                return res.status(422).json({
                    message: 'The products is not find.',
                });
            }
            const products_info = [];
            products.map(product => {
                products_info.push(queryProductInfo(product, schema));
            });
            return res.json({ products_info });
        });
});
/**
 * Get /product/:product_id/stores/:store_check_num
 * 根据产品ID获取产品信息
 * @param product_id      [产品id]
 * @param store_check_num [库存地址的代号]
 */
router.get('/product/:product_id/stores/:store_check_num', async (req, res) => {
    const store_check_num = req.params.store_check_num;
    const product_id = req.params.product_id;
    const response = await fetch(`https://iows.ikea.cn/retail/iows/cn/zh/stores/${store_check_num}/availability/ART/${product_id}`, {
        headers: {
            'accept': 'application/vnd.ikea.iows+json;version=1.0',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'consumer': 'MAMMUT',
            'contract': '37249',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site'
        },
        referrerPolicy: 'no-referrer-when-downgrade',
        body: null,
        method: 'GET',
        mode: 'cors',
    });
    const data = await response.json();
    const available_stock = data.StockAvailability.RetailItemAvailability.AvailableStock;
    res.json({ store_name: store_check[store_check_num], available_stock: available_stock.$ });
});
// 导出路由
module.exports = router;
