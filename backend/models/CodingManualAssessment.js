const mongoose = require('mongoose');

const CodingManualAssessmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    timeLimit: {
        type: Number,
        required: true,
        min: 1
    },
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        problemDescription: {
            type: String,
            required: true
        },
        starterCode: {
            type: String,
            default: ''
        },
        expectedOutput: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['easy', 'moderate', 'hard']
        },
        programmingLanguage: {
            type: String,
            required: true
        },
        points: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    createdBy: {
        type: String,
        required: true
    },
    creatorEmail: {
        type: String,
        required: true
    },
    expiresIn: {
        type: Number,
        default: 7
    },
    expiryUnit: {
        type: String,
        enum: ['hour', 'day', 'week'],
        default: 'day'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CodingManualAssessment', CodingManualAssessmentSchema);
