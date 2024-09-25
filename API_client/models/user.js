const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    accountType: { type: String, required: true },
    password: { type: String },
    name: { type: String, default: '' },
    tel: { type: String, default: '' },
    joinedClasses: [{ type: String }],
    createdClasses: [{ type: String }],
    lessonsCompleted: [{ type: String }]
});

module.exports = mongoose.model('User', userSchema);