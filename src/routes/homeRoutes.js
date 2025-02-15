const express = require("express");
const homeController = require("../controllers/homeController");

const router = express.Router();

router.get("/404", homeController.renderError);


router.get("/", homeController.renderHome);
router.get("/check-homework-name/:name", homeController.checkHomeworkName);

router.post("/add-homework", homeController.addHomework); 
router.put("/edit-homework/:id", homeController.editHomework);
router.delete("/delete-homework/:id", homeController.deleteHomework);

module.exports = router;
