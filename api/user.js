/**
 * 用户接口文件
 */
// 引入依赖
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { isEmail, isLength } = require('validator');
const UserModel = require('../models/User');
const crypto = require('crypto');
const { promisify } = require('util');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { redisClient } = require('../config/conn');
const { publishMessage } = require('../services/emailWorker');
const HttpStatus = require('http-status-codes');
// 引入配置
require('dotenv').config('../config/.env');

const EXPIRES_TIME = { // 过期时间
    ONEDAY: () => Date.now() + 24 * 3600 * 1000, // 一天
    FIVEMINUTES: () => Date.now() + 300 * 1000,  // 五分钟
}

const maxWrongAttemptsByIPperDay = 50;        // 允许IP每天运行尝试的最大错误数
const maxConsecutiveFailsByUsernameAndIP = 5; // 允许用户名和IP最大连续失败次数

// 每个IP每天允许最大访问失败次数的限制器
const limiterSlowBruteByIP = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'login_fail_ip_per_day',
    points: maxWrongAttemptsByIPperDay,
    duration: 60 * 60 * 24,
    blockDuration: 60 * 60 * 24,
});
// 每个用户和IP(不同设备可能不同IP)允许最大连续访问失败次数的限制器
const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'login_fail_consecutive_username_and_ip',
    points: maxConsecutiveFailsByUsernameAndIP,
    duration: 60 * 60 * 24, // 从第一次失败开始存储24小时
    blockDuration: 60 * 15, // 阻塞15分钟
});

const randomBytesAsync = promisify(crypto.randomBytes);
// 创建随机验证码
const createRandomToken = randomBytesAsync(4)
    .then((buf) => buf.toString('hex'));
// 设置随机验证码
const setRandomToken = (token, expires_time, user) => {
    user.emailToken = token;
    user.emailExpires = expires_time;
    user.save();
    return [token, user.email];
}
// 发送验证邮件
const sendVerifyEmail = (user, expires_time, title, content) => {
    createRandomToken
        .then((token) => setRandomToken(token, expires_time, user))
        .then(([token, email]) => {
            const mailOption = {
                email,
                title,
                content: `${content}${token}`,
            };
            publishMessage(mailOption);
        });
}
// 重置邮箱验证码和过期时间
const resetEmailToken = (user) => {
    user.emailToken = undefined;
    user.emailExpires = undefined;
    user.isEmailActivated = true;
}
// 获取用户名和IP地址
const getUsernameAndIPKey = (username, ip) => `${username}_${ip}`;
// 创建路由
const router = express.Router();
/**
 * POST /signup
 * 注册
 * @param email    [邮箱地址]
 * @param password [用户密码]
 */
router.post('/signup',
    passport.authenticate('signup', { session: false }),
    async (req, res, next) => {
        if (req.user.message) {
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ 'message': req.user.message });
        }
        await req.login(req.user, { session: false }, async (error) => {
            if (error) { return next(error); }
            const body = { _id: req.user._id, email: req.user.email, banned: req.user.banned };
            const token = jwt.sign({ user: body }, process.env.TOP_SECRET, { expiresIn: '14d' });
            res.json({ 'message': 'Signup successful.', user: body, token });
        });
        sendVerifyEmail(req.user, EXPIRES_TIME.ONEDAY(), '绑定邮箱', '绑定邮箱的验证码');
    }
);
/**
 * POST /login
 * 登录
 * @param email    [邮箱地址]
 * @param password [用户密码]
 */
