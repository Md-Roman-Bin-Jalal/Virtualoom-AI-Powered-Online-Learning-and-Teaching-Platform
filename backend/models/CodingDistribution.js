const mongoose = require('mongoose');

const codingDistributionSchema = new mongoose.Schema({    codingAssessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        // Using refPath to dynamically determine the referenced model
        refPath: 'assessmentModel',
        required: true
    },
    assessmentModel: {
        type: String,
        enum: ['Quiz', 'CodingAIAssessment', 'CodingManualAssessment'],
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

const CodingDistribution = mongoose.model('CodingDistribution', codingDistributionSchema);

module.exports = CodingDistribution;
