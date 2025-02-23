module.exports = (req, res, next) => {
    if (!req.session.userId && !req.path.startsWith("/auth")) {
        return res.redirect("/auth/login");
    }
    next();
};
