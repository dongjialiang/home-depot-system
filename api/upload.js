/**
 * 上传图片的文件
 */
// 引入依赖
const fs = require('fs');
const uploadAvatar = (req, res, next) => {
    let file = req.file;
    fs.renameSync(`./uploads/${file.filename}`, `./uploads/${file.originalname}`);
    res.json(`${file.originalname} upload Successful`);
};
const uploadImages = (req, res, next) => {
    let files = req.files;
    const fileInfos = [];
    for (const file of files) {
        let fileInfo = {}
        fileInfo.originalname = file.originalname;
        fs.renameSync(`./uploads/${file.filename}`, `./uploads/${file.originalname}`);
        fileInfos.push(fileInfo);
    }
    res.json({
        path: 'http://localhost:7326/images',
        message: `${fileInfos.reduce((acc, v) => acc + v.originalname, '')} upload Successful`
    });
};
module.exports = { uploadAvatar, uploadImages }
