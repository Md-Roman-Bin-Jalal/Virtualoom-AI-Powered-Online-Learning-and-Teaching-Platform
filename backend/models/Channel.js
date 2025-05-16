const mongoose = require('mongoose');

// Define message schema to reuse in both channel and subchannel
const messageSchema = new mongoose.Schema({
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    senderName: String,
    senderRole: String,
    content: { 
        type: String, 
        maxlength: 69 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

// Define member schema to reuse in both channel and subchannel
const memberSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    role: { 
        type: String, 
        enum: ['creator', 'admin', 'moderator', 'newbie'],
        default: 'newbie'
    }
});

// Define subchannel schema
const subchannelSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        maxlength: 69 
    },
    description: { 
        type: String, 
        required: true, 
        maxlength: 69 
    },
    creator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    members: [memberSchema],
    messages: [messageSchema],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const channelSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        maxlength: 69 
    },
    description: { 
        type: String, 
        required: true, 
        maxlength: 69 
    },
    creator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    members: [memberSchema],
    messages: [messageSchema],
    subchannels: [subchannelSchema],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Add a compound index to ensure a user can only be added once to a channel
channelSchema.index({ 'members.user': 1 }, { unique: false });

// Add a helper method to remove duplicate users from the members array
channelSchema.methods.removeDuplicateMembers = function() {
    // Create a map to store unique members by user ID
    const uniqueMembers = new Map();
    
    // Go through all members and keep only the first occurrence of each user
    this.members.forEach(member => {
        if (member.user) {
            const userId = member.user.toString();
            if (!uniqueMembers.has(userId)) {
                uniqueMembers.set(userId, member);
            }
        }
    });
    
    // Replace the members array with the unique members
    this.members = Array.from(uniqueMembers.values());
    
    return this;
};

// Add middleware to automatically ensure member uniqueness before saving
channelSchema.pre('save', function(next) {
    // Remove duplicate members
    this.removeDuplicateMembers();
    
    // Also clean up subchannel members
    if (this.subchannels && this.subchannels.length > 0) {
        this.subchannels.forEach(subchannel => {
            // Create a map to store unique subchannel members by user ID
            const uniqueSubchannelMembers = new Map();
            
            // Go through all subchannel members and keep only the first occurrence of each user
            subchannel.members.forEach(member => {
                if (member.user) {
                    const userId = member.user.toString();
                    if (!uniqueSubchannelMembers.has(userId)) {
                        uniqueSubchannelMembers.set(userId, member);
                    }
                }
            });
            
            // Replace the subchannel members array with the unique members
            subchannel.members = Array.from(uniqueSubchannelMembers.values());
        });
    }
    
    next();
});

// Add middleware for updateOne and findOneAndUpdate operations
channelSchema.pre(['updateOne', 'findOneAndUpdate'], async function(next) {
    // Get the update operations
    const update = this.getUpdate();
    
    // If we're pushing to the members array, we need to pull the document and clean duplicates
    if (update.$push && update.$push.members) {
        try {
            // Get the channel document
            const docToUpdate = await this.model.findOne(this.getQuery());
            
            if (docToUpdate) {
                // Add the new member
                docToUpdate.members.push(update.$push.members);
                
                // Remove duplicates
                docToUpdate.removeDuplicateMembers();
                
                // Update the operation to set the entire members array
                delete update.$push;
                update.$set = { members: docToUpdate.members };
            }
        } catch (error) {
            console.error('Error in pre-update middleware:', error);
        }
    }
    
    next();
});

module.exports = mongoose.model('Channel', channelSchema);