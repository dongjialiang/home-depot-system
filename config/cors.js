module.exports = app => {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Content-Length, Accept, Access-Control-Request-Method');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE');
        if (req.method == 'OPTIONS') {
            res.sendStatus(200); // 让options请求快速返回
        } else {
            next();
        }
    });
}
