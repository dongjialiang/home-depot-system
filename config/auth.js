/*
 * 用户验证的文件
 */
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const validator = require('validator');
const UserModel = require('../models/User');

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
        if (!validator.isLength(password, { min: 8 })) {
            return done(null, false, { message: 'Password must be at least 8 characters long.' });
        }
        const invalidMessage = 'Invalid email or password.';
        const user = await UserModel.findOne({ email });
        if (!user) {
            return done(null, false, { message: invalidMessage });
        }
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return done(null, false, { message: invalidMessage });
        }
        return done(null, user, { message: 'Logged in Successfully.' });
    } catch (error) {
        return done(error);
    }
}));

passport.use(new JWTstrategy({
    secretOrKey: 'top_secret',
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
}, async (token, done) => {
    try {
        return done(null, token.user);
    } catch (error) {
        done(error);
    }
}));
