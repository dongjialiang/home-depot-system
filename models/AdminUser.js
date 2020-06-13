/**
 * 管理员模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const argon2 = require('argon2');
const Schema = mongoose.Schema;
// 编写规则
const adminSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    manager: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    collection: 'admin',
});
// 密码加密
adminSchema.pre('save', async function(next) { // mongoose使用getter/setter访问文档，此功能不适用于箭头函数
    const user = this;
    if (!user.isModified('password')) { return next(); }
    const hash = await argon2.hash(this.password, { type: argon2.argon2id });
    user.password = hash;
    next();
});
// 密码解密
const comparePassword = async function(candidatePassword) { // 这里也不能使用箭头函数
    const user = this;
    const compare = await argon2.verify(user.password, candidatePassword);
    return compare;
};
// 把解密函数挂载到方法里
adminSchema.methods.comparePassword = comparePassword;
// 构筑模型
const AdminUserModel = mongoose.model('Admin', adminSchema);
// 导出模型
module.exports = AdminUserModel;
