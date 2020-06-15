/**
 * 订单接口文件
 */
// 引入依赖
const express = require('express');
const { redisClient } = require('../config/conn');
const OrderModel = require('../models/Order');
const { getProductionStockCheckNum, queryProductInfo } = require('../config/product-info');
const store_check = require('../config/store_check');
// 创建路由
const OrderRoute = express.Router();
/**
 * POST /:product_id/:store_check_num/add
 * 提交商品订单
 * @param product_id      [产品id]
 * @param store_check_num [库存地址的代号]
 * @param first_name      [提交订单时留下的姓, 可随便填写]
 * @param last_name       [提交订单时留下的名, 可随便填写]
 * @param address         [添加入购物车的商品数量]
 * @param num             [添加入购物车的商品数量]
 */
OrderRoute.post('/:product_id/:store_check_num/add', async (req, res) => {
    const store_check_num = req.params.store_check_num;
    const product_id = req.params.product_id;
    const user_id = req.user._id;
    const num = req.body.num;
    const product_id_store_check_num = `${product_id}_${store_check_num}`;
    const product_of_order = req.body;
    product_of_order['product_id'] = product_id;
    product_of_order['user_id'] = user_id;
    product_of_order['store_check_name'] = store_check[store_check_num];
    const order = new OrderModel(product_of_order);
    redisClient.get(product_id_store_check_num, async (err, data) => {
        if (err) {
            console.error(err);
        }
        let prouduct_available_stock = await JSON.parse(data);
        prouduct_available_stock = prouduct_available_stock || await getProductionStockCheckNum(product_id, store_check_num, product_id_store_check_num);
        if (prouduct_available_stock.available_stock <= 0) {
            return res.status(422).json({message: 'The order is not available stock.'});
        }
        if (prouduct_available_stock.available_stock <= num) {
            return res.status(422).json({message: 'The order is not enough.'});
        }
        order.save((err, data) => {
            if (err) {
                throw err;
            }
            res.json(data);
        });
    });
});
/**
 * DELETE /:order_id/remove
 * 删除订单
 * @param order_id [购物车id]
 */
OrderRoute.delete('/:order_id/remove', async (req, res) => {
    const order_id = req.params.order_id;
    OrderModel.findByIdAndDelete(order_id, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (!data) {
            return res.status(422).json({ message: 'The order is delete failed.' });
        }
        res.json({ message: 'The order is delete successful.' });
    });
});
/**
 * PATCH /:order_id/update
 * 修改订单
 * @param order_id         [购物车id]
 * @param first_name       [提交订单时留下的姓, 可随便填写]
 * @param last_name        [提交订单时留下的名, 可随便填写]
 * @param address          [收货地址]
 * @param phone            [联系电话]
 * @param store_check_name [商场名称]
 * @param num              [购物车数量]
 */
OrderRoute.patch('/:order_id/update', async (req, res) => {
    const order_id = req.params.order_id;
    const num = req.body.num;
    OrderModel.findOneAndUpdate({ _id: order_id }, {
        num,
    }, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (!data) {
            return res.status(422).json({ message: 'The order is update failed.' });
        }
        res.json({ message: 'The order is update successful.' });
    });
});
/**
 * Get /get/:order_id
 * 获取订单
 * @param order_id [购物车id]
 */
OrderRoute.get('/get/:order_id', async (req, res) => {
    const order_id = req.params.order_id;
    OrderModel.findOne({ _id: order_id },
        (err, data) => {
        if (err) {
            console.error(err);
        }
        if (!data) {
            return res.status(422).json({ message: 'The order is not exist.' });
        }
        res.json({ order_info: data });
    });
});
/**
 * GET /all/:page/:schema
 * 查看自己的所有订单
 * @param page   [页码]
 * @param schema [获取订单的规则]
 */
OrderRoute.get('/all/:page/:schema', async (req, res) => {
    const user_id = req.user._id;
    const page = req.params.page;
    const schema = req.params.schema.replace(/[{}]/g, '');
    const page_size = 20;
    OrderModel
        .find({ user_id })
        .skip((page - 1) * page_size)
        .limit(page_size)
        .then(async (orders) => {
            if (!orders) {
                return res.status(422).json({ message: 'The orders is empty.' });
            }
            const orders_info = [];
            orders.map(order => {
                orders_info.push(queryProductInfo(order, schema));
            });
            const total = await orders_info.length;
            return res.json({ orders_info, total });
        });
});
// 导出路由
module.exports = { OrderRoute };
