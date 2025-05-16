const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswers: [{
        type: Number,
        required: true
    }],
    points: {
        type: Number,
        default: 10
    },
    // Add fields for evaluation instructions for coding/writing assessments
    evaluationInstructions: {
        type: String,
        default: ''
    }
});

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    timeLimit: {
        type: Number,  // Time limit in minutes
        required: true
    },
    questions: [questionSchema],
    createdBy: {
        type: String,
        required: true
    },
    creatorEmail: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresIn: {
        type: Number,
        default: 0  // 0 means no expiry
    },
    expiryUnit: {
        type: String,
        enum: ['min', 'hour', 'day'],
        default: 'day'
    },
    // Add field for assessment type
    assessmentType: {
        type: String,
        enum: ['quiz', 'coding', 'writing'],
        default: 'quiz'
    },
    // Flag to indicate if AI-generated
    isAIGenerated: {
        type: Boolean,
        default: false
    }
});

// Virtual property to check if quiz is expired
quizSchema.virtual('isExpired').get(function() {
    if (this.expiresIn === 0) return false; // No expiry set
    
    const createdDate = new Date(this.createdAt);
    const now = new Date();
    
    let expiryMs = 0;
    
    switch(this.expiryUnit) {
        case 'min':
            expiryMs = this.expiresIn * 60 * 1000;
            break;
        case 'hour':
            expiryMs = this.expiresIn * 60 * 60 * 1000;
            break;
        case 'day':
            expiryMs = this.expiresIn * 24 * 60 * 60 * 1000;
            break;
        default:
            expiryMs = 0;
    }
    
    return expiryMs > 0 && (now.getTime() - createdDate.getTime()) > expiryMs;
});

// Enable virtuals when converting to JSON
quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;