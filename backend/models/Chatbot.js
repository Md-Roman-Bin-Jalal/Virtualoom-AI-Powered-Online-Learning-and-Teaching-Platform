const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    subchannelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel.subchannels',
        required: false
    },
    userMessage: {
        type: String,
        required: true
    },
    botResponse: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chatbot', chatbotSchema);
