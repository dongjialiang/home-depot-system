// /*
//  * 编写数据库测试用例的文件
//  */
// // 引入依赖
// const { expect } = require('chai');
// const { before, describe, it } = require('mocha');

// const { mongoDBConn, mongoDBTestConnUrl } = require('../config/conn');
// const UserModel = require('../models/User');
// // 引入配置
// require('dotenv').config({ path: `${process.cwd()}/config/.env` });

// before((done) => {
//     mongoDBConn(mongoDBTestConnUrl);
//     done();
// });

// const userData = {
//     email: '2530604880@qq.com',
//     password: '12345678',
// }
// describe('User Model', () => {
//     const user = new UserModel(userData);
//     it('should create a new user', (done) => {
//         user.save((err) => {
//             if (err) { return done(err); }
//             expect(err).to.be.null;
//             done();
//         });
//     });
//     it('should update a user password', (done) => {
//         UserModel.findOne({
//             email: userData.email,
//         }).exec((err, user) => {
//             if (err) { return done(err); }
//             user.password = '87654321';
//             user.save();
//             done();
//         });
//     });
//     it('should update a user isEmailActivated', (done) => {
//         UserModel.findOne({
//             email: userData.email,
//         }).exec((err, user) => {
//             if (err) { return done(err); }
//             user.isEmailActivated = true;
//             user.save();
//             done();
//         });
//     });
//     it('should compare the user password', (done) => {
//         user.comparePassword(userData.password).then((isValidPassword) => {
//             expect(isValidPassword).to.be.true;
//             done();
//         });
//     });
//     it('should remove a user', (done) => {
//         user.remove((err) => {
//             if (err) { return done(err); }
//             expect(err).to.be.null;
//             done();
//         });
//     });
// });
