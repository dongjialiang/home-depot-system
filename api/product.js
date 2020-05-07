/**
 * 家具接口文件
 */
// 引入依赖
const express = require('express');
const ProductModel = require('../models/Product');

const router = express.Router();

router.get('/product/:product_id', (req, res) => {
    const product_id = req.params;
    ProductModel
        .findOne(product_id)
        .then(user => {
            if (!user) {
                return res.status(422).json({
                    'message': 'The product is not exist.',
                });
            }
            res.json(user);
        });
});
module.exports = router;
