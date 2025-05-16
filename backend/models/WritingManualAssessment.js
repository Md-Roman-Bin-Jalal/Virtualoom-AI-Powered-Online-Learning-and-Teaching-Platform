const mongoose = require('mongoose');

const WritingManualAssessmentSchema = new mongoose.Schema({
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
        prompt: {
            type: String,
            required: true
        },
        instructions: String,
        wordLimit: {
            type: Number,
            required: true,
            min: 50
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['easy', 'moderate', 'hard']
        },
        writingType: {
            type: String,
            required: true,
            enum: ['essay', 'short-answer', 'technical-document', 'creative-writing', 'analysis', 'research-paper']
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

module.exports = mongoose.model('WritingManualAssessment', WritingManualAssessmentSchema);
