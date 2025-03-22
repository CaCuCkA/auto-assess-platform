const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();


router.post("/add", reportController.addReport); 
router.get("/check-title/:title", reportController.checkReportTitle);
router.put("/edit/:id", reportController.editReport);
router.delete("/delete/:id", reportController.deleteReport);

router.get("/report-editor/:id", reportController.renderReportEditorPage);
router.put("/report-editor/save/:id", reportController.saveMardownEditorChanges);
router.put("/report-editor/submit/:id", reportController.submitReport);

module.exports = router;
