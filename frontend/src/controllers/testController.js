const Test = require("../models/Test");


exports.getTest = async (req, res) => {
    try {
        const testId = req.params.id;
        const homeworkId = req.session.homeworkId;

        const test = await Test.getById(testId, homeworkId);

        if (test) {
            console.log(test);
            res.status(201).json({ success: true , test: test});
        } else {
            console.error("Error adding test:", error);
            res.status(500).json({ error: "Internal Server Error" });            
        }
    } catch (error) {
        console.error("Error get test:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

exports.addTest = async (req, res) => {
    try {
        const { name, fileContent } = req.body;
        const homeworkId = req.session.homeworkId;

        const newTest = await Test.create(name, fileContent, homeworkId);
        console.log("test_id: ", newTest.test_id);
        if (newTest) {
            res.status(201).json({ success: true , test_id: newTest.test_id});
        } else {
            console.error("Error adding test:", error);
            res.status(500).json({ error: "Internal Server Error" });            
        }

    } catch (error) {
        console.error("Error adding test:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.editTest = async (req, res) => {
    try {
        const testId = req.params.id;
        const name = req.body.name;
        const homeworkId = req.session.homeworkId;
        const test = await Test.update({
            "testId": testId,
            "homeworkId": homeworkId,
            "name": name
        });

        if (test) {
            res.status(201).json({ success: true });
        } else {
            console.error("Error edit test:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    } catch (error) {
        console.error("Error edit test:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteTest = async (req, res) => {
    try {
        const testId = req.params.id;
        const homeworkId = req.session.homeworkId;

        const deleteTest = await Test.delete(testId, homeworkId);
        if (deleteTest) {
            res.json({ success: true, message: "Test deleted successfully" });
        } else {
            res.status(404).json({ success: false, error: "not_found" });
        }
    } catch (error) {
        console.error("Error deleting test:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

exports.checkTestName = async (req, res) => {
    try {
        const name = req.params.name;
        const homeworkId = req.session.homeworkId;

        const existingHomework = await Test.findByName(name, homeworkId);
        res.json({ exists: !!existingHomework });
    } catch (error) {
        console.error("Error checking test name:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.changeStatus = async (req, res) => {
    try {
        const testId = req.params.id;
        const homeworkId = req.session.homeworkId;
        
        const test = await Test.updateStatus(false, testId, homeworkId);

        if (test) {
            res.status(201).json({ success: true });
        } else {
            console.error("Error edit test:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    } catch (error) {
        console.error("Error edit test:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
