const Channel = require('../models/Channel');
const User = require('../models/User');

// Create a new channel
const createChannel = async (req, res) => {
    try {
        console.log("Create channel request received:", req.body);
        const { name, description, email } = req.body;
        
        if (!name || !description || !email) {
            console.log("Missing required fields:", { name, description, email });
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        
        // Find user by email
        console.log("Looking for user with email:", email);
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found with email:", email);
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        console.log("User found:", user._id);
        
        // Create a new channel
        const newChannel = new Channel({
            name,
            description,
            creator: user._id,
            members: [{ user: user._id, role: 'creator' }]
        });
        
        console.log("Saving new channel to database");
        await newChannel.save();
        console.log("Channel saved successfully with ID:", newChannel._id);
        
        res.status(201).json({ 
            success: true, 
            message: "Channel created successfully",
            channel: {
                id: newChannel._id,
                name: newChannel.name,
                description: newChannel.description
            }
        });
    } catch (error) {
        console.error("Error creating channel:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Add message to channel
const addMessage = async (req, res) => {
    try {
        const { channelId, email, content } = req.body;
        
        if (!channelId || !email || !content) {
            return res.status(400).json({ success: false, message: "All fields are required" });
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
        
        // Find member role in MongoDB
        const member = channel.members.find(m => m.user.toString() === user._id.toString());
        const role = member ? member.role : 'guest';
        
        // Get display name using name field with fallback to email
        const displayName = user.name || email.split('@')[0];
        
        // Add message to channel with role from MongoDB and ensure name is set
        const newMessage = {
            sender: user._id,
            senderName: displayName, // Use name field with fallback
            senderRole: role, // Role from MongoDB
            content,
            timestamp: new Date()
        };
        
        channel.messages.push(newMessage);
        await channel.save();
        
        // Return the properly formatted message to the client
        res.status(201).json({ 
            success: true, 
            message: "Message added successfully",
            message: {
                id: newMessage._id,
                sender: {
                    id: user._id,
                    name: displayName
                },
                senderName: displayName,
                senderRole: newMessage.senderRole,
                content: newMessage.content,
                timestamp: newMessage.timestamp
            }
        });
    } catch (error) {
        console.error("Error adding message:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Get channel details
const getChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // Find channel with populated sender information
        const channel = await Channel.findById(channelId).populate({
            path: 'messages.sender',
            select: 'name email' // Only select name and email
        });
        
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Map the messages and ensure sender information is properly included
        const formattedMessages = channel.messages.map(msg => {
            // Use name field with email fallback
            const displayName = msg.sender ? 
                (msg.sender.name || msg.sender.email.split('@')[0]) : 
                (msg.senderName || 'Unknown User');
            
            return {
                id: msg._id,
                sender: msg.sender ? {
                    id: msg.sender._id,
                    name: displayName
                } : null,
                senderName: displayName,
                senderRole: msg.senderRole || 'newbie',
                content: msg.content,
                timestamp: msg.timestamp
            };
        });
        
        res.status(200).json({ 
            success: true,
            channel: {
                id: channel._id,
                name: channel.name,
                description: channel.description,
                messages: formattedMessages
            }
        });
    } catch (error) {
        console.error("Error getting channel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Generate invite link
const generateInvite = async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // Simple invite code generation
        const inviteCode = `${channelId}-${Date.now()}`;
        
        res.status(200).json({
            success: true,
            inviteLink: `http://localhost:3000/invite/${inviteCode}`
        });
    } catch (error) {
        console.error("Error generating invite:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Accept an invite to join a channel
const acceptInvite = async (req, res) => {
    try {
        const { inviteCode, email } = req.body;
        
        if (!inviteCode || !email) {
            return res.status(400).json({ success: false, message: "Invite code and email are required" });
        }
        
        // Extract channelId from inviteCode (format: channelId-timestamp)
        const channelId = inviteCode.split('-')[0];
        
        // Find the channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Check if user is already a member
        const userId = user._id.toString();
        const existingMember = channel.members.find(m => 
            m.user && m.user.toString() === userId
        );
        
        if (existingMember) {
            return res.status(400).json({ 
                success: false, 
                message: "You are already a member of this channel",
                channel: {
                    id: channel._id,
                    name: channel.name,
                    description: channel.description
                }
            });
        }
        
        // Add user to channel members
        channel.members.push({
            user: user._id,
            role: 'newbie'  // Default role for new members
        });
        
        // Save the channel - the pre-save middleware will handle duplicate removal automatically
        await channel.save();
        
        res.status(200).json({
            success: true,
            message: "You have joined the channel",
            channel: {
                id: channel._id,
                name: channel.name,
                description: channel.description
            }
        });
    } catch (error) {
        console.error("Error accepting invite:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all channels joined by a user
const getJoinedChannels = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find all channels where the user is a member
        const channels = await Channel.find({
            'members.user': user._id
        });
        
        // Format the response
        const formattedChannels = channels.map(channel => {
            // Find the user's role in this channel
            const member = channel.members.find(m => m.user.toString() === user._id.toString());
            const role = member ? member.role : 'guest';
            
            return {
                id: channel._id,
                name: channel.name,
                description: channel.description,
                role: role,
                createdAt: channel.createdAt
            };
        });
        
        res.status(200).json({
            success: true,
            channels: formattedChannels
        });
    } catch (error) {
        console.error("Error getting joined channels:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get channel members
const getChannelMembers = async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // Find channel
        const channel = await Channel.findById(channelId).populate('members.user');
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Format the response
        const members = channel.members.map(member => {
            const user = member.user;
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                role: member.role,
                status: user.status // Get the actual user status from the database
            };
        });
        
        res.status(200).json({
            success: true,
            members
        });
    } catch (error) {
        console.error("Error getting channel members:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create a new subchannel
const createSubchannel = async (req, res) => {
    try {
        const { channelId, name, description, email } = req.body;
        
        if (!channelId || !name || !description || !email) {
            return res.status(400).json({ success: false, message: "All fields are required" });
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
        
        // Check if user has permission to create subchannel (creator or admin)
        const member = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!member || (member.role !== 'creator' && member.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "You don't have permission to create subchannels" });
        }
        
        // Only add creator, admin, and moderator members to the subchannel initially
        const privilegedMembers = channel.members
            .filter(m => ['creator', 'admin', 'moderator'].includes(m.role))
            .map(m => ({ user: m.user, role: m.role })); // Include both user ID and role
        
        // Create a new subchannel
        const newSubchannel = {
            name,
            description,
            creator: user._id,
            members: privilegedMembers, // Only add privileged members with roles
            messages: [],
            createdAt: new Date()
        };
        
        // Add subchannel to channel
        channel.subchannels.push(newSubchannel);
        await channel.save();
        
        // Get the newly created subchannel
        const subchannel = channel.subchannels[channel.subchannels.length - 1];
        
        res.status(201).json({ 
            success: true, 
            message: "Subchannel created successfully",
            subchannel: {
                id: subchannel._id,
                name: subchannel.name,
                description: subchannel.description
            }
        });
    } catch (error) {
        console.error("Error creating subchannel:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Get all subchannels for a channel
const getSubchannels = async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // Find channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Format subchannels for response
        const subchannels = channel.subchannels.map(subchannel => ({
            id: subchannel._id,
            name: subchannel.name,
            description: subchannel.description,
            createdAt: subchannel.createdAt
        }));
        
        res.status(200).json({
            success: true,
            subchannels
        });
    } catch (error) {
        console.error("Error getting subchannels:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get subchannel details
const getSubchannel = async (req, res) => {
    try {
        const { channelId, subchannelId } = req.params;
        const userEmail = req.query.email; // Get the user's email from query params
        
        if (!userEmail) {
            return res.status(400).json({ success: false, message: "User email is required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel and populate sender reference in messages
        const channel = await Channel.findById(channelId).populate('subchannels.messages.sender');
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ success: false, message: "You're not a member of this channel" });
        }
        
        // Check if user has special role that grants access to all subchannels
        const hasSpecialRole = ['creator', 'admin', 'moderator'].includes(channelMember.role);
        
        // Check if user is in the subchannel's members array
        const isSubchannelMember = subchannel.members.some(m => m.user.toString() === user._id.toString());
        
        // User needs to either have a special role or be explicitly added to the subchannel
        if (!hasSpecialRole && !isSubchannelMember) {
            return res.status(403).json({ 
                success: false, 
                message: "You don't have permission to access this subchannel" 
            });
        }
        
        res.status(200).json({ 
            success: true,
            subchannel: {
                id: subchannel._id,
                name: subchannel.name,
                description: subchannel.description,
                messages: subchannel.messages.map(msg => ({
                    id: msg._id,
                    senderName: msg.senderName || (msg.sender ? msg.sender.name : 'Unknown User'),
                    senderRole: msg.senderRole,
                    content: msg.content,
                    timestamp: msg.timestamp
                }))
            }
        });
    } catch (error) {
        console.error("Error getting subchannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Add message to subchannel
const addSubchannelMessage = async (req, res) => {
    try {
        const { channelId, subchannelId, email, content } = req.body;
        
        if (!channelId || !subchannelId || !email || !content) {
            return res.status(400).json({ success: false, message: "All fields are required" });
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
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Find member role in MongoDB
        const member = channel.members.find(m => m.user.toString() === user._id.toString());
        const role = member ? member.role : 'guest';
        
        // Get display name using name field with fallback to email
        const displayName = user.name || email.split('@')[0];
        
        // Add message to subchannel with role from MongoDB
        const newMessage = {
            sender: user._id,
            senderName: displayName, // Use name with fallback
            senderRole: role, // Always use role from MongoDB
            content,
            timestamp: new Date()
        };
        
        subchannel.messages.push(newMessage);
        await channel.save();
        
        res.status(200).json({ 
            success: true,
            message: newMessage // Include the full message with the correct role in the response
        });
    } catch (error) {
        console.error("Error adding message to subchannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get subchannel members
const getSubchannelMembers = async (req, res) => {
    try {
        const { channelId, subchannelId } = req.params;
        const userEmail = req.query.email;
        
        if (!userEmail) {
            return res.status(400).json({ success: false, message: "User email is required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(channelId).populate('members.user');
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Get the list of user IDs in the subchannel's members array
        const subchannelMemberUserIds = subchannel.members.map(member => member.user.toString());
        
        // Find the corresponding channel members
        const subchannelMembers = channel.members.filter(member => 
            subchannelMemberUserIds.includes(member.user._id.toString())
        );
        
        // Format members for response
        const formattedMembers = subchannelMembers.map(member => ({
            id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
            isOnline: member.user.isOnline || false
        }));
        
        res.status(200).json({ 
            success: true,
            members: formattedMembers
        });
    } catch (error) {
        console.error("Error getting subchannel members:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Check subchannel permissions
const checkSubchannelPermission = async (req, res) => {
    try {
        const { channelId, subchannelId } = req.params;
        const userEmail = req.query.email;
        
        if (!userEmail) {
            return res.status(400).json({ success: false, message: "User email is required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel and populate sender information
        const channel = await Channel.findById(channelId).populate('subchannels.messages.sender');
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Check if user is a member of the channel
        const channelMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!channelMember) {
            return res.status(403).json({ 
                success: false, 
                message: "You're not a member of this channel",
                hasPermission: false
            });
        }
        
        // Check if user has special role that grants access to all subchannels
        const hasSpecialRole = ['creator', 'admin', 'moderator'].includes(channelMember.role);
        
        // Check if user is in the subchannel's members array
        const isSubchannelMember = subchannel.members.some(m => m.user.toString() === user._id.toString());
        
        // User needs to either have a special role or be explicitly added to the subchannel
        const hasPermission = hasSpecialRole || isSubchannelMember;
        
        res.status(200).json({ 
            success: true,
            hasPermission,
            message: hasPermission ? 
                "You have permission to access this subchannel" : 
                "You don't have permission to access this subchannel",
            subchannel: hasPermission ? {
                id: subchannel._id,
                name: subchannel.name,
                description: subchannel.description,
                messages: subchannel.messages.map(msg => ({
                    id: msg._id,
                    senderName: msg.senderName || (msg.sender ? msg.sender.name : 'Unknown User'),
                    senderRole: msg.senderRole,
                    content: msg.content,
                    timestamp: msg.timestamp
                }))
            } : null
        });
    } catch (error) {
        console.error("Error checking subchannel permissions:", error);
        res.status(500).json({ success: false, message: "Server error", hasPermission: false });
    }
};

// Update member role
const updateMemberRole = async (req, res) => {
    try {
        const { channelId, memberId, newRole, email } = req.body;
        
        if (!channelId || !memberId || !newRole || !email) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        
        // Find user making the request
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Find requesting user's role
        const requestingMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!requestingMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        const requestingRole = requestingMember.role;
        
        // Permission checks based on role hierarchy
        if (requestingRole === 'newbie') {
            return res.status(403).json({ success: false, message: "You don't have permission to change roles" });
        }
        
        // First try to find target member by subdocument ID
        let targetMemberIndex = channel.members.findIndex(m => m._id.toString() === memberId);
        
        // If not found by _id, try to find by user ID (for backward compatibility)
        if (targetMemberIndex === -1) {
            targetMemberIndex = channel.members.findIndex(m => m.user.toString() === memberId);
        }
        
        // If still not found, return error
        if (targetMemberIndex === -1) {
            return res.status(404).json({ success: false, message: "Member not found in this channel" });
        }
        
        const targetMember = channel.members[targetMemberIndex];
        const targetRole = targetMember.role;
        
        // Role hierarchy permission checks
        if (requestingRole === 'moderator') {
            // Moderators can only change newbie roles
            if (targetRole === 'creator' || targetRole === 'admin' || targetRole === 'moderator') {
                return res.status(403).json({ 
                    success: false, 
                    message: "Moderators can only change roles of newbies" 
                });
            }
            
            // Moderators can only set role to newbie
            if (newRole !== 'newbie') {
                return res.status(403).json({ 
                    success: false, 
                    message: "Moderators can only set roles to newbie" 
                });
            }
        } else if (requestingRole === 'admin') {
            // Admins can't change creator roles
            if (targetRole === 'creator') {
                return res.status(403).json({ 
                    success: false, 
                    message: "Admins cannot change the creator's role" 
                });
            }
            
            // Admins can't set someone to creator
            if (newRole === 'creator') {
                return res.status(403).json({ 
                    success: false, 
                    message: "Admins cannot set someone as creator" 
                });
            }
        }
        // Creator can change any role to any role
        
        // Update the member's role
        channel.members[targetMemberIndex].role = newRole;
        await channel.save();
        
        // Get the updated target member for the response
        const updatedMember = {
            _id: channel.members[targetMemberIndex]._id,
            userId: channel.members[targetMemberIndex].user,
            role: newRole
        };
        
        // Get the Socket.io instance and emit a role update event
        const io = req.app.get('io');
        if (io) {
            // Get the user whose role was updated
            const targetUser = await User.findById(targetMember.user);
            if (targetUser) {
                // Emit the role update event to all connected clients
                io.emit('memberRoleUpdate', {
                    channelId: channelId,
                    memberId: targetMember._id.toString(),
                    userId: targetMember.user.toString(),
                    userEmail: targetUser.email,
                    newRole: newRole,
                    channelName: channel.name
                });
                console.log(`Emitted memberRoleUpdate event for user ${targetUser.email} with new role ${newRole}`);
            }
        }
        
        res.status(200).json({
            success: true,
            message: "Member role updated successfully",
            member: updatedMember
        });
        
    } catch (error) {
        console.error("Error updating member role:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Remove a member from a channel
const removeMember = async (req, res) => {
    try {
        const { channelId, memberId, subchannelId, email } = req.body;
        
        if (!channelId || !memberId || !email) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        
        // Find the channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Find the user who is performing the kick action
        const actor = await User.findOne({ email });
        if (!actor) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find actor's role in the channel
        const actorMember = channel.members.find(m => m.user.toString() === actor._id.toString());
        if (!actorMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this channel" });
        }
        
        // Find the member to be removed - first try by document ID
        let memberToRemove = channel.members.find(m => m._id.toString() === memberId);
        
        // If not found by document ID, try by user ID reference
        if (!memberToRemove) {
            memberToRemove = channel.members.find(m => m.user.toString() === memberId);
        }
        
        if (!memberToRemove) {
            return res.status(404).json({ success: false, message: "Member not found in this channel" });
        }
        
        // Check permissions based on roles
        if (actorMember.role === 'newbie') {
            return res.status(403).json({ success: false, message: "You don't have permission to remove members" });
        }
        
        // Creator can remove anyone except themselves
        if (actorMember.role === 'creator') {
            if (actor._id.toString() === memberToRemove.user.toString()) {
                return res.status(403).json({ success: false, message: "You cannot remove yourself as the creator" });
            }
        } 
        // Admin can remove moderators and newbies but not creators or other admins
        else if (actorMember.role === 'admin') {
            const targetRole = memberToRemove.role;
            
            if (targetRole === 'creator' || targetRole === 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: `You don't have permission to remove a ${targetRole}` 
                });
            }
        } 
        // Moderator can only remove newbies
        else if (actorMember.role === 'moderator') {
            if (memberToRemove.role !== 'newbie') {
                return res.status(403).json({ 
                    success: false, 
                    message: "Moderators can only remove newbie members" 
                });
            }
        }
        
        // If subchannelId is provided, only remove from the specific subchannel
        if (subchannelId) {
            const subchannel = channel.subchannels.id(subchannelId);
            if (!subchannel) {
                return res.status(404).json({ success: false, message: "Subchannel not found" });
            }
            
            // Remove the member from the subchannel
            subchannel.members = subchannel.members.filter(m => 
                m.user.toString() !== memberToRemove.user.toString()
            );
        } else {
            // Remove the member from the main channel
            // Use both document ID and user reference ID for reliable removal
            channel.members = channel.members.filter(m => 
                m._id.toString() !== memberToRemove._id.toString() && 
                m.user.toString() !== memberToRemove.user.toString()
            );
            
            // Also remove the member from all subchannels
            if (channel.subchannels && channel.subchannels.length > 0) {
                channel.subchannels.forEach(subchannel => {
                    subchannel.members = subchannel.members.filter(m => 
                        m.user.toString() !== memberToRemove.user.toString()
                    );
                });
            }
        }
        
        await channel.save();
        
        res.status(200).json({ 
            success: true, 
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Get available members to add to a subchannel
const getAvailableMembersForSubchannel = async (req, res) => {
    try {
        const { channelId, subchannelId } = req.params;
        const userEmail = req.query.email;
        
        if (!userEmail) {
            return res.status(400).json({ success: false, message: "User email is required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Find channel
        const channel = await Channel.findById(channelId)
            .populate('members.user')
            .populate('subchannels.members.user');
        
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Check if requesting user has permission to manage subchannel
        const requestingMember = channel.members.find(m => m.user._id.toString() === user._id.toString());
        if (!requestingMember) {
            return res.status(403).json({ success: false, message: "You're not a member of this channel" });
        }
        
        // Only creators, admins, and moderators can add members to subchannels
        const allowedRoles = ['creator', 'admin', 'moderator'];
        if (!allowedRoles.includes(requestingMember.role)) {
            return res.status(403).json({ success: false, message: "You don't have permission to add members to this subchannel" });
        }
        
        // Get all members of the channel who are not already in the subchannel
        const subchannelMemberIds = subchannel.members.map(m => m.user.toString());
        const availableMembers = channel.members.filter(member => 
            !subchannelMemberIds.includes(member.user._id.toString())
        );
        
        // Format members for response
        const formattedMembers = availableMembers.map(member => ({
            id: member.user._id,
            username: member.user.username,
            email: member.user.email,
            role: member.role,
            isOnline: member.user.isOnline
        }));
        
        res.status(200).json({ 
            success: true,
            members: formattedMembers
        });
    } catch (error) {
        console.error("Error getting available members for subchannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Add a member to a subchannel
const addMemberToSubchannel = async (req, res) => {
    try {
        const { channelId, subchannelId, memberId, email } = req.body;
        
        if (!channelId || !subchannelId || !memberId || !email) {
            return res.status(400).json({ 
                success: false, 
                message: "Channel ID, Subchannel ID, Member ID, and Email are required" 
            });
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
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Check if requesting user has permission to manage subchannel
        const requestingMember = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!requestingMember) {
            return res.status(403).json({ success: false, message: "You're not a member of this channel" });
        }
        
        // Only creators, admins, and moderators can add members to subchannels
        const allowedRoles = ['creator', 'admin', 'moderator'];
        if (!allowedRoles.includes(requestingMember.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "You don't have permission to add members to this subchannel" 
            });
        }
        
        // Try to find the member using multiple ID formats (document ID or user reference ID)
        // First try to find the member by document ID in the members array
        let memberToAdd = channel.members.find(m => m._id.toString() === memberId);
        
        // If not found by document ID, try by user reference ID
        if (!memberToAdd) {
            memberToAdd = channel.members.find(m => m.user.toString() === memberId);
        }
        
        if (!memberToAdd) {
            return res.status(404).json({ 
                success: false, 
                message: "Member not found in this channel" 
            });
        }
        
        // Check if member is already in the subchannel
        if (subchannel.members.some(m => m.user.toString() === memberToAdd.user.toString())) {
            return res.status(400).json({ 
                success: false, 
                message: "Member is already in this subchannel" 
            });
        }
        
        // Add member to subchannel
        subchannel.members.push({ 
            user: memberToAdd.user,
            role: memberToAdd.role // Keep the same role as in the channel
        });
        
        // Save the channel with updated subchannel members
        await channel.save();
        
        res.status(200).json({ 
            success: true, 
            message: "Member added to subchannel successfully" 
        });
    } catch (error) {
        console.error("Error adding member to subchannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Leave a channel
const leaveChannel = async (req, res) => {
    try {
        const { channelId, subchannelId, email } = req.body;
        
        if (!channelId || !email) {
            return res.status(400).json({ success: false, message: "Channel ID and email are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // If a subchannelId is provided, only remove from subchannel
        if (subchannelId) {
            // Find channel
            const channel = await Channel.findById(channelId);
            if (!channel) {
                return res.status(404).json({ success: false, message: "Channel not found" });
            }
            
            // Find subchannel
            const subchannelIndex = channel.subchannels.findIndex(sub => sub._id.toString() === subchannelId);
            if (subchannelIndex === -1) {
                return res.status(404).json({ success: false, message: "Subchannel not found" });
            }
            
            // Remove user from subchannel members
            channel.subchannels[subchannelIndex].members = channel.subchannels[subchannelIndex].members.filter(
                member => member.user.toString() !== user._id.toString()
            );
            
            await channel.save();
            
            return res.status(200).json({
                success: true,
                message: "Successfully left the subchannel"
            });
        } else {
            // Remove from main channel (and all its subchannels)
            const channel = await Channel.findById(channelId);
            if (!channel) {
                return res.status(404).json({ success: false, message: "Channel not found" });
            }
            
            // Check if user is the creator - creators can't leave their own channels
            const memberIndex = channel.members.findIndex(member => 
                member.user.toString() === user._id.toString()
            );
            
            if (memberIndex === -1) {
                return res.status(400).json({ success: false, message: "You are not a member of this channel" });
            }
            
            if (channel.members[memberIndex].role === 'creator') {
                return res.status(400).json({ 
                    success: false, 
                    message: "As the creator, you cannot leave your own channel. You can delete it instead."
                });
            }
            
            // Remove user from channel members
            channel.members = channel.members.filter(
                member => member.user.toString() !== user._id.toString()
            );
            
            // Also remove user from all subchannels
            channel.subchannels.forEach(subchannel => {
                subchannel.members = subchannel.members.filter(
                    member => member.user.toString() !== user._id.toString()
                );
            });
            
            await channel.save();
            
            res.status(200).json({
                success: true,
                message: "Successfully left the channel"
            });
        }
    } catch (error) {
        console.error("Error leaving channel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete a channel
const deleteChannel = async (req, res) => {
    try {
        const { channelId, email } = req.body;
        
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
        
        // Check if user has permission to delete the channel (only creator and admin)
        const member = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!member || (member.role !== 'creator' && member.role !== 'admin')) {
            return res.status(403).json({ 
                success: false, 
                message: "You don't have permission to delete this channel" 
            });
        }
        
        // Delete the channel
        await Channel.findByIdAndDelete(channelId);
        
        res.status(200).json({
            success: true,
            message: "Channel deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting channel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete a subchannel
const deleteSubchannel = async (req, res) => {
    try {
        const { channelId, subchannelId, email } = req.body;
        
        if (!channelId || !subchannelId || !email) {
            return res.status(400).json({ 
                success: false, 
                message: "Channel ID, Subchannel ID, and email are required" 
            });
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
        
        // Find subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        if (!subchannel) {
            return res.status(404).json({ success: false, message: "Subchannel not found" });
        }
        
        // Check if user has permission to delete the subchannel (only creator and admin)
        const member = channel.members.find(m => m.user.toString() === user._id.toString());
        if (!member || (member.role !== 'creator' && member.role !== 'admin')) {
            return res.status(403).json({ 
                success: false, 
                message: "You don't have permission to delete this subchannel" 
            });
        }
        
        // Remove the subchannel from the channel
        channel.subchannels = channel.subchannels.filter(sub => sub._id.toString() !== subchannelId);
        await channel.save();
        
        res.status(200).json({
            success: true,
            message: "Subchannel deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting subchannel:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
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
    getAvailableMembersForSubchannel,
    addMemberToSubchannel,
    leaveChannel,
    deleteChannel,
    deleteSubchannel
};
