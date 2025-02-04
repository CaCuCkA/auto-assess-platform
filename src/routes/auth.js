const express = require("express");
const { signup, login } = require("../controllers/authController");

const router = express.Router();

router.get("/", (req, res) => res.render("auth/login"));
router.get("/signup", (req, res) => {
    const roles = [
        { value: 'student', name: 'Student' },
        { value: 'teacher', name: 'Teacher' }
    ];
    res.render("auth/signup", { roles });
});
router.get("/forgot-password", (req, res) => res.render("auth/forgot-password"));
router.get("/reset-password", (req, res) => res.render("auth/reset-password"));

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;