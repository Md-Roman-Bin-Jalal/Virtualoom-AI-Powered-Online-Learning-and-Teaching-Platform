const express = require('express');
const {
    uploadChannelFile,
    getChannelFiles,
    getSubchannelFiles,
    deleteFile,
    searchFiles,
    toggleBookmark,
    addComment,
    addCommentReply,
    getFileComments
} = require('../controllers/fileController');
const router = express.Router();

// Upload file to channel or subchannel
router.post('/upload', uploadChannelFile);

// Get files for a channel
router.get('/channel/:channelId', getChannelFiles);

// Get files for a subchannel
router.get('/channel/:channelId/subchannel/:subchannelId', getSubchannelFiles);

// Delete a file
router.post('/delete', deleteFile);

// Search files by name
router.get('/search', searchFiles);

// Toggle bookmark status for a file
router.post('/toggle-bookmark', toggleBookmark);

// Add comment to a file
router.post('/comment', addComment);

// Add reply to a comment
router.post('/reply', addCommentReply);

// Get comments for a file
router.get('/comments/:fileId', getFileComments);

module.exports = router;
