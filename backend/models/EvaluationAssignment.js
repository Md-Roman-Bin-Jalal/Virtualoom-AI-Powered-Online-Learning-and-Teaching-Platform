const mongoose = require('mongoose');

const evaluationAssignmentSchema = new mongoose.Schema({
    // User this evaluation is assigned to
    userEmail: {
        type: String,
        required: true
    },
    
    // Assessment reference with dynamic model type
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'assessmentType',
        required: true
    },
    
    // The model type (Quiz, CodingAIAssessment, etc.)
    assessmentType: {
        type: String,
        enum: [
            'Quiz', 
            'QuizAIAssessment', 
            'QuizManualAssessment',
            'CodingAIAssessment', 
            'CodingManualAssessment', 
            'WritingAIAssessment', 
            'WritingManualAssessment'
        ],
        required: true
    },
    
    // Assessment category
    category: {
        type: String,
        enum: ['quiz', 'coding', 'writing'],
        required: true
    },
    
    // Channel and subchannel this came from
    channelId: {
        type: String,
        required: true
    },
    
    subchannelId: {
        type: String,
        default: null
    },
    
    // Who sent the assignment
    assignedBy: {
        type: String,
        required: true
    },
    
    // When was it assigned
    assignedAt: {
        type: Date,
        default: Date.now
    },
    
    // Status of assignment
    status: {
        type: String,
        enum: ['pending', 'started', 'completed', 'overdue'],
        default: 'pending'
    },
    
    // User can hide this assignment after completion
    hidden: {
        type: Boolean,
        default: false
    },
    
    // When user started the assessment
    startedAt: {
        type: Date,
        default: null
    },
    
    // When user completed the assessment
    completedAt: {
        type: Date,
        default: null
    },
    
    // Reference to the result document if completed
    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssessmentResult',
        default: null
    },
    
    // For tracking submissions and progression
    attempts: {
        type: Number,
        default: 0
    },
    
    // Time taken in seconds
    timeTaken: {
        type: Number,
        default: 0
    }
});

// Create indexes for faster queries
evaluationAssignmentSchema.index({ userEmail: 1, category: 1 });
evaluationAssignmentSchema.index({ channelId: 1 });
evaluationAssignmentSchema.index({ status: 1 });

// Static method to bulk create assignments for all users in a channel
evaluationAssignmentSchema.statics.createForChannelMembers = async function(
    assessmentId, 
    assessmentType, 
    category, 
    channelId,
    subchannelId,
    assignedBy
) {
    try {
        const Channel = mongoose.model('Channel');
        const User = mongoose.model('User');
        
        // Find the channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }
        
        // Get users to assign to (either subchannel or main channel)
        let userIds = [];
        
        if (subchannelId) {
            // Find the specific subchannel
            const subchannel = channel.subchannels.find(
                sub => sub._id.toString() === subchannelId
            );
            
            if (!subchannel) {
                throw new Error('Subchannel not found');
            }
            
            // Get user IDs from subchannel members
            userIds = subchannel.members.map(member => member.user);
        } else {
            // Get user IDs from main channel members
            userIds = channel.members.map(member => member.user);
        }
        
        // Get user emails for all members
        const users = await User.find({
            _id: { $in: userIds }
        }, 'email');
        
        // Create assignment records for all users
        const assignments = users.map(user => ({
            userEmail: user.email,
            assessmentId,
            assessmentType,
            category,
            channelId,
            subchannelId: subchannelId || null,
            assignedBy,
            status: 'pending'
        }));
        
        // Insert all assignments at once
        if (assignments.length > 0) {
            return await this.insertMany(assignments);
        }
        
        return [];
    } catch (error) {
        console.error('Error creating evaluation assignments:', error);
        throw error;
    }
};

const EvaluationAssignment = mongoose.model('EvaluationAssignment', evaluationAssignmentSchema);

module.exports = EvaluationAssignment;
