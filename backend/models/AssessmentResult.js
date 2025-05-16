const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    points: {
        type: Number,
        default: 0
    },
    feedback: {
        type: String,
        default: ''
    },
    improvementSuggestions: {
        type: String,
        default: ''
    }
});

const assessmentResultSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    maxPossibleScore: {
        type: Number,
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        selectedOptions: [Number],
        // For coding and writing assessments
        writtenAnswer: {
            type: String,
            default: ''
        }
    }],
    completedAt: {
        type: Date,
        default: Date.now
    },
    timeTaken: {
        type: Number, // Time taken in seconds
        default: 0
    },
    // Adding fields for AI evaluation feedback
    feedback: [feedbackSchema],
    overallFeedback: {
        type: String,
        default: ''
    },
    // Adding assessment type field for consistency
    assessmentType: {
        type: String,
        enum: ['quiz', 'coding', 'writing'],
        default: 'quiz'
    }
});

const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);

module.exports = AssessmentResult;