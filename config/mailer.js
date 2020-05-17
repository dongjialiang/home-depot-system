/**
 * 发送邮件的文件
 */
"use strict";
// 引入依赖
const crypto = require('crypto');
const nodemailer = require("nodemailer");
const { promisify } = require('util');
const UserModel = require('../models/User');
// 引入配置
require('dotenv').config({ path: `${process.cwd()}/config/.env` });

const randomBytesAsync = promisify(crypto.randomBytes);
// 创建随机验证码
const createRandomToken = randomBytesAsync(4)
    .then((buf) => buf.toString('hex'));
// 设置随机验证码
const setRandomToken = (token, expires_time, user) => {
    user.emailToken = token;
    user.emailExpires = expires_time;
    // user.save();
    UserModel.updateOne({ _id: user._id }, {
        emailToken: user.emailToken,
        emailExpires: user.emailExpires,
    });
    return [token, user.email];
}
async function mailer(to, subject, html) {
    // console.log(`<${to}>${subject} - ${html}`);
    let transporter = nodemailer.createTransport({
        host: "smtp.163.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    let info = await transporter.sendMail({
        from: '"ljd9726" <ljd9726@163.com>',
        to,
        subject,
        html,
    });

    return info.messageId;
}
// 发送验证邮件
const sendVerifyEmail = (user, expires_time, title, content) => {
    createRandomToken
        .then((token) => setRandomToken(token, expires_time, user))
        .then(([token, email]) => {
            mailer(email, title, `${content}${token}`)
                .catch(err => console.error(err));
        });
}
module.exports = { sendVerifyEmail };
