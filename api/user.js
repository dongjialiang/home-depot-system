// 引入依赖
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const validator = require('validator');
const UserModel = require('../models/User');

const randomBytesAsync = promisify(crypto.randomBytes);

const EXPIRES_TIME = {
    ONEDAY: Date.now() + 24 * 3600 * 1000,
    FIVEMINUTES: Date.now() + 300 * 1000,
}

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
            console.log(`<${email}>${title} - ${content}${token}_${expires_time}`);
            /* mailer(email, title, `${content}${token}`)
                .catch(err => console.error(err)); */
        });
}
// 重置邮箱验证码和过期时间
const resetEmailToken = (user) => {
    user.emailToken = undefined;
    user.emailExpires = undefined;
    user.isEmailActivated = true;
}

const router = express.Router();
/**
 * POST /signup
 * 注册
 * @param email    [邮箱地址]
 * @param password [用户密码]
 */
router.post('/signup',
    passport.authenticate('signup', { session: false }),
    async (req, res) => {
        if (req.user.message) {
            return res.status(422).json({ 'message': req.user.message });
        }
        const email = req.user.email;
        await res.json({
            message: 'Signup successful.',
            user: {
                '_id': req.user._id,
                email,
            },
        });
        sendVerifyEmail(req.user, EXPIRES_TIME.ONEDAY, '绑定邮箱', '绑定邮箱的验证码');
    }
);
/**
 * POST /login
 * 登录
 * @param email    [邮箱地址]
 * @param password [用户密码]
 */
router.post('/login', async (req, res, next) => {
    passport.authenticate('login', async (err, user, info) => {
        try {
            if (err || !user) {
                return res.status(422).json(info);
            }
            req.login(user, { session: false }, async (error) => {
                if (error) { return next(error); }
                const body = { _id: user._id, email: user.email };
                const token = jwt.sign({ user: body }, 'top_secret', { expiresIn: '14d' });
                return res.json({ 'message': info.message, token });
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
                res.status(422).json({ message: 'Please confirm your email address.' });
            } else if (user.isEmailActivated) {
                res.status(422).json({ message: 'The email is activated.' });
            } else if (user.emailExpires > Date.now()) { // 验证码还未过期
                res.json({ message: 'Please verify your email.' });
            } else {
                res.json({ message: 'Please verify your email.' });
                sendVerifyEmail(user, EXPIRES_TIME.ONEDAY, '绑定邮箱', '绑定邮箱的验证码');
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
    if (!validator.isEmail(req.body.email)) {
        return res.status(422).json({ message: 'Please confirm your email address.' });
    }
    if (!validator.isLength(req.body.emailToken, { min: 8 })) {
        return res.status(422).json({ message: 'The email token must be at least 8 characters long.' });
    }
    const email = req.body.email;
    UserModel
        .findOne({ email })
        .where('emailExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) { return next(err); }
            if (!user || (user.emailToken != req.body.emailToken)) {
                return res.status(422).json({ message: 'Verify email token is invalid or has expired.' });
            } else if (user.isEmailActivated) {
                res.status(422).json({ message: 'The email is activated.' });
            } else {
                resetEmailToken(user);
                user.save();
                res.json({ message: 'Verify email Succeessed!' });
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
                res.status(422).json({ message: 'Please confirm your email address.' });
            } else if (user.isEmailActivated && user.emailExpires > Date.now()) {
                res.status(422).json({ message: 'Please verify your email.' });
            } else if (user.isEmailActivated) {
                res.json({ message: 'Please verify your email.' });
                sendVerifyEmail(user, EXPIRES_TIME.FIVEMINUTES, '重置密码', '重置密码的验证码');
            } else {
                res.status(422).json({ message: 'Please bind your email.' });
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
    if (!validator.isEmail(req.body.email)) {
        return res.status(422).json({ message: 'Please confirm your email address.' });
    }
    // 验证密码的格式
    if (!validator.isLength(req.body.password, { min: 8 })) {
        return res.status(422).json({ message: 'Password must be at least 8 characters long.' });
    }
    if (!validator.isLength(req.body.emailToken, { min: 8 })) {
        return res.status(422).json({ message: 'The email token must be at least 8 characters long.' });
    }
    const email = req.body.email;
    UserModel
        .findOne({ email })
        .where('emailExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) { return next(err); }
            if (!user || (user.emailToken != req.body.emailToken)) {
                return res.status(422).json({ message: 'Password reset token is invalid or has expired.' });
            } else {
                resetEmailToken(user);
                user.password = req.body.password;
                user.save();
                res.json({ message: 'Password reset Succeessed!' });
            }
        });
});

module.exports = router;
