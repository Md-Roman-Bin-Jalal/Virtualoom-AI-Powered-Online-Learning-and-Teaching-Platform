const express = require('express');
const { 
    createChannel, 
    addMessage, 
    getChannel, 
    generateInvite, 
    acceptInvite, 
    getJoinedChannels,
    getChannelMembers,
    createSubchannel,
    getSubchannels,
    getSubchannel,
    addSubchannelMessage,
    getSubchannelMembers,
    checkSubchannelPermission,
    updateMemberRole,
    removeMember,
    addMemberToSubchannel,
    getAvailableMembersForSubchannel,
    leaveChannel,
    deleteChannel,
    deleteSubchannel
} = require('../controllers/channelController');
const router = express.Router();

// Create a new channel
router.post('/create', createChannel);

// Add message to channel
router.post('/message', addMessage);

// Get channel details
router.get('/:channelId', getChannel);

// Get channel members
router.get('/:channelId/members', getChannelMembers);

// Generate invite link
router.get('/invite/:channelId', generateInvite);

// Accept invite to join channel
router.post('/invite/accept', acceptInvite);

// Get all channels joined by a user
router.get('/joined/:email', getJoinedChannels);

// Create a new subchannel
router.post('/subchannel/create', createSubchannel);

// Get all subchannels for a channel
router.get('/:channelId/subchannels', getSubchannels);

// Get subchannel details
router.get('/:channelId/subchannel/:subchannelId', getSubchannel);

// Get subchannel members
router.get('/:channelId/subchannel/:subchannelId/members', getSubchannelMembers);

// Check subchannel permissions
router.get('/:channelId/subchannel/:subchannelId/permissions', checkSubchannelPermission);

// Add message to subchannel
router.post('/subchannel/message', addSubchannelMessage);

// Member management routes
router.post('/member/update-role', updateMemberRole);
router.post('/member/remove', removeMember);

// Subchannel routes
router.post('/create-subchannel', createSubchannel);
router.get('/:channelId/subchannels', getSubchannels);
router.get('/:channelId/subchannel/:subchannelId/permission', checkSubchannelPermission);

// Subchannel member management routes
router.post('/subchannel/member/add', addMemberToSubchannel);
router.get('/:channelId/subchannel/:subchannelId/available-members', getAvailableMembersForSubchannel);
router.post('/add-member-to-subchannel', addMemberToSubchannel);

// Leave channel route
router.post('/leave', leaveChannel);

// Delete channel and subchannel routes
router.post('/delete', deleteChannel);
router.post('/subchannel/delete', deleteSubchannel);

module.exports = router;