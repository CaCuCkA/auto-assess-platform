const express = require("express");
const homeworkController = require("../controllers/homeworkController");

const router = express.Router();

router.get("/:id", homeworkController.renderHomeworkPage);
router.post("/check-duplicates", homeworkController.checkDuplicates);
router.get("/participants/:id", homeworkController.getParticipantById);
router.post("/add-participant", homeworkController.addHomeworkParticipant); 
router.post("/edit-participant/:id", homeworkController.editHomeworkParticipant);
router.delete("/delete-participant/:id", homeworkController.deleteHomeworkParticipant);

module.exports = router;