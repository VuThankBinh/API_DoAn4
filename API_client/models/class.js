const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    class_id: { type: String, required: true, unique: true },
    teacher: { type: String, required: true },
    users: [{ type: String }]
});

module.exports = mongoose.model('Class', classSchema);