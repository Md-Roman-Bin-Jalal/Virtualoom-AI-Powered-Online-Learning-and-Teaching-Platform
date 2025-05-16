const mongoose = require('mongoose');

const quizDistributionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    subchannelId: {
        type: String,
        default: null
    },
    sentBy: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
});

const QuizDistribution = mongoose.model('QuizDistribution', quizDistributionSchema);

module.exports = QuizDistribution;