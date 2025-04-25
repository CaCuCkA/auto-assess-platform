const axios = require('axios');
const Test = require("../models/Test");
const Report = require("../models/Report");
const Homework = require("../models/Homework");
const HomeworkParticipant = require("../models/HomeworkParticipant");

exports.renderHomeworkPage = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.session.userId;

        if (!id || !adminId) {
            console.warn("Missing required parameters: id or adminId");
            return res.status(400).render("error", { message: "Invalid request parameters" });
        }

        req.session.homeworkId = id;

        const homework = await Homework.findById(id, adminId);
        if (!homework) {
            console.warn(`Homework not found for ID: ${id}`);
            return res.status(404).render("error", { message: "Homework not found" });
        }

        const participants = await HomeworkParticipant.getAllParticipants(id) || [];

        const tests = await Test.getAllByHomeworkId(id) || [];
        const testsWithStatus = tests.map(test => ({
            ...test,
            status: test.is_active ? "included" : "excluded"
        }));


        return res.render("homework", { 
            "homework": homework,
            "participants": participants, 
            "tests": testsWithStatus 
        });
    } catch (error) {
        console.error("Error rendering homework page:", error);
        return res.status(500).render("error", { message: "Internal Server Error" });
    }
};

exports.addHomeworkParticipant = async (req, res) => {
    try {
        const { participants } = req.body;
        const { homeworkId } = req.session;

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ error: "Missing or invalid 'participants' field" });
        }

        if (!homeworkId) {
            return res.status(403).json({ error: "Unauthorized or missing homework ID" });
        }

        const newHomeworkParticipants = await HomeworkParticipant.add(participants, homeworkId);

        if (!newHomeworkParticipants || !Array.isArray(newHomeworkParticipants)) {
            return res.status(502).json({ success: false, error: 'Failed to add homework participants' });
        }

        const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
        const addedParticipants = [];

        for (const participant of newHomeworkParticipants) {
            try {
                const externalRes = await axios.post(`${externalApiUrl}/jenkins/add-credential`, null, {
                    params: {
                        id: participant.participant_id,
                        homework_id: homeworkId
                    }
                });

                if (externalRes.status === 200) {
                    addedParticipants.push(participant);
                } else {
                    await HomeworkParticipant.delete(participant.participant_id, homeworkId);
                    console.warn(`External API failed for participant ${participant.participant_id}:`, externalRes.status);
                }
            } catch (externalError) {
                await HomeworkParticipant.delete(participant.participant_id, homeworkId);
                console.error(`External service error for participant ${participant.participant_id}:`, externalError);
            }
        }

        if (addedParticipants.length === 0) {
            return res.status(502).json({ success: false, error: 'All external service calls failed' });
        }

        return res.status(201).json({
            success: true,
            message: "Participants added successfully",
            data: addedParticipants
        });

    } catch (error) {
        console.error("Unexpected error while adding participants:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.editHomeworkParticipant = async (req, res) => {
    try {
        const { fullName, repoUrl, sshKey } = req.body;
        const { id } = req.params;
        const { homeworkId } = req.session;
        const updateValues = [];
        const updatedFields = [];
        const payload = {};
        
        if (fullName) {
            updateValues.push(`full_name = '${fullName.replace("'", "''")}'`);
            updatedFields.push("full name");
            payload.full_name = fullName;
        }
        if (repoUrl) {
            updateValues.push(`repo_url = '${repoUrl.replace("'", "''")}'`);
            updatedFields.push("repository URL");
        }
        if (sshKey) {
            updateValues.push(`ssh_key = '${sshKey.replace("'", "''")}'`);
            updatedFields.push("SSH key");
            payload.ssh_key = sshKey;
        }

        const setClause = updateValues.join(", ");
                
        if (Object.keys(payload).length !== 0) {
            const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
            const externalRes = await axios.post(`${externalApiUrl}/jenkins/update-credential`, 
                payload,
                {
                    params: {
                        id,
                        homework_id: homeworkId
                    }
                }
            );

            if (externalRes.status !== 200) {
                console.warn("External API call failed:", externalRes.status);
                return res.status(502).json({ success: false, error: 'external_service_failed' });
            }
        }

        const updatedHomework = await HomeworkParticipant.update(setClause, id, homeworkId);
        if (updatedHomework) {
            res.json({ success: true , fields: updatedFields});
        } else {
            res.status(404).json({ success: false, error: "not_found" });
        }
    } catch (error) {
        console.error("Error updating homework:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.deleteHomeworkParticipant = async (req, res) => {
    const homeworkId = req.session.homeworkId;
    const { id } = req.params;

    if (!homeworkId) {
        return res.status(400).json({ success: false, error: "Homework ID is missing from session" });
    }

    try {
        const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/delete-credential`, null, {
            params: {
                id,
                homework_id: homeworkId
            }
        });
        
        if (externalRes.status !== 200) {
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

        const participant = await HomeworkParticipant.delete(id, homeworkId);

        if (!participant) {
            return res.status(404).json({ success: false, error: "Participant not found" });
        }

        res.json({ success: true, message: "Participant deleted successfully" });

    } catch (error) {
        console.error("Error deleting homework participant:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};


exports.getParticipantById = async (req, res) => {
    const participantId = req.params.id;
    const homeworkId = req.session.homeworkId;

    const participant = await HomeworkParticipant.findById(participantId, homeworkId);

    if (participant) {
        res.json(participant);
    } else {
        res.status(404).json({ error: "Participant not found" });
    }
};


exports.checkDuplicates = async (req, res) => {
    const { repoUrls, sshKeys } = req.body;
    const homeworkId = req.session.homeworkId;

    try {
        const duplicates = await HomeworkParticipant.checkDuplicates(repoUrls, sshKeys, homeworkId);
        const foundDuplicates = duplicates.map(p => p.full_name);
        res.json({ duplicates: foundDuplicates });
    } catch (error) {
        console.error("Error checking duplicates:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};


exports.getParticipantReports = async (req, res) => {
    const participantId = req.params.id;
    req.session.participantId = participantId;

    const reportData = await Report.getAllByParticipant(participantId);

    const reportWithUrls = reportData.map(report => ({
            ...report,
            url: `/report/report-editor/${report.report_id}`,
            "status": report.is_submited ? "submitted" :
            report.is_rejected ? "rejected" :
            report.updated_at !== report.created_at ? "reviewed" :
            "unreviewed"
    }));

    res.render('report', { reports: reportWithUrls });
}