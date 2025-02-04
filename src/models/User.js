const mongoose = require("../config/database"); // Import mongoose from database.js

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ['student', 'teacher'],
        required: true,
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
