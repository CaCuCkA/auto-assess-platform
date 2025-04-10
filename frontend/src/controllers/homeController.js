const axios = require('axios');
const Report = require("../models/Report");
const Homework = require("../models/Homework");
const { getRandomCardColor } = require("../util/colorGenerator")

exports.renderHome = async (req, res) => {
    try {
        const reportData = await Report.getUnreviewed();
        const homeworkData = await Homework.getAllByAdmin(req.session.userId);
        const homeworkWithUrls = homeworkData.map(homework => ({
            ...homework,
            url: `/homework/${homework.homework_id}`
        }));

        const reportWithUrls = reportData.map(report => ({
                ...report,
                url: `/report/report-editor/${report.report_id}?id=${report.participant_id}&is_home_page=true`,
                "status": report.is_submited ? "submitted" :
                          report.updated_at !== report.created_at ? "reviewed" :
                          "unreviewed"
        }));
        res.render("home", { homeworkWithUrls, reports: reportWithUrls});
    } catch (error) {
        console.error("Error fetching homework:", error);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
};

exports.checkHomeworkName = async (req, res) => {
    try {
        const { name } = req.params;
        const adminId = req.session.userId;
        const existingHomework = await Homework.findByTitle(name, adminId);
        res.json({ exists: !!existingHomework });
    } catch (error) {
        console.error("Error checking homework title:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.addHomework = async (req, res) => {
    try {
        const { title } = req.body;
        const adminId = req.session.userId;
        console.log("adminId=", adminId);
        const newHomework = await Homework.create(title.trim(), getRandomCardColor(), adminId);

        if (!newHomework || !newHomework.homework_id) {
            return res.status(502).json({ success: false, error: 'Failed to add homework' });
        }

        const externalApiUrl = `http://${process.env.BACKEND_IP}:${process.env.BACKEND_PORT}`;
        
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/add-job`, null, {
            params: {
                id: newHomework.homework_id,
                admin_id: adminId
            }
        });

        if (externalRes.status !== 200) {
            await Homework.delete(newHomework.homework_id, adminId);
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

        return res.json({
            success: true,
            message: 'Homework added successfully',
            newHomework
        });

    } catch (error) {
        console.error("Error in addHomework:", error.message || error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.editHomework = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const adminId = req.session.userId;

        const externalApiUrl = `http://${process.env.BACKEND_IP}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/update-job`, null, {
            params: {
                id,
                admin_id: adminId
            },
            body : {
                new_name: title
            }
        });

        if (externalRes.status !== 200) {
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

        const updatedHomework = await Homework.update(title, id, adminId);
        if (updatedHomework) {
            res.json({ success: true, message: "Homework updated successfully" });
        } else {
            res.status(404).json({ success: false, error: "not_found" });
        }
    } catch (error) {
        console.error("Error updating homework:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteHomework = async (req, res) => {
    try {
        const adminId = req.session.userId;
        const { id } = req.params

        const externalApiUrl = `http://${process.env.BACKEND_IP}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/delete-job`, null, {
            params: {
                id,
                admin_id: adminId
            }
        });

        if (externalRes.status !== 200) {
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

        const deletedHomework = await Homework.delete(id, adminId);

        if (deletedHomework) {
            res.json({ success: true, message: "Homework deleted successfully" });
        } else {
            res.status(404).json({ success: false, error: "not_found" });
        }
    } catch (error) {
        console.error("Error deleting homework:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.renderError = (req, res) => res.render("error");
