// 引入依赖
const request = require('supertest');
const { expect } = require('chai');
// const app = require('../server'); // 直接使用服务器测试
const app = 'http://localhost:7326'; // 在服务器开启的情况下进行测试
const UserModel = require('../models/User');

let jwtToken;
let emailToken;
// 编写测试用例
const user1 = {
    email: 'ljd9726',
    password: '99887766',
}
const user2 = {
    email: 'ljd97286@163.com',
    password: '9988776',
}
const user3 = {
    email: 'ljd9726@163.com',
    password: '99887768',
}
const user4 = {
    email: 'ljd9726@163.com',
    password: '12345678',
}
const user5 = {
    email: 'ljd9726@163.com',
}
const user6 = {
    email: 'ljd9726@163com',
}
const user7 = {
    email: 'ljd9726@163.com',
    emailToken: '',
    password: '23490',
}
// 测试注册接口
describe("POST /signup", () => {
    it('should "Please enter a valid email address."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send(user1)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please enter a valid email address.');
                done();
            });
    });
    it('should "Password must be at least 8 characters long."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send(user2)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Password must be at least 8 characters long.');
                done();
            });
    });
    /* it('should "Signup successful."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send(user4)
            .expect(200)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Signup successful.');
                done();
            });
    }); */
    it('should "The account already exists."', (done) => {
        request(app)
            .post('/api/user/signup')
            .send(user4)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('The account already exists.');
                done();
            });
    });
});
// 测试登录接口
describe('POST /login', () => {
    it('should "Invalid email or password."', (done) => {
        request(app)
            .post('/api/user/login')
            .send(user3)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Invalid email or password.');
                done();
            });
    });
    it('should "Logged in Successfully."', (done) => {
        request(app)
            .post('/api/user/login')
            .send(user4)
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
    it('should "Please bind your email."', (done) => {
        request(app)
            .post('/api/user/resetpassword')
            .send(user5)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please bind your email.');
                done();
            });
    });
});
// 测试发送邮箱验证码的邮件接口
describe('POST /verifyemail', () => {
    it('should "Please verify your email."', (done) => {
        request(app)
            .post('/api/user/verifyemail')
            .send(user5)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please verify your email.');
                done();
            });
    });
    it('should "Please confirm your email address."', (done) => {
        request(app)
            .post('/api/user/verifyemail')
            .send(user6)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('Please confirm your email address.');
                done();
            });
    });
});
// 测试邮箱绑定接口
describe('POST /verifyemailtoken', () => {
    it('should "The email token must be at least 8 characters long."', (done) => {
        request(app)
            .post('/api/user/verifyemailtoken')
            .send(user7)
            .expect(401)
            .end((err, res) => {
                if (err) { return done(err); }
                expect(res.body.message).equal('The email token must be at least 8 characters long.');
                done();
            });
    });
});
// 测试登录jwt保护的页面
describe('Get /profile', () => {
    it('should "You made it to the secure route."', (done) => {
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
});
// 测试请求限制功能
describe('Get /profile', () => {
    it('should "Too Many Requests"', (done) => {
        request(app)
            .get('/api/secure/profile')
            .set('Authorization', `bearer ${jwtToken}`)
            .expect(429)
            .end((err, res) => {
                if (err) { return done(err); }
                done();
            });
    });
});
