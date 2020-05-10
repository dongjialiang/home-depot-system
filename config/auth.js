/**
 * 用户验证的文件
 */
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const validator = require('validator');
const UserModel = require('../models/User');
const jwt = require('jsonwebtoken');
// 引入配置
require('dotenv').config('../config/.env');

// 注册验证
passport.use('signup', new localStrategy({
    usernameField: 'email',
}, async (email, password, done) => {
    try {
        if (!validator.isEmail(email)) {
            return done(null, { message: 'Please enter a valid email address.' });
        }
        if (!validator.isLength(password, { min: 8 })) {
            return done(null, { message: 'Password must be at least 8 characters long.' });
        }
        const existedUser = await UserModel.findOne({ email });
        if (existedUser) {
            return done(null, { message: 'The account already exists.' });
        }
        const user = await UserModel.create({ email, password });
        return done(null, user);
    } catch (error) {
        done(error);
    }
}));
// 登录验证
passport.use('login', new localStrategy({
    usernameField: 'email',
}, async (email, password, done) => {
    try {
        // const invalidMessage = 'Invalid email or password.';
        const user = await UserModel.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'Invalid email.' });
        }
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return done(null, false, { message: 'Invalid password.' });
        }
        return done(null, user, { message: 'Logged in Successfully.' });
    } catch (error) {
        return done(error);
    }
}));

const authenticate = async (req, res, next) => {
    const raw = String(req.headers.authorization).split(' ').pop();
    const { user } = jwt.verify(raw, process.env.TOP_SECRET);
    req.user = await user;
    next();
};

module.exports = { authenticate };
