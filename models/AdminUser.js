/**
 * 管理员模型文件
 */
// 引入依赖
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

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
    const hash = await bcrypt.hash(this.password, 10);
    user.password = hash;
    next();
});
// 密码解密
const comparePassword = async function(candidatePassword) { // 这里也不能使用箭头函数
    const user = this;
    const compare = await bcrypt.compare(candidatePassword, user.password);
    return compare;
};
adminSchema.methods.comparePassword = comparePassword;
const AdminUserModel = mongoose.model('Admin', adminSchema);
module.exports = AdminUserModel;
