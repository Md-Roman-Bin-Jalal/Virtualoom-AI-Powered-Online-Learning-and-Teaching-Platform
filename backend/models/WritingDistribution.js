const mongoose = require('mongoose');

const writingDistributionSchema = new mongoose.Schema({    writingAssessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        // Using refPath to dynamically determine the referenced model
        refPath: 'assessmentModel',
        required: true
    },
    assessmentModel: {
        type: String,
        enum: ['Quiz', 'WritingAIAssessment', 'WritingManualAssessment'],
        default: 'Quiz'
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

const WritingDistribution = mongoose.model('WritingDistribution', writingDistributionSchema);

module.exports = WritingDistribution;
