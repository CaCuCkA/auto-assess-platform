const express = require("express");
const homeworkController = require("../controllers/homeworkController");

const router = express.Router();

router.get("/:id", homeworkController.renderHomeworkPage);

module.exports = router;