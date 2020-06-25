/**
 * 上传图片的文件
 */
// 引入依赖
// const fs = require('fs');
const fs = require('fs-extra');
// 上传用户头像
const uploadAvatar = (req, res) => {
    let file = req.file;
    fs.renameSync(`./uploads/${file.filename}`, `./uploads/${file.filename}-${file.originalname}`);
    res.json(`${file.filename}-${file.originalname} upload Successful`);
};
// 上传单个图片
const uploadImage = (req, res) => {
    let file = req.file;
    fs.renameSync(`./uploads/${file.filename}`, `./uploads/${file.filename}-${file.originalname}`);
    res.json({
        path: `/images/${file.filename}-${file.originalname}`,
        message: `${file.filename}-${file.originalname} upload Successful`
    });
};
// 上传多个图片
const uploadImages = (req, res) => {
    let files = req.file;
    const fileInfos = [];
    for (const file of files) {
        let fileInfo = {}
        fileInfo.originalname = file.originalname;
        fs.renameSync(`./uploads/${file.filename}`, `./uploads/${file.filename}-${file.originalname}`);
        fileInfos.push(fileInfo);
    }
    res.json({
        path: `/images`,
        message: `${fileInfos.reduce((acc, v) => acc + v.originalname, '')} upload Successful`
    });
};
// 删除图片
const removeImage = (req, res) => {
    const image = req.params.image;
    fs.unlink(`./uploads/${image}`, () => {
        res.json({ message: 'The image is remove successful!' });
    });
}
// 导出依赖
module.exports = { uploadAvatar, uploadImage, uploadImages, removeImage }
