const Homework = require("../models/Homework");

exports.renderHomeworkPage = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.session.userId;

        const homework = await Homework.findById(id, adminId);
        if (!homework) {
            console.log(homework);
            return res.status(404).json({ success: false, message: "Homework not found" });
        }
        res.render("homework", { homework });
    } catch (error) {
        console.error("Error rendering homework page:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
