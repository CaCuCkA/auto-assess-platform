const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/your_database_name")
.then(() => {
    console.log("MongoDB connected successfully");
})
.catch((error) => {
    console.error("MongoDB connection failed:", error);
});

module.exports = mongoose;
