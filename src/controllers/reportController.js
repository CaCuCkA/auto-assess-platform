const Report = require("../models/Report");


// exports.getReportById = async (req, res) => {
//     return null;
// };

exports.addReport = async (req, res) => {
    try {
        const { title } = req.body;
        const participantId = req.session.participantId;

        const newReport = await Report.create(title, participantId);
        res.render('report', {reports: [newReport]});
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

        const updatedReport = await Report.update(title, id, participantId);
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
        const participantId = req.session.participantId;
        const { id } = req.params

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
    const participantId = req.session.participantId;
    const { id } = req.params

    const report = await Report.findById(id, participantId);

    res.render('report-editor', { "report-content" : report.content });
};
