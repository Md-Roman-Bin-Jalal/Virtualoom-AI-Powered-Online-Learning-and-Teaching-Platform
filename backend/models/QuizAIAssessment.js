const mongoose = require('mongoose');

const QuizAIAssessmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },    timeLimit: {
        type: Number,
        required: true,
        min: 1,
        get: v => Math.round(v),
        set: v => typeof v === 'string' ? parseInt(v, 10) : v
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
    },
    aiPrompt: {
        type: String,
        required: true
    },
    numberOfQuestions: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    }
});

module.exports = mongoose.model('QuizAIAssessment', QuizAIAssessmentSchema);
