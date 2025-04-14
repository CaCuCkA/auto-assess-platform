const axios = require('axios');
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
        
        if (!newTest) {
            return res.status(500).json({ success: false, error: "Internal Server Error" });
        }

        const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/add-test`, null, {
            params: {
                id: newTest.test_id,
                homework_id: homeworkId
            }
        });
        
        if (externalRes.status !== 200) {
            await Test.delete(newTest.test_id, homeworkId);
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

        res.status(201).json({ success: true , test_id: newTest.test_id});

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

        const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/update-test`, { new_name: name }, {
            params: {
                id: testId,
                homework_id: homeworkId
            }
        });

        if (externalRes.status !== 200) {
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

        const test = await Test.update({
            "testId": testId,
            "homeworkId": homeworkId,
            "name": name
        });
        
        if (!test) {
            return res.status(500).json({ success: false, error: "Internal Server Error" });
        } 
        
        res.status(201).json({ success: true });
    
    } catch (error) {
        console.error("Error edit test:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteTest = async (req, res) => {
    try {
        const testId = req.params.id;
        const homeworkId = req.session.homeworkId;

        const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/delete-test`, null, {
            params: {
                id: testId,
                homework_id: homeworkId
            }
        });

        if (externalRes.status !== 200) {
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }

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

        if (!test) {
            return res.status(500).json({ success: false, error: "Internal Server Error" });
        } 

        const externalApiUrl = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
        const externalRes = await axios.post(`${externalApiUrl}/jenkins/update-test`, null, {
            params: {
                id: testId,
                homework_id: homeworkId
            }
        });

        if (externalRes.status !== 200) {
            console.warn("External API call failed:", externalRes.status);
            return res.status(502).json({ success: false, error: 'external_service_failed' });
        }
        
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Error edit test:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
