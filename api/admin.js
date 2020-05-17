/**
 * 管理员接口文件
 */
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { isLength } = require('validator');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const ProductModel = require('../models/Product');
const { redisClient } = require('../config/conn');

const maxWrongAttemptsByIPperDay = 50;       // 允许IP每天运行尝试的最大错误数
const maxConsecutiveFailsByUsernameAndIP = 5; // 允许用户名和IP最大连续失败次数

const limiterSlowBruteByIP = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'login_fail_ip_per_day',
    points: maxWrongAttemptsByIPperDay,
    inmemoryBlockOnConsumed: maxWrongAttemptsByIPperDay,
    duration: 60 * 60 * 24,
    blockDuration: 60 * 60 * 24,
})
const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'login_fail_consecutive_username_and_ip',
    points: maxConsecutiveFailsByUsernameAndIP,
    inmemoryBlockOnConsumed: maxConsecutiveFailsByUsernameAndIP,
    duration: 60 * 60 * 24, // 从第一次失败开始存储24小时
    blockDuration: 60 * 15, // 阻塞15分钟
});
// 获取用户名和IP地址
const getUsernameAndIPKey = (username, ip) => `admin_${username}_${ip}`;

const adminRoute = express.Router();
const adminProductRoute = express.Router();
/**
 * POST /signup
 * 注册
 * @param username [用户名]
 * @param password [用户密码]
 */
adminRoute.post('/signup',
    passport.authenticate('addadmin', { session: false }),
    async (req, res) => {
        if (req.user.message) {
            return res.status(422).json({ 'message': req.user.message });
        }
        const username = req.user.username;
        await res.json({
            message: 'Signup successful.',
            user: {
                '_id': req.user._id,
                username,
            },
        });
    }
);
/**
 * POST /login
 * 登录
 * @param username [邮箱地址]
 * @param password [用户密码]
 */
adminRoute.post('/login', async (req, res, next) => {
    if (!isLength(req.body.password, { min: 8 })) {
        return res.status(422).json({ message: 'Password must be at least 8 characters long.' });
    }

    const ipAddr = `admin${req.ip}`;
    const usernameAndIPKey = getUsernameAndIPKey(req.body.username, ipAddr);

    const [resUsernameAndIP, resSlowByIP] = await Promise.all([
        limiterConsecutiveFailsByUsernameAndIP.get(usernameAndIPKey),
        limiterSlowBruteByIP.get(ipAddr),
    ]);

    let retrySecs = 0;

    if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {
        retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    } else if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
        retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
    }

    if (retrySecs > 0) {
        res.set('Retry-After', String(retrySecs));
        return res.status(429).json({ message: 'Too Many Requests.' });
    }
    passport.authenticate('adminlogin', async (err, user, info) => {
        try {
            if (err) {
                return next(err);
            } else if (!user) {
                try {
                    const promises = [limiterSlowBruteByIP.consume(ipAddr)];
                    if (info.message === 'Invalid password.') {
                        promises.push(limiterConsecutiveFailsByUsernameAndIP.consume(usernameAndIPKey));
                    }
                    await Promise.all(promises);
                    return res.status(422).json({ message: 'Invalid username or password.' });
                } catch (rlRejected) {
                    if (rlRejected instanceof Error) {
                        throw rlRejected;
                    } else {
                        res.set('Retry-After', String(retrySecs));
                        return res.status(429).json({ message: 'Too Many Requests.' });
                    }
                }
            }
            req.login(user, { session: false }, async (error) => {
                if (error) { return next(error); }
                const body = { _id: user._id, username: user.username, manager: user.manager, };
                const token = jwt.sign({ user: body }, process.env.TOP_SECRET, { expiresIn: '14d' });
                if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
                    await limiterConsecutiveFailsByUsernameAndIP.delete(usernameAndIPKey);
                }
                return res.json({ 'message': info.message, token });
            });
        } catch (error) {
            return next(error);
        }
    })(req, res, next);
});
/**
 * POST /add
 * 管理员新建产品
 * @param product_id [产品id]
 * @param ...        [其他产品信息]
 */
adminProductRoute.post('/add', async (req, res) => {
    if (!req.user.manager) {
        return res.status(422).json({ message: 'The account is not manager.' });
    }
    ProductModel.create(req.body, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data === null) {
            return res.status(422).json({ message: 'The product is add failed.' });
        }
        res.json({ message: 'The product is add successful.' });
    });
});
/**
 * PATCH /:product_id/update
 * 管理员修改产品
 * @param product_id [产品id]
 * @param ...        [其他产品信息]
 */
adminProductRoute.patch('/:product_id/update', async (req, res) => {
    const product_id = await req.params.product_id;
    if (!req.user.manager) {
        return res.status(422).json({ message: 'The account is not manager.' });
    }
    ProductModel.findOneAndUpdate({ product_id }, req.body, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data === null) {
            return res.status(422).json({ message: 'The product is update failed.' });
        }
        res.json({ message: 'The product is update successful.' });
    });
});
/**
 * DELETE /:product_id/delete
 * 管理员修改产品
 * @param product_id [产品id]
 */
adminProductRoute.delete('/:product_id/delete', async (req, res) => {
    const product_id = await req.params.product_id;
    if (!req.user.manager) {
        return res.status(422).json({ message: 'The account is not manager.' });
    }
    ProductModel.findOneAndDelete({ product_id }, (err, data) => {
        if (err) {
            console.error(err);
        }
        if (data === null) {
            return res.status(422).json({ message: 'The product is delete failed.' });
        }
        res.json({ message: 'The product is delete successful.' });
    });
});

module.exports = { adminRoute, adminProductRoute };
