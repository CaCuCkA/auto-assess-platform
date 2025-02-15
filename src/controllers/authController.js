const User = require("../models/User.js")

exports.signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    console.log(fullName, email, password);
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.render("auth/signup", { error: "Email is already in use! Try logging in." });
        }
        const user = await User.create({ fullName, email, password });
        
        req.session.userId = user.admin_id;
        console.log("User logged in:", req.session.userId);

        res.redirect("/");
    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("HELLO!");
    try {
        const user = await User.findByEmail(email);
        if (!user) {    
            return res.render("auth/login", { error: "Incorrect login or password" });
        }

        const isMatch = await User.comparePassword(password, user.hashed_password);
        if (!isMatch) {
            return res.render("auth/login", { error: "Incorrect login or password" });
        }

        req.session.userId = user.admin_id;
        console.log("User logged in:", req.session.userId);

        res.redirect("/"); 
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
};


exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect("login");
    });
};