module.exports = (req, res, next) => {
    console.log(req.path);
    console.log(req.session.userId)
    if (!req.session.userId && !req.path.startsWith("/auth")) {
        return res.redirect("/auth/login");
    }
    next();
};
