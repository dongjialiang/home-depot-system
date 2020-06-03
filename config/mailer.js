/**
 * 发送邮件的文件
 */
"use strict";
// 引入依赖
const nodemailer = require("nodemailer");
// 引入配置
require('dotenv').config({ path: `${process.cwd()}/config/.env` });

async function mailer(to, subject, html) {
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        // secure: true,
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
module.exports = { mailer };
