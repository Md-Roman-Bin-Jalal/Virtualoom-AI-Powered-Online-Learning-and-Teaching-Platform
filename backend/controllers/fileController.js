const ChannelFile = require('../models/ChannelFile');
const Channel = require('../models/Channel');
const User = require('../models/User');

// Upload a file to a channel
const uploadChannelFile = async (req, res) => {
    try {
        const { channelId, subchannelId, fileName, fileDescription, fileUrl, fileType, email } = req.body;
        
        if (!channelId || !fileName || !fileUrl || !fileType || !email) {
            return res.status(400).json({ success: false, message: "All required fields must be provided" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Check if user has permission to upload files (only admin, creator, moderator can upload)
        if (!['creator', 'admin', 'moderator'].includes(channelMember.role)) {
            return res.status(403).json({ success: false, message: "You don't have permission to upload files" });
        }
        
        let subchannel = null;
        if (subchannelId) {
            // Find the subchannel
            subchannel = channel.subchannels.id(subchannelId);
            if (!subchannel) {
                return res.status(404).json({ success: false, message: "Subchannel not found" });
            }
            
            // Check if user is a member of subchannel
            const subchannelMember = subchannel.members.find(m => m.user.toString() === user._id.toString());
            if (!subchannelMember && !['creator', 'admin', 'moderator'].includes(channelMember.role)) {
                return res.status(403).json({ success: false, message: "You don't have access to this subchannel" });
            }
        }
        
        // Get display name using name field with fallback to email
        const displayName = user.name || email.split('@')[0];
        
        // Create new file entry
        const newFile = new ChannelFile({
            name: fileName,
            description: fileDescription || '',
            fileUrl,
            fileType,
            uploader: user._id,
            uploaderName: displayName,
            uploaderRole: channelMember.role,
            channel: channelId,
            subchannel: subchannelId || null
        });
        
        // Save the file
        await newFile.save();
        
        res.status(201).json({ 
            success: true, 
            message: "File uploaded successfully",
            file: {
                id: newFile._id,
                name: newFile.name,
                fileType: newFile.fileType,
                uploaderName: newFile.uploaderName,
                createdAt: newFile.createdAt
            }
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Get all files for a channel
const getChannelFiles = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { email } = req.query;
        
        if (!channelId || !email) {
            return res.status(400).json({ success: false, message: "Channel ID and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Find all files for this channel (without subchannel)
        const files = await ChannelFile.find({ 
            channel: channelId,
            subchannel: null
        }).sort({ createdAt: -1 });
        
        // Sort files to show bookmarked files first
        const filesWithBookmarkStatus = files.map(file => ({
            id: file._id,
            name: file.name,
            description: file.description,
            fileUrl: file.fileUrl,
            fileType: file.fileType,
            uploaderName: file.uploaderName,
            uploaderRole: file.uploaderRole,
            createdAt: file.createdAt,
            isBookmarked: file.bookmarkedBy ? file.bookmarkedBy.some(userId => userId.toString() === user._id.toString()) : false,
            bookmarkCount: file.bookmarkedBy ? file.bookmarkedBy.length : 0,
            commentCount: file.comments ? file.comments.length : 0
        }));
        
        // Sort to show bookmarked files first
        const sortedFiles = filesWithBookmarkStatus.sort((a, b) => {
            if (a.isBookmarked && !b.isBookmarked) return -1;
            if (!a.isBookmarked && b.isBookmarked) return 1;
            return 0;
        });
        
        res.status(200).json({ 
            success: true,
            files: sortedFiles,
            userRole: channelMember.role
        });
    } catch (error) {
        console.error("Error getting channel files:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Get all files for a subchannel
const getSubchannelFiles = async (req, res) => {
    try {
        const { channelId, subchannelId } = req.params;
        const { email } = req.query;
        
        if (!channelId || !subchannelId || !email) {
            return res.status(400).json({ success: false, message: "Channel ID, subchannel ID, and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Check if user has access to subchannel
        const isChannelAdmin = ['creator', 'admin', 'moderator'].includes(channelMember.role);
        const subchannelMember = subchannel.members.find(m => m.user.toString() === user._id.toString());
        
        if (!subchannelMember && !isChannelAdmin) {
            return res.status(403).json({ success: false, message: "You don't have access to this subchannel" });
        }
        
        // Find all files for this subchannel
        const files = await ChannelFile.find({ 
            channel: channelId,
            subchannel: subchannelId
        }).sort({ createdAt: -1 });
        
        res.status(200).json({ 
            success: true,
            files: files.map(file => ({
                id: file._id,
                name: file.name,
                description: file.description,
                fileUrl: file.fileUrl,
                fileType: file.fileType,
                uploaderName: file.uploaderName,
                uploaderRole: file.uploaderRole,
                createdAt: file.createdAt
            })),
            userRole: subchannelMember ? subchannelMember.role : channelMember.role
        });
    } catch (error) {
        console.error("Error getting subchannel files:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Delete a file
const deleteFile = async (req, res) => {
    try {
        const { fileId, email } = req.body;
        
        if (!fileId || !email) {
            return res.status(400).json({ success: false, message: "File ID and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find the file
        const file = await ChannelFile.findById(fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(file.channel);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member with appropriate permissions
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Check if user is file uploader or has admin permissions
        const isUploader = file.uploader.toString() === user._id.toString();
        const hasPermission = ['creator', 'admin', 'moderator'].includes(channelMember.role);
        
        if (!isUploader && !hasPermission) {
            return res.status(403).json({ success: false, message: "You don't have permission to delete this file" });
        }
        
        // Delete the file
        await ChannelFile.findByIdAndDelete(fileId);
        
        res.status(200).json({ success: true, message: "File deleted successfully" });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Search files by name
const searchFiles = async (req, res) => {
    try {
        const { channelId, subchannelId, searchQuery, email } = req.query;
        
        if (!channelId || !email) {
            return res.status(400).json({ success: false, message: "Channel ID and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Build query for search
        const searchCriteria = { 
            channel: channelId,
            name: { $regex: searchQuery, $options: 'i' }  // Case-insensitive search
        };
        
        // Add subchannel to query if provided
        if (subchannelId) {
            searchCriteria.subchannel = subchannelId;
            
            // Verify subchannel exists and user has access
            const subchannel = channel.subchannels.id(subchannelId);
            if (!subchannel) {
                return res.status(404).json({ success: false, message: "Subchannel not found" });
            }
            
            // Check if user has access to subchannel
            const isChannelAdmin = ['creator', 'admin', 'moderator'].includes(channelMember.role);
            const subchannelMember = subchannel.members.find(m => m.user.toString() === user._id.toString());
            
            if (!subchannelMember && !isChannelAdmin) {
                return res.status(403).json({ success: false, message: "You don't have access to this subchannel" });
            }
        } else {
            // If not searching in a subchannel, exclude subchannel files
            searchCriteria.subchannel = null;
        }
        
        // Find files matching search criteria
        const files = await ChannelFile.find(searchCriteria).sort({ createdAt: -1 });
        
        // Sort files to show bookmarked files first
        const filesWithBookmarkStatus = files.map(file => ({
            id: file._id,
            name: file.name,
            description: file.description,
            fileUrl: file.fileUrl,
            fileType: file.fileType,
            uploaderName: file.uploaderName,
            uploaderRole: file.uploaderRole,
            createdAt: file.createdAt,
            isBookmarked: file.bookmarkedBy.some(userId => userId.toString() === user._id.toString()),
            bookmarkCount: file.bookmarkedBy.length,
            commentCount: file.comments ? file.comments.length : 0
        }));
        
        // Sort to show bookmarked files first
        const sortedFiles = filesWithBookmarkStatus.sort((a, b) => {
            if (a.isBookmarked && !b.isBookmarked) return -1;
            if (!a.isBookmarked && b.isBookmarked) return 1;
            return 0;
        });
        
        res.status(200).json({ 
            success: true,
            files: sortedFiles,
            userRole: channelMember.role
        });
    } catch (error) {
        console.error("Error searching files:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Toggle bookmark status for a file
const toggleBookmark = async (req, res) => {
    try {
        const { fileId, email } = req.body;
        
        if (!fileId || !email) {
            return res.status(400).json({ success: false, message: "File ID and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find the file
        const file = await ChannelFile.findById(fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(file.channel);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Check if user already bookmarked the file
        const bookmarkIndex = file.bookmarkedBy.findIndex(id => id.toString() === user._id.toString());
        
        if (bookmarkIndex === -1) {
            // Add bookmark
            file.bookmarkedBy.push(user._id);
            await file.save();
            res.status(200).json({ success: true, message: "File bookmarked successfully", isBookmarked: true });
        } else {
            // Remove bookmark
            file.bookmarkedBy.splice(bookmarkIndex, 1);
            await file.save();
            res.status(200).json({ success: true, message: "File unbookmarked successfully", isBookmarked: false });
        }
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Add a comment to a file
const addComment = async (req, res) => {
    try {
        const { fileId, content, email } = req.body;
        
        if (!fileId || !content || !email) {
            return res.status(400).json({ success: false, message: "File ID, comment content, and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find the file
        const file = await ChannelFile.findById(fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(file.channel);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Add the comment
        const newComment = {
            user: user._id,
            userName: user.name || user.username || email.split('@')[0],
            userRole: channelMember.role,
            content: content,
            createdAt: new Date(),
            replies: []
        };
        
        file.comments.push(newComment);
        await file.save();
        
        res.status(201).json({ 
            success: true, 
            message: "Comment added successfully",
            comment: {
                id: file.comments[file.comments.length - 1]._id,
                userName: newComment.userName,
                userRole: newComment.userRole,
                content: newComment.content,
                createdAt: newComment.createdAt,
                replies: []
            }
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Add a reply to a comment
const addCommentReply = async (req, res) => {
    try {
        const { fileId, commentId, content, email } = req.body;
        
        if (!fileId || !commentId || !content || !email) {
            return res.status(400).json({ 
                success: false, 
                message: "File ID, comment ID, reply content, and email are required" 
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find the file
        const file = await ChannelFile.findById(fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(file.channel);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Only allow non-newbie roles to reply
        if (channelMember.role === 'newbie') {
            return res.status(403).json({ success: false, message: "You don't have permission to reply to comments" });
        }
        
        // Find the comment
        const comment = file.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }
        
        // Add the reply
        const newReply = {
            user: user._id,
            userName: user.name || user.username || email.split('@')[0],
            userRole: channelMember.role,
            content: content,
            createdAt: new Date()
        };
        
        comment.replies.push(newReply);
        await file.save();
        
        res.status(201).json({ 
            success: true, 
            message: "Reply added successfully",
            reply: {
                id: comment.replies[comment.replies.length - 1]._id,
                userName: newReply.userName,
                userRole: newReply.userRole,
                content: newReply.content,
                createdAt: newReply.createdAt
            }
        });
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Get comments for a file
const getFileComments = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { email } = req.query;
        
        if (!fileId || !email) {
            return res.status(400).json({ success: false, message: "File ID and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find the file with comments
        const file = await ChannelFile.findById(fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(file.channel);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Format comments for response
        const comments = file.comments.map(comment => ({
            id: comment._id,
            userName: comment.userName,
            userRole: comment.userRole,
            content: comment.content,
            createdAt: comment.createdAt,
            replies: comment.replies.map(reply => ({
                id: reply._id,
                userName: reply.userName,
                userRole: reply.userRole,
                content: reply.content,
                createdAt: reply.createdAt
            })),
            // Indicate if this comment was made by the current user
            isOwnComment: comment.user.toString() === user._id.toString()
        }));
        
        // Only return comments to non-newbie users or to the comment author
        const userRole = channelMember.role;
        const filteredComments = userRole !== 'newbie' 
            ? comments
            : comments.filter(comment => comment.isOwnComment);
        
        res.status(200).json({
            success: true,
            comments: filteredComments,
            userRole: userRole,
            canReply: userRole !== 'newbie'
        });
    } catch (error) {
        console.error("Error getting file comments:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

module.exports = {
    uploadChannelFile,
    getChannelFiles,
    getSubchannelFiles,
    deleteFile,
    searchFiles,
    toggleBookmark,
    addComment,
    addCommentReply,
    getFileComments
};
