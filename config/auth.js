/**
 * 用户验证的文件
 */
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const { isEmail, isLength } = require('validator');
const UserModel = require('../models/User');
const AdminUserModel = require('../models/AdminUser');
const jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
// 引入配置
require('dotenv').config('../config/.env');

// 用户注册验证
passport.use('signup', new localStrategy({
    usernameField: 'email',
}, async (email, password, done) => {
    try {
        if (!isEmail(email)) {
            return done(null, { message: 'Please enter a valid email address.' });
        }
        if (!isLength(password, { min: 8 })) {
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
// 用户登录验证
passport.use('login', new localStrategy({
    usernameField: 'email',
}, async (email, password, done) => {
    try {
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
// 管理员注册验证
passport.use('addadmin', new localStrategy(async (username, password, done) => {
    try {
        if (!isLength(username, { min: 3 })) {
            return done(null, { message: 'Username must be at least 3 characters long.' });
        }
        if (!isLength(password, { min: 8 })) {
            return done(null, { message: 'Password must be at least 8 characters long.' });
        }
        const existedUser = await AdminUserModel.findOne({ username });
        if (existedUser) {
            return done(null, { message: 'The account already exists.' });
        }
        const user = await AdminUserModel.create({ username, password });
        return done(null, user);
    } catch (error) {
        done(error);
    }
}));
// 管理员登录验证
passport.use('adminlogin', new localStrategy(async (username, password, done) => {
    try {
        const user = await AdminUserModel.findOne({ username });
        if (!user) {
            return done(null, false, { message: 'Invalid username.' });
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
// 用户验证
const authenticate = async (req, res, next) => {
    try {
        const raw = String(req.headers.authorization).split(' ').pop();
        const { user } = await jwt.verify(raw, process.env.TOP_SECRET);
        if (user.banned) {
            return res.status(HttpStatus.UNAUTHORIZED).json({message: 'The user is banned.'});
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({message: 'invalid signature.'});
    }
};

module.exports = { authenticate };
