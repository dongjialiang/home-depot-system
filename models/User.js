
// 引入依赖
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isEmailActivated: {
        type: Boolean,
        default: false,
    },
    emailToken: String,
    emailExpires: Date,
}, {
    timestamps: true,
    collection: 'user',
});
// 密码加密
userSchema.pre('save', async function(next) {
    /*
     *  这里不能使用箭头函数,详情请看
     *  https://stackoverflow.com/questions/45015613/error-data-and-salt-arguments-required/45015918
     */
    const user = this;
    if (!user.isModified('password')) { return next(); }
    const hash = await bcrypt.hash(this.password, 10);
    user.password = hash;
    next();
});
// 密码解密
const comparePassword = async function(candidatePassword) {
    /*
     *  这里也不能使用箭头函数
     */
    const user = this;
    const compare = await bcrypt.compare(candidatePassword, user.password);
    return compare;
};
userSchema.methods.comparePassword = comparePassword;
const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;
