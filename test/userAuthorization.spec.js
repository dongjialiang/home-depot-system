/*
 * 编写用户验证测试用例的文件
 */
// 引入依赖
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server'); // 直接使用服务器测试
// const app = 'http://localhost:7326'; // 在服务器开启的情况下进行测试*1
// const { mongoDBConn, mongoDBConnUrl } = require('../config/conn'); // *1
const { before, beforeEach, describe, it } = require('mocha');

const UserModel = require('../models/User');
// 引入配置
require('dotenv').config({ path: `${process.cwd()}/config/.env` });

let jwtToken;
let resetPasswordToken;
before((done) => {
    // mongoDBConn(mongoDBConnUrl); // *1
    UserModel.deleteOne({
        email: 'ljd9726@163.com',
    }).then((err, user) => {
        if (err || !user) {
            return done();
        }
        done();
    });
});
// 测试注册接口
describe("POST /signup", () => {
    it('1. should "Please enter a valid email address."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send({
                email: 'ljd9726',
                password: '99887766',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please enter a valid email address.');
                done();
            });
    });
    it('2. should "Password must be at least 8 characters long."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send({
                email: 'ljd97286@163.com',
                password: '9988776',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Password must be at least 8 characters long.');
                done();
            });
    });
    it('3. should "Signup successful."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send({
                email: 'ljd9726@163.com',
                password: '12345678',
            })
            .expect(200)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Signup successful.');
                done();
            });
    });
    it('4. should "The account already exists."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send({
                email: 'ljd9726@163.com',
                password: '12345678',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('The account already exists.');
                done();
            });
    });
});
// 测试登录接口
describe('POST /login', () => {
    it('1. should "Invalid email or password."', (done) => {
        request(app)
            .post('/api/user/login')
            .send({
                email: 'ljd9726@163.com',
                password: '99887768',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Invalid email or password.');
                done();
            });
    });
    it('2. should "Logged in Successfully."', (done) => {
        request(app)
            .post('/api/user/login')
            .send({
                email: 'ljd9726@163.com',
                password: '12345678',
            })
            .expect(200)
            .end((err, res) => {
                if (err) { return done(err); }
                jwtToken = res.body.token;
                expect(res.body.message).equal('Logged in Successfully.');
                done();
            });
    });
});
// 测试发送重置密码的邮件接口
describe('POST /resetpassword', () => {
    it('1. should "Please bind your email."', (done) => {
        request(app)
            .post('/api/user/resetpassword')
            .send({
                email: 'ljd9726@163.com',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please bind your email.');
                done();
            });
    });
});
// 测试发送邮箱验证码的邮件接口
describe('POST /verifyemail', () => {
    it('1. should "Please verify your email."', (done) => {
        request(app)
            .post('/api/user/verifyemail')
            .send({ email: 'ljd9726@163.com' })
            .expect(200)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please verify your email.');
                done();
            });
    });
    it('2. should "Please confirm your email address."', (done) => {
        request(app)
            .post('/api/user/verifyemail')
            .send({ email: 'ljd9726@163com' })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please confirm your email address.');
                done();
            });
    });
});
// 测试邮箱绑定接口
describe('POST /verifyemailtoken', () => {
    let emailToken;
    beforeEach((done) => {
        UserModel
            .findOne({ email: 'ljd9726@163.com' })
            .then((user) => {
                emailToken = user.emailToken;
                done();
            });
    });
    it('1. should "The email token must be at least 8 characters long."', (done) => {
        request(app)
            .post('/api/user/verifyemailtoken')
            .send({
                email: 'ljd9726@163.com',
                emailToken: '123',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('The email token must be at least 8 characters long.');
                done();
            });
    });
    it('2. should "Verify email Succeessed!"', (done) => {
        request(app)
        .post('/api/user/verifyemailtoken')
        .send({
            email: 'ljd9726@163.com',
            emailToken,
        })
        .expect(200)
        .end((err, res) => {
            if (err) { return done(err); }
            expect(res.body.message).equal('Verify email Succeessed!');
            done();
        });
    });
});
// 测试发送重置密码的邮件接口
describe('POST /resetpassword', () => {
    it('2. should "Please verify your email."', (done) => {
        request(app)
            .post('/api/user/resetpassword')
            .send({
                email: 'ljd9726@163.com',
            })
            .expect(200)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please verify your email.');
                done();
            });
    });
    it('3. should "Please confirm your email address."', (done) => {
        request(app)
            .post('/api/user/resetpassword')
            .send({
                email: 'ljd976@163.com',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please confirm your email address.');
                done();
            });
    });
    it('4. should "Please verify your email."', (done) => {
        request(app)
            .post('/api/user/resetpassword')
            .send({
                email: 'ljd9726@163.com',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please verify your email.');
                done();
            });
    });
});
// 测试发送重置密码的邮件接口
describe('POST /resetpasswordtoken', () => {
    beforeEach((done) => {
        UserModel
            .findOne({ email: 'ljd9726@163.com' })
            .then((user) => {
                resetPasswordToken = user.emailToken;
                done();
            });
    });
    it('1. should "Password must be at least 8 characters long."', (done) => {
        request(app)
            .post('/api/user/resetpasswordtoken')
            .send({
                email: 'ljd9726@163.com',
                password: '876543',
                emailToken: resetPasswordToken,
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Password must be at least 8 characters long.');
                done();
            });
    });
    it('2. should "The email token must be at least 8 characters long."', (done) => {
        request(app)
            .post('/api/user/resetpasswordtoken')
            .send({
                email: 'ljd9726@163.com',
                password: '87654321',
                emailToken: '8907',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('The email token must be at least 8 characters long.');
                done();
            });
    });
    it('3. should "Password reset token is invalid or has expired."', (done) => {
        request(app)
            .post('/api/user/resetpasswordtoken')
            .send({
                email: 'ljd9726@163.com',
                password: '87654321',
                emailToken: '89070123',
            })
            .expect(422)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Password reset token is invalid or has expired.');
                done();
            });
    });
    it('4. should "Password reset Succeessed!"', (done) => {
        request(app)
            .post('/api/user/resetpasswordtoken')
            .send({
                email: 'ljd9726@163.com',
                password: '87654321',
                emailToken: resetPasswordToken,
            })
            .expect(200)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Password reset Succeessed!');
                done();
            });
    });
});
// 测试登录jwt保护的页面和请求限制功能
describe('Get /profile', () => {
    it('1. should "You made it to the secure route."', (done) => {
        request(app)
            .get('/api/secure/profile')
            .set('Authorization', `bearer ${jwtToken}`)
            .expect(200)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('You made it to the secure route.');
                done();
            });
    });
    // it('should "Too Many Requests."', (done) => {
    //     request(app)
    //         .get('/api/secure/profile')
    //         .set('Authorization', `bearer ${jwtToken}`)
    //         .expect(429)
    //         .end((err, res) => {
    //             if (err) { return done(err); }
    //             expect(res.body.message).equal('Too Many Requests.');
    //             done();
    //         });
    // });
});
