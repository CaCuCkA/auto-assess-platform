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

        const participants = await HomeworkParticipant.getAllParticipants(homework.homework_id) || [];

        return res.render("homework", { homework, participants });
    } catch (error) {
        console.error("Error rendering homework page:", error);
        return res.status(500).render("error", { message: "Internal Server Error" });
    }
};

exports.addHomeworkParticipant = async (req, res) => {
    try {
        const { participants } = req.body;
        const { homeworkId } = req.session;
                
        if (!participants) return res.status(400).json({ error: "Missing required field" });
        if (!homeworkId) return res.status(403).json({ error: "Unauthorized or missing homework ID" });

        const newHomeworkParticipant = await HomeworkParticipant.add(participants, homeworkId);

        return res.status(201).json({
            success: true,
            message: "Homework participant added successfully",
            data: newHomeworkParticipant
        });
    } catch (error) {
        console.error("Error adding homework participant:", error);
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
        
        if (fullName) {
            updateValues.push(`full_name = '${fullName.replace("'", "''")}'`);
            updatedFields.push("full name");
        }
        if (repoUrl) {
            updateValues.push(`repo_url = '${repoUrl.replace("'", "''")}'`);
            updatedFields.push("repository URL");
        }
        if (sshKey) {
            updateValues.push(`ssh_key = '${sshKey.replace("'", "''")}'`);
            updatedFields.push("SSH key");
        }

        const setClause = updateValues.join(", ");

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
