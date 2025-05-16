const mongoose = require('mongoose');

// Define comment schema
const commentSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    replies: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        userRole: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const channelFileSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    fileUrl: { 
        type: String, 
        required: true 
    },
    fileType: { 
        type: String, 
        required: true 
    },
    uploader: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    uploaderName: { 
        type: String 
    },
    uploaderRole: { 
        type: String 
    },
    channel: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel',
        required: true 
    },
    subchannel: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel.subchannels' 
    },
    bookmarkedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [commentSchema],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const ChannelFile = mongoose.model('ChannelFile', channelFileSchema);

module.exports = ChannelFile;