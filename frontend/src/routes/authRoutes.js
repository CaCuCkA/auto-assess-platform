const express = require("express");
const { signup, login, logout } = require("../controllers/authController");

const router = express.Router();

router.get("/signup", (req, res) => res.render("auth/signup"));
router.get("/login", (req, res) => res.render("auth/login"));
router.get("/logout", logout);
router.get("/forgot-password", (req, res) => res.render("auth/forgot-password"));
router.get("/reset-password", (req, res) => res.render("auth/reset-password"));

router.post("/signup-form", signup);
router.post("/login-form", login);

module.exports = router;
