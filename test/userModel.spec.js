/*
 * 编写数据库测试用例的文件
 */
// 引入依赖
const { expect } = require('chai');
const { after, before, describe, it } = require('mocha');
const mongoose = require('mongoose');
const { mongoDBTestConnUrl } = require('../config/conn');
const UserModel = require('../models/User');
// 引入配置
require('dotenv').config({ path: `${process.cwd()}/config/.env` });

before((done) => {
    mongoose.set('useCreateIndex', true);
    mongoose.connect(mongoDBTestConnUrl, {
        useNewUrlParser: true,    // 启用新的字符串连接解释器
        useUnifiedTopology: true, // 启用新的拓扑引擎,删除几个旧的连接选项
    })
    .then(() => { /* console.log('MongoDB connection succeeded'); */ });
    mongoose.connection.on('error', error => console.error(error));
    mongoose.Promise = global.Promise;
    done();
});

describe('User Model', () => {
    const userData = {
        email: '2530604880@qq.com',
        password: '12345678',
    }
    const user = new UserModel(userData);
    it('should create a new user', (done) => {
        user.save((err) => {
            if (err) { return done(err); }
            expect(err).to.be.null;
            done();
        });
    });
    it('should update a user password', (done) => {
        UserModel.findOne({
            email: userData.email,
        }).exec((err, user) => {
            if (err) { return done(err); }
            user.password = '87654321';
            user.save();
            done();
        });
    });
    it('should update a user isEmailActivated', (done) => {
        UserModel.findOne({
            email: userData.email,
        }).exec((err, user) => {
            if (err) { return done(err); }
            user.isEmailActivated = true;
            user.save();
            done();
        });
    });
    it('should compare the user password', (done) => {
        user.comparePassword(userData.password).then((isValidPassword) => {
            expect(isValidPassword).to.be.true;
            done();
        });
    });
    it('should remove a user', (done) => {
        user.remove((err) => {
            if (err) { return done(err); }
            expect(err).to.be.null;
            done();
        });
    });
});
after((done) => {
    UserModel.db.dropCollection('user');
    done();
});
