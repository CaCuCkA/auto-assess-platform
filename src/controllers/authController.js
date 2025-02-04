const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("Email is already in use! Try logging in.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ fullName, email, password: hashedPassword, role });
        await newUser.save();

        res.render("home");
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found!");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Wrong password!");
        }

        res.render("home"); 
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).send("Internal Server Error");
    }
};
