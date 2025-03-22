const express = require("express");
const testController = require("../controllers/testController");

const router = express.Router();

router.get("/:id", testController.getTest);
router.post("/add", testController.addTest); 
router.put("/edit/:id", testController.editTest);
router.put("/status/:id", testController.changeStatus);
router.delete("/delete/:id", testController.deleteTest);
router.get("/check-name/:name", testController.checkTestName);

module.exports = router;