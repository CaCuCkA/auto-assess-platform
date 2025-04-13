const axios = require('axios');
const Report = require("../models/Report");

 
exports.addReport = async (req, res) => {
    try {
        const { title } = req.body;
        const participantId = req.session.participantId;

        let newReport = await Report.create(title, participantId);
        newReport["status"] = "unreviewed";
        newReport["url"] = `/report/report-editor/${newReport.report_id}`
        res.render("report", {reports: [newReport]});
    } catch (error) {
        console.error("Error adding report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
    return null;
};

exports.checkReportTitle = async (req, res) => {
    try {
        const title = req.params.title;
        const participantId = req.session.participantId;

        const existingHomework = await Report.findByTitle(title, participantId);
        res.json({ exists: !!existingHomework });
    } catch (error) {
        console.error("Error checking report title:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.editReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const participantId = req.session.participantId;

        const updatedReport = await Report.update({
            reportId: id,
            participantId: participantId,
            title: title
        });

        if (updatedReport) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: "not_found" });
        }
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const participantId = req.session.participantId;
        const deletedReport = await Report.delete(id, participantId);
        
        if (deletedReport) {
            res.json({ success: true, message: "Report deleted successfully" });
        } else {
            res.status(404).json({ success: false, error: "not_found" });
        }
    } catch (error) {
        console.error("Error deleting report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.renderReportEditorPage = async (req, res) => {
    const participantId = req.query.id ? req.query.id : req.session.participantId;
    const { id } = req.params;
    const isHomePage = req.query.is_home_page;
    req.session.participantId = participantId;
    const report = await Report.findById(id, participantId);
    res.render("report-editor", { 
            "content" : report.content,
            "id": report.report_id,
            "title": report.title,
            "homework-id": isHomePage !== "true" ? req.session.homeworkId : null
         });
};

exports.saveMardownEditorChanges = async (req, res) => {
    try {
        const participantId = req.session.participantId;
        const { id } = req.params;
        const { content } = req.body;

        const updatedReport = await Report.update({
            reportId: id,
            participantId: participantId,
            content: content
        });

        if (updatedReport) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: "not_found" });
        }
    }
    catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }    
}

exports.submitReport = async (req, res) => {
    try {
        const participantId = req.session.participantId;
        const { id } = req.params;
        const { content } = req.body;

        if (!participantId) {
            return res.status(401).json({ success: false, error: 'unauthorized' });
        }

        const updatedRowsContent = await Report.update({
            reportId: id,
            participantId,
            content
        });

        if (updatedRowsContent === 0) {
            return res.status(404).json({ success: false, error: 'report_not_found' });
        }

        const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/github/submit-report`, null, {
            params: {
                id,
                participant_id: participantId
            }
        });

        if (externalRes.status !== 200) {
            console.warn("External API failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

        const updatedRowsSubmit = await Report.update({
            reportId: id,
            participantId,
            is_submited: true, 
        });

        if (updatedRowsSubmit === 0) {
            return res.status(404).json({ success: false, error: 'submit_failed' });
        }

        return res.json({ success: true });

    } catch (error) {
        console.error("Error in submitReport:", error.message || error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
