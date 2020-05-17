/**
 * 家具接口文件
 */
// 引入依赖
const express = require('express');
const ProductModel = require('../models/Product');
const { redisClient } = require('../config/conn');
const store_check = require('../config/store_check.config');
const fetch = require('node-fetch');
const ShoppingCartModel = require('../models/ShoppingCart');

const ProductRoute = express.Router();
const ShoppingCartRoute = express.Router();
// 获取商品库存数
const getProductionStockCheckNum = async (product_id, store_check_num, product_id_store_check_num) => {
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
    const prouduct_available_stock = { store_name: store_check[store_check_num], available_stock: available_stock.$ };
    redisClient.setex(product_id_store_check_num, 3600, JSON.stringify(prouduct_available_stock));
    return prouduct_available_stock;
}
// 查询商品对应信息
const queryProductInfo = (result, schema) => {
    const product = {};
    schema.split(',').map(v => {
        product[v] = result[v];
    });
    return product;
}
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
 * GET /all/:query_params/:schema
 * 根据产品ID获取产品信息
 * @param query_params [产品搜索关键词]
 * @param schema       [获取规则]
 */
ProductRoute.get('/all/:query_params/:schema', async (req, res) => {
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
 * GET /:product_id/stores/:store_check_num
 * 根据产品ID获取产品信息
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
        if (prouduct_available_stock === null) {
            prouduct_available_stock = await getProductionStockCheckNum(product_id, store_check_num, product_id_store_check_num);
        }
        res.json(prouduct_available_stock);
    });
});
/**
 * POST /:product_id/:store_check_num/add
 * 添加商品到购物车
 * @param product_id      [产品id]
 * @param store_check_num [库存地址的代号]
 * @param num             [添加入购物车的商品数量]
 */
ShoppingCartRoute.post('/:product_id/:store_check_num/add', async (req, res) => {
    const store_check_num = req.params.store_check_num;
    const product_id = req.params.product_id;
    const num = req.body.num;
    const user_id = req.user._id;
    const product_id_store_check_num = `${product_id}_${store_check_num}`;
    const product_of_shopping_cart = {
        product_id,
        user_id,
        num,
    };
    const shopping_cart = new ShoppingCartModel(product_of_shopping_cart);
    redisClient.get(product_id_store_check_num, async (err, data) => {
        if (err) {
            console.error(err);
        }
        let prouduct_available_stock = await JSON.parse(data);
        if (prouduct_available_stock === null) {
            prouduct_available_stock = await getProductionStockCheckNum(product_id, store_check_num, product_id_store_check_num);
        }
        if (prouduct_available_stock.available_stock <= 0) {
            return res.status(422).json({message: 'The product is not available stock.'});
        }
        if (prouduct_available_stock.available_stock <= num) {
            return res.status(422).json({message: 'The product is not enough.'});
        }
        shopping_cart.save((err, data) => {
            if (err) {
                throw err;
            }
            res.json(data);
        });
    });
});
/**
 * DELETE /:shoppingcart_id/remove
 * 从购物车删除商品
 * @param shoppingcart_id [购物车id]
 */
ShoppingCartRoute.delete('/:shoppingcart_id/remove', async (req, res) => {
    const shoppingcart_id = req.params.shoppingcart_id;
    ShoppingCartModel.findByIdAndDelete(shoppingcart_id, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data === null) {
            return res.status(422).json({ message: 'The product is delete failed.' });
        }
        res.json({ message: 'The product is delete successful.' });
    });
});
/**
 * PUT /:shoppingcart_id/update
 * 从购物车删除商品
 * @param shoppingcart_id [购物车id]
 */
ShoppingCartRoute.put('/:shoppingcart_id/update', async (req, res) => {
    const shoppingcart_id = req.params.shoppingcart_id;
    const product_id = req.body.product_id;
    const num = req.body.num;
    const user_id = req.user._id;
    ShoppingCartModel.findOneAndUpdate({ _id: shoppingcart_id }, {
        product_id,
        num,
        user_id
    }, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data === null) {
            return res.status(422).json({ message: 'The product is update failed.' });
        }
        res.json({ message: 'The product is update successful.' });
    });
});
// 导出路由
module.exports = { ProductRoute, ShoppingCartRoute };
