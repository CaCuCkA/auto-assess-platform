const Homework = require("../models/Homework");
const { getRandomCardColor } = require("../util/colorGenerator")

exports.renderHome = async (req, res) => {
    try {
        console.log(req.session.userId);
        const homeworkData = await Homework.getAllByAdmin(req.session.userId);
        const homeworkWithUrls = homeworkData.map(homework => ({
            ...homework,
            url: `/homework/${homework.homework_id}`
        }));
        console.log(homeworkWithUrls);

        res.render("home", { homeworkWithUrls });
    } catch (error) {
        console.error("Error fetching homework:", error);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
};

exports.checkHomeworkName = async (req, res) => {
    try {
        const { name } = req.params;
        const existingHomework = await Homework.findByTitle(name);
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
        const existingHomework = await Homework.findByTitle(title);
        
        if (existingHomework) {
            return res.status(400).json({ success: false, error: "exists" });
        }

        const newHomework = await Homework.create(title, getRandomCardColor(), adminId);
        res.json({ success: true, message: "Homework added successfully", newHomework });
    } catch (error) {
        console.error("Error adding homework:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.editHomework = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const adminId = req.session.userId;

        const updatedHomework = await Homework.update(title, id, adminId);
        if (updatedHomework) {
            res.json({ success: true });
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

// Render error page
exports.renderError = (req, res) => res.render("error");
