/**
 * 购物车接口文件
 */
// 引入依赖
const express = require('express');
const { redisClient } = require('../config/conn');
const ShoppingCartModel = require('../models/ShoppingCart');
const { getProductionStockCheckNum, queryProductInfo } = require('../config/product-info');
const store_check = require('../config/store_check');
const HttpStatus = require('http-status-codes');
// 创建路由
const ShoppingCartRoute = express.Router();
/**
 * POST /:product_id/:store_check_num/add
 * 添加商品到购物车
 * @param product_id       [产品id]
 * @param store_check_num  [库存地址的代号]
 * @param num              [添加入购物车的商品数量]
 * @param store_check_name [商场名称]
 */
ShoppingCartRoute.post('/:product_id/:store_check_num/add', async (req, res) => {
    const store_check_num = req.params.store_check_num;
    const product_id = req.params.product_id;
    const num = req.body.num;
    const pic = req.body.pic;
    const price = req.body.price;
    const user_id = req.user._id;
    const store_check_name = store_check[store_check_num];
    const product_id_store_check_num = `${product_id}_${store_check_num}`;
    const product_of_shopping_cart = {
        product_id,
        user_id,
        num,
        store_check_name,
        pic,
        price
    };
    const shopping_cart = new ShoppingCartModel(product_of_shopping_cart);
    redisClient.get(product_id_store_check_num, async (err, data) => {
        if (err) { console.error(err); }
        let prouduct_available_stock = await JSON.parse(data);
        prouduct_available_stock = prouduct_available_stock
            || await getProductionStockCheckNum(product_id,
                store_check_num, product_id_store_check_num);
        if (prouduct_available_stock.available_stock <= 0) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .json({ message: 'The product is not available stock.' });
        }
        if (prouduct_available_stock.available_stock <= num) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .json({ message: 'The product is not enough.' });
        }
        shopping_cart.save((err, data) => {
            if (err) { throw err; }
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
        if (!data) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .json({ message: 'The product is delete failed.' });
        }
        res.json({ message: 'The product is delete successful.' });
    });
});
/**
 * PATCH /:shoppingcart_id/update
 * 从购物车修改商品
 * @param shoppingcart_id  [购物车id]
 * @param num              [购物车数量]
 * @param store_check_name [商场名称]
 */
ShoppingCartRoute.patch('/:shoppingcart_id/update', async (req, res) => {
    const shoppingcart_id = req.params.shoppingcart_id;
    const num = req.body.num;
    const store_check_name = req.body.store_check_name;
    ShoppingCartModel.findOneAndUpdate({ _id: shoppingcart_id }, {
        num,
        store_check_name,
    }, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (!data) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .json({ message: 'The product is update failed.' });
        }
        res.json({ message: 'The product is update successful.' });
    });
});
/**
 * GET /all/:page/:schema
 * 查看用户所有购物车商品
 * @param page   [页码]
 * @param schema [获取订单的规则]
 */
ShoppingCartRoute.get('/all/:page/:schema', async (req, res) => {
    const user_id = req.user._id;
    const page = req.params.page;
    const schema = req.params.schema.replace(/[{}]/g, '');
    const page_size = 20;
    ShoppingCartModel
        .find({ user_id })
        .skip((page - 1) * page_size)
        .limit(page_size)
        .then(async (shoppingcarts) => {
            if (!shoppingcarts) {
                return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .json({ message: 'The shoppingcart is empty.' });
            }
            const shoppingcarts_info = [];
            shoppingcarts.map(shoppingcart => {
                shoppingcarts_info.push(queryProductInfo(shoppingcart, schema));
            });
            const total = await ShoppingCartModel.find({ user_id }).countDocuments();
            return res.json({ shoppingcarts_info, total });
        });
});
// 导出路由
module.exports = { ShoppingCartRoute };
