// 引入依赖
const profileRoute = (req, res) => {
    return res.json({
        message: 'You made it to the secure route.',
        user: req.user,
    });
};

module.exports = profileRoute;
