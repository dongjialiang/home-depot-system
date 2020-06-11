/**
 * 提取并缓存商品信息的文件
 */
// 引入依赖
const { redisClient } = require('../config/conn');
const store_check = require('../config/store_check');
const fetch = require('node-fetch');
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
    if (schema === 'all') { // 获取所有信息
        return result;
    } else { // 获取具体信息
        const product = {};
        product['product_id'] = result['product_id'];
        schema.split(',').map(v => {
            product[v] = result[v];
        });
        return product;
    }
}
// 导出对应函数
module.exports = { getProductionStockCheckNum, queryProductInfo };
