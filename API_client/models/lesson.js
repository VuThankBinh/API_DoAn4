const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    condition: { type: String },
    theory: { type: String }
});

module.exports = mongoose.model('Lesson', lessonSchema);