router.post('/login', async (req, res, next) => {
    if (!isLength(req.body.password, { min: 8 })) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .json({ message: 'Password must be at least 8 characters long.' });
    }

    const ipAddr = req.ip;
    const usernameAndIPKey = getUsernameAndIPKey(req.body.email, ipAddr);

    const [resUsernameAndIP, resSlowByIP] = await Promise.all([
        limiterConsecutiveFailsByUsernameAndIP.get(usernameAndIPKey),
        limiterSlowBruteByIP.get(ipAddr),
    ]);

    let retrySecs = 0; // 重试需要秒数

    if (resSlowByIP !== null
        && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {
        retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    } else if (resUsernameAndIP !== null
        && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
        retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
    }

    if (retrySecs > 0) {
        res.set('Retry-After', String(retrySecs));
        return res.status(HttpStatus.TOO_MANY_REQUESTS)
            .json({ message: 'Too Many Requests.' });
    }
    passport.authenticate('login', async (err, user, info) => {
        try {
            if (err) {
                return next(err);
            } else if (!user) {
                try {
                    const promises = [limiterSlowBruteByIP.consume(ipAddr)];
                    if (info.message === 'Invalid password.') {
                        promises.push(limiterConsecutiveFailsByUsernameAndIP
                            .consume(usernameAndIPKey));
                    }
                    await Promise.all(promises);
                    return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .json({ message: 'Invalid email or password.' });
                } catch (rlRejected) {
                    if (rlRejected instanceof Error) {
                        throw rlRejected;
                    } else {
                        res.set('Retry-After',
                            String(Math.round(rlRejected.msBeforeNext / 1000)) || 1);
                        return res.status(HttpStatus.TOO_MANY_REQUESTS)
                            .json({ message: 'Too Many Requests.' });
                    }
                }
            }
            req.login(user, { session: false }, async (error) => {
                if (error) { return next(error); }
                const body = {
                    _id: user._id,
                    email: user.email,
                    banned: user.banned
                };
                const token = jwt.sign({ user: body },
                    process.env.TOP_SECRET,
                    { expiresIn: '14d' });
                if (resUsernameAndIP !== null
                    && resUsernameAndIP.consumedPoints > 0) {
                    await limiterConsecutiveFailsByUsernameAndIP
                        .delete(usernameAndIPKey);
                }
                return res.json({ 'message': info.message, user: body, token });
            });
        } catch (error) {
            return next(error);
        }
    })(req, res, next);
});
/**
 * POST /verifyemail
 * 发送带激活邮箱验证码的邮件
 * @param email [邮箱地址]
 */
router.post('/verifyemail', async (req, res) => {
    const email = req.body.email;
    UserModel
        .findOne({ email })
        .then((user) => {
            if (!user) {
                res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'Please confirm your email address.' });
            } else if (user.isEmailActivated) {
                res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'The email is activated.' });
            } else if (user.emailExpires > Date.now()) { // 验证码还未过期
                res.json({ message: 'Please verify your email.' });
            } else {
                res.json({ message: 'Please verify your email.' });
                sendVerifyEmail(user, EXPIRES_TIME.ONEDAY(), '绑定邮箱', '绑定邮箱的验证码');
            }
        });
});
/**
 * POST /verifyemailtoken
 * 验证绑定邮箱的验证码是否正确
 * @param email      [邮箱地址]
 * @param emailToken [绑定邮箱的验证码]
 */
router.post('/verifyemailtoken', async (req, res, next) => {
    if (!isEmail(req.body.email)) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .json({ message: 'Please confirm your email address.' });
    }
    if (!isLength(req.body.emailToken, { min: 8 })) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .json({ message: 'The email token must be at least 8 characters long.' });
    }
    const email = req.body.email;
    UserModel
        .findOne({ email })
        .where('emailExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) { return next(err); }
            if (!user || (user.emailToken != req.body.emailToken)) {
                return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .json({ message: 'Verify email token is invalid or has expired.' });
            } else if (user.isEmailActivated) {
                res.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .json({ message: 'The email is activated.' });
            } else {
                resetEmailToken(user);
                user.save();
                res.json({ message: 'Verify email Successful!' });
            }
        });
});
/**
 * POST /resetpassword
 * 发送重置密码需要的验证码的邮件
 * @param email [邮箱地址]
 */
router.post('/resetpassword', async (req, res) => {
    const email = req.body.email;
    UserModel
        .findOne({ email })
        .then((user) => {
            if (!user) {
                res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'Please confirm your email address.' });
            } else if (user.isEmailActivated && user.emailExpires > Date.now()) {
                res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'Please verify your email.' });
            } else {
                res.json({ message: 'Please verify your email.' });
                sendVerifyEmail(user, EXPIRES_TIME.FIVEMINUTES(), '重置密码', '重置密码的验证码');
            }
        });
});
/**
 * POST /resetpasswordtoken
 * 重置密码
 * @param email      [邮箱地址]
 * @param password   [用户密码]
 * @param emailToken [重置密码的邮箱验证码]
 */
router.post('/resetpasswordtoken', async (req, res, next) => {
    if (!isEmail(req.body.email)) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'Please confirm your email address.' });
    }
    // 验证密码的格式
    if (!isLength(req.body.password, { min: 8 })) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'Password must be at least 8 characters long.' });
    }
    if (!isLength(req.body.emailToken, { min: 8 })) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'The email token must be at least 8 characters long.' });
    }
    const email = req.body.email;
    UserModel
        .findOne({ email })
        .where('emailExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) { return next(err); }
            if (!user || (user.emailToken != req.body.emailToken)) {
                return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ message: 'Password reset token is invalid or has expired.' });
            } else {
                resetEmailToken(user);
                user.password = req.body.password;
                user.save();
                res.json({ message: 'Password reset Successful!' });
            }
        });
});

module.exports = router;
