const mongoose = require('mongoose');

const QuizManualAssessmentSchema = new mongoose.Schema({
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
        options: [{
            type: String,
            required: true
        }],
        correctOptions: [{
            type: Number,
            required: true
        }],
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
    },
    category: {
        type: String,
        default: 'General'
    },
    difficulty: {
        type: String,
        enum: ['easy', 'moderate', 'hard'],
        default: 'moderate'
    }
});

module.exports = mongoose.model('QuizManualAssessment', QuizManualAssessmentSchema);
