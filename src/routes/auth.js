const express = require("express");
const { signup, login } = require("../controllers/authController");

const router = express.Router();

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const homeworkData = [
    { id: 1, title: "4th year database grouasdkjgnjakdsbhjadsbhjfdasvkgvdasfgvdasfkgvdshdsavflhjkadsbjadsn;jfdas;jkadsbkhjafdsbhkadsbhjadfslblhjdasbdhlfaskbp PKN-21B 2025 sememtr2", link: "https://example.com/1", backgroundColor: getRandomColor() },
    { id: 2, title: "Introduction to JavaScript 2025", link: "https://example.com/2", backgroundColor: getRandomColor() },
    { id: 3, title: "Advanced Node.js 2025", link: "https://example.com/3", backgroundColor: getRandomColor() },
];

router.get("/check-group-name/:name", (req, res) => {
    const { name } = req.params;
    const groupExists = homeworkData.some(group => group.title === name);

    res.json({ exists: groupExists });
});

router.get("/", (req, res) => res.render("home", { homeworkData }));
router.get("/404", (req, res) => res.render("error"));

router.post("/add-homework", (req, res) => {
  const { title, link } = req.body;

  const existingHomework = homeworkData.find(hw => hw.title === title);
  if (existingHomework) {
      return res.status(400).json({ success: false, error: "exists" });
  }

  const newHomework = {
      id: homeworkData.length + 1,
      title,
      link,
      backgroundColor: getRandomColor()
  };

  homeworkData.push(newHomework);

  res.json({ success: true, message: "Homework added successfully", newHomework });
});

router.put("/edit-homework/:id", (req, res) => {
  const { id } = req.params;
  const { title, link } = req.body;

  const groupIndex = homeworkData.findIndex(group => group.id === parseInt(id));
  if (groupIndex !== -1) {
    homeworkData[groupIndex] = { ...homeworkData[groupIndex], title, link };
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'not_found' });
  }
});

router.delete("/delete-homework/:id", (req, res) => {
  const { id } = req.params;

  const groupIndex = homeworkData.findIndex(group => group.id === parseInt(id));
  if (groupIndex !== -1) {
    homeworkData.splice(groupIndex, 1);
    res.json({ success: true, message: "Homework deleted successfully" });
  } else {
    res.json({ success: false, error: 'not_found' });
  }
});

router.get("/signup", (req, res) => {
    res.render("auth/signup");
});

router.get("/login", (req, res) => {
  res.render("auth/login");
});

router.get("/forgot-password", (req, res) => res.render("auth/forgot-password"));
router.get("/reset-password", (req, res) => res.render("auth/reset-password"));

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;
