import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const Dashboard = () => {
    const [content, setContent] = useState('Welcome to the Dashboard'); // Default content
    const [channelName, setChannelName] = useState('');
    const [channelDescription, setChannelDescription] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [currentChannel, setCurrentChannel] = useState(null);
    const [inviteLink, setInviteLink] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [joinedChannels, setJoinedChannels] = useState([]);
    const [channelMembers, setChannelMembers] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [activeNav, setActiveNav] = useState('home'); // Track active navigation
    // Subchannel state
    const [subchannels, setSubchannels] = useState([]);
    const [currentSubchannel, setCurrentSubchannel] = useState(null);
    const [subchannelName, setSubchannelName] = useState('');
    const [subchannelDescription, setSubchannelDescription] = useState('');
    const [isCreatingSubchannel, setIsCreatingSubchannel] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('newbie'); // Track current user's role
    // Member list state
    const [selectedMember, setSelectedMember] = useState(null); // Track selected member for role management
    // State for managing subchannel member view
    const [showingAvailableMembers, setShowingAvailableMembers] = useState(false);
    // Add state for tracking all members with their subchannel status
    const [allChannelMembers, setAllChannelMembers] = useState([]);
    // File states
    const [showFiles, setShowFiles] = useState(false);
    const [files, setFiles] = useState([]);
    const [fileUploadForm, setFileUploadForm] = useState(false);
    const [fileName, setFileName] = useState('');
    const [fileDescription, setFileDescription] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileType, setFileType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    // File search, bookmark, and comments states
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedFileForComments, setSelectedFileForComments] = useState(null);
    const [fileComments, setFileComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newReply, setNewReply] = useState('');    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    const { socket, isConnected, onlineUsers, roleUpdate, clearRoleUpdate } = useSocket(); // Get roleUpdate from SocketContext
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Check URL parameters when component mounts to set the active navigation
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const section = params.get('section');
        
        if (section) {
            // Set the active navigation based on URL parameter
            setActiveNav(section);
            
            // Handle the navigation action based on section parameter
            if (section === 'create') {
                setContent('create-channel');
                setCurrentChannel(null);
            } else if (section === 'browse') {
                if (joinedChannels.length === 0) {
                    setContent(`${userEmail} join a channel to view them`);
                } else {
                    setContent('browse-channels');
                }
            }
        }
    }, [location, joinedChannels, userEmail]);

    // Listen for role updates from WebSocket
    useEffect(() => {
        if (roleUpdate && currentChannel && roleUpdate.channelId === currentChannel.id) {
            console.log('Applying role update from WebSocket:', roleUpdate);
            
            // Update channelMembers state to reflect the new role
            setChannelMembers(prevMembers => 
                prevMembers.map(member => {
                    // Check if this is the member whose role was updated
                    if ((member._id && member._id.toString() === roleUpdate.memberId) || 
                        (member.id && member.id.toString() === roleUpdate.memberId) ||
                        (member.email === roleUpdate.userEmail)) {
                        
                        // Found the member, update their role
                        return { ...member, role: roleUpdate.newRole };
                    }
                    return member;
                })
            );
            
            // If the current user's role was updated, update the currentUserRole state
            if (userEmail === roleUpdate.userEmail) {
                setCurrentUserRole(roleUpdate.newRole);
            }
            
            // Clear the roleUpdate to handle the next update correctly
            clearRoleUpdate();
        }
    }, [roleUpdate, currentChannel, userEmail, clearRoleUpdate]);

    // Scroll to the bottom of messages whenever messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
      useEffect(() => {
        // Check if user is logged in
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        
        if (!username || !email) {
            navigate('/login');
            return;
        }
        
        setUserEmail(email);
        setCurrentUserName(username);
        setContent(`${email} welcome to the dashboard`);
        
        // Fetch joined channels
        fetchJoinedChannels(email);

        // Set up socket event listeners
        if (socket) {
            // Listen for real-time messages from channels
            socket.on('message', (newMessage) => {
                console.log('Received real-time message:', newMessage);
                setMessages(prev => [...prev, newMessage]);
            });

            // Listen for real-time messages from subchannels
            socket.on('subchannelMessage', (newMessage) => {
                console.log('Received real-time subchannel message:', newMessage);
                setMessages(prev => [...prev, newMessage]);
            });

            // Emit that this user is online
            socket.emit('userOnline', { email });

            // Clean up on unmount
            return () => {
                // Notify server this user is going offline
                socket.emit('userOffline', { email });
                
                // Remove event listeners
                socket.off('message');
                socket.off('subchannelMessage');
            };
        }
    }, [socket, navigate]);

    // Log online users for debugging
    useEffect(() => {
        console.log('Online users in Dashboard:', onlineUsers);
    }, [onlineUsers]);
    
    // Periodically refresh online users list
    useEffect(() => {
        if (socket) {
            // Set up interval to refresh online users
            const refreshInterval = setInterval(() => {
                socket.emit('getOnlineUsers');
            }, 60000); // Refresh every minute
            
            return () => clearInterval(refreshInterval);
        }
    }, [socket]);

    // Fetch channels the user has joined
    const fetchJoinedChannels = async (email) => {
        try {
            const response = await fetch(`http://localhost:5000/api/channels/joined/${email}`);
            const data = await response.json();
            
            if (data.success) {
                setJoinedChannels(data.channels);
            } else {
                console.error('Failed to fetch joined channels:', data.message);
            }
        } catch (error) {
            console.error('Error fetching joined channels:', error);
        }
    };

    // Load channel data when currentChannel changes
    useEffect(() => {
        if (currentChannel) {
            // Load existing messages for this channel
            fetchChannelMessages(currentChannel.id);
            
            // Fetch channel members
            fetchChannelMembers(currentChannel.id);
            
            // Fetch subchannels for this channel
            fetchSubchannels(currentChannel.id);
            
            // Reset current subchannel when changing channels
            setCurrentSubchannel(null);

            // Join the socket room for this channel
            if (socket) {
                socket.emit('joinChannel', currentChannel.id);
                console.log('Joined socket room for channel:', currentChannel.id);
            }
        }
    }, [currentChannel, socket]);
    
    useEffect(() => {
        if (currentChannel && userEmail) {
            // Find the current user in the member list to get their role
            const userMember = channelMembers.find(member => member.email === userEmail);
            if (userMember) {
                setCurrentUserRole(userMember.role);
            }
        }
    }, [currentChannel, channelMembers, userEmail]);

    const fetchChannelMessages = async (channelId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/channels/${channelId}`);
            const data = await response.json();
            
            if (data.success) {
                console.log('Fetched channel messages:', data.channel.messages);
                setMessages(data.channel.messages.map(msg => ({
                    id: msg._id,
                    senderName: msg.senderName || msg.sender?.username || 'Unknown User',
                    senderRole: msg.senderRole || 'newbie',
                    content: msg.content,
                    timestamp: new Date(msg.timestamp).toLocaleString()
                })));
            }
        } catch (error) {
            console.error('Error fetching channel messages:', error);
        }
    };
    
    const fetchChannelMembers = async (channelId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/channels/${channelId}/members`);
            const data = await response.json();
            
            if (data.success) {
                // Store members with their roles from MongoDB
                setChannelMembers(data.members);
                
                // Update current user role for this channel using the data from MongoDB
                const email = localStorage.getItem('email');
                const currentUserMember = data.members.find(m => m.email === email);
                if (currentUserMember) {
                    setCurrentUserRole(currentUserMember.role);
                }
            } else {
                console.error('Failed to fetch channel members:', data.message);
            }
        } catch (error) {
            console.error('Error fetching channel members:', error);
        }
    };

    // Fetch subchannels for a channel
    const fetchSubchannels = async (channelId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/channels/${channelId}/subchannels`);
            const data = await response.json();
            
            if (data.success) {
                console.log('Fetched subchannels:', data.subchannels);
                setSubchannels(data.subchannels);
            } else {
                console.error('Failed to fetch subchannels:', data.message);
            }
        } catch (error) {
            console.error('Error fetching subchannels:', error);
        }
    };
    
    // Fetch subchannel members
    const fetchSubchannelMembers = async (channelId, subchannelId, email) => {
        try {
            const response = await fetch(`http://localhost:5000/api/channels/${channelId}/subchannel/${subchannelId}/members?email=${email}`);
            const data = await response.json();
            
            if (data.success) {
                setChannelMembers(data.members);
                setErrorMsg('');
            } else {
                console.error('Failed to fetch subchannel members:', data.message);
                setErrorMsg(data.message || 'Failed to fetch subchannel members');
                
                // Clear error after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error fetching subchannel members:', error);
            setErrorMsg('Failed to fetch subchannel members. Please try again later.');
            
            // Clear error after 3 seconds
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // For subchannels, get members who can be added (not already in the subchannel)
    const fetchAvailableMembersForSubchannel = async (channelId, subchannelId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to view available members');
                return;
            }
            
            const response = await fetch(`http://localhost:5000/api/channels/${channelId}/subchannel/${subchannelId}/available-members?email=${email}`);
            const data = await response.json();
            
            if (data.success) {
                setChannelMembers(data.members);
                setErrorMsg('');
            } else {
                console.error('Failed to fetch available members:', data.message);
                setErrorMsg(data.message || 'Failed to fetch available members');
                
                // Clear error after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error fetching available members:', error);
            setErrorMsg('Failed to fetch available members. Please try again later.');
            
            // Clear error after 3 seconds
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Add a new function to fetch all members with their subchannel status
    const fetchAllMembersWithStatus = async (channelId, subchannelId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to view members');
                return;
            }
            
            // First fetch all channel members
            const channelResponse = await fetch(`http://localhost:5000/api/channels/${channelId}/members`);
            const channelData = await channelResponse.json();
            
            if (!channelData.success) {
                console.error('Failed to fetch channel members:', channelData.message);
                setErrorMsg(channelData.message || 'Failed to fetch channel members');
                return;
            }
            
            // Now fetch subchannel members to determine status
            const subchannelResponse = await fetch(`http://localhost:5000/api/channels/${channelId}/subchannel/${subchannelId}/members?email=${email}`);
            const subchannelData = await subchannelResponse.json();
            
            if (!subchannelData.success) {
                console.error('Failed to fetch subchannel members:', subchannelData.message);
                setErrorMsg(subchannelData.message || 'Failed to fetch subchannel members');
                return;
            }
            
            // Create a set of subchannel member IDs for faster lookup
            const subchannelMemberIds = new Set(subchannelData.members.map(m => m.id));
            
            // Mark each channel member as added or not added to subchannel
            const membersWithStatus = channelData.members.map(member => ({
                ...member,
                inSubchannel: subchannelMemberIds.has(member.id)
            }));
            
            // Update state with all members and their status
            setAllChannelMembers(membersWithStatus);
            setShowingAvailableMembers(true);
        } catch (error) {
            console.error('Error fetching all members with status:', error);
            setErrorMsg('Failed to fetch members. Please try again later.');
        }
    };

    // Add this function to toggle showing all channel members with subchannel status
    const showAllMembersWithStatus = async () => {
        if (showingAvailableMembers) {
            // Switch back to showing current members
            fetchSubchannelMembers(currentChannel.id, currentSubchannel.id, localStorage.getItem('email'));
            setShowingAvailableMembers(false);
            setAllChannelMembers([]);
        } else {
            // Switch to showing all members with status
            fetchAllMembersWithStatus(currentChannel.id, currentSubchannel.id);
        }
    };

    // Modify the handleAddMemberToSubchannel function to update UI after adding a member
    const handleAddMemberToSubchannel = async (memberId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to add members');
                return;
            }
            
            // Find the member's username for the success message
            const memberToAdd = allChannelMembers.find(member => member._id === memberId || member.id === memberId);
            const memberUsername = memberToAdd ? (memberToAdd.username || memberToAdd.email.split('@')[0]) : 'Member';
            
            const response = await fetch('http://localhost:5000/api/channels/add-member-to-subchannel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channelId: currentChannel.id,
                    subchannelId: currentSubchannel.id,
                    memberId: memberId,
                    email: email
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show success popup
                setErrorMsg(`${memberUsername} has been added`);
                // Make the message look like a success instead of an error by applying a green style
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
                
                // Update the member's status in the all members list
                setAllChannelMembers(prevMembers => 
                    prevMembers.map(m => 
                        (m._id === memberId || m.id === memberId) ? { ...m, inSubchannel: true } : m
                    )
                );
            } else {
                setErrorMsg(data.message || 'Failed to add member to subchannel');
            }
        } catch (error) {
            console.error('Error adding member to subchannel:', error);
            setErrorMsg('An error occurred while adding the member. Please try again.');
        }
    };

    // Join subchannel and fetch messages
    const handleJoinSubchannel = async (subchannel) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to access a subchannel');
                navigate('/login');
                return;
            }
            
            // Check if user has permission to access subchannel
            const response = await fetch(`http://localhost:5000/api/channels/${currentChannel.id}/subchannel/${subchannel.id}/permissions?email=${email}`);
            const data = await response.json();
            
            if (data.success && data.hasPermission) {
                // User has permission, set the subchannel and fetch messages
                setCurrentSubchannel(subchannel);
                
                console.log('Fetched subchannel messages:', data.subchannel.messages);
                setMessages(data.subchannel.messages.map(msg => ({
                    id: msg._id,
                    senderName: msg.senderName || msg.sender?.username || 'Unknown User',
                    senderRole: msg.senderRole || 'newbie',
                    content: msg.content,
                    timestamp: new Date(msg.timestamp).toLocaleString()
                })));
                
                // Fetch subchannel members
                fetchSubchannelMembers(currentChannel.id, subchannel.id, email);
                
                // Reset the showing available members state
                setShowingAvailableMembers(false);
                
                // Join the socket room for this subchannel
                if (socket) {
                    socket.emit('joinSubchannel', {
                        channelId: currentChannel.id,
                        subchannelId: subchannel.id
                    });
                    console.log('Joined socket room for subchannel:', subchannel.id);
                }
                
                // Clear any previous error messages
                setErrorMsg('');
            } else {
                // User doesn't have permission - provide a specific error message
                const userRole = data.userRole || 'member';
                
                // Set appropriate error message based on response
                if (data.isRestricted) {
                    setErrorMsg("Only authorized ones can access subchannels");
                    // Add timeout to clear this error message after 3 seconds
                    setTimeout(() => {
                        setErrorMsg('');
                    }, 3000);
                } else {
                    setErrorMsg(data.message || `You don't have permission to access this subchannel. Your role: ${userRole}`);
                    // Clear error after 3 seconds
                    setTimeout(() => {
                        setErrorMsg('');
                    }, 3000);
                }
                
                setCurrentSubchannel(null);
            }
        } catch (error) {
            console.error('Error fetching subchannel messages:', error);
            setErrorMsg('Failed to access subchannel. Please try again later.');
            setCurrentSubchannel(null);
        }
    };
    
    const handleNavigation = (action) => {
        // Reset error message when navigating
        setErrorMsg('');
        setActiveNav(action); // Set active navigation item
        
        switch (action) {
            case 'home':
                setContent(`${userEmail} welcome to the dashboard`);
                setCurrentChannel(null);
                break;
            case 'create':
                setContent('create-channel');
                setCurrentChannel(null);
                break;
            case 'browse':
                if (joinedChannels.length === 0) {
                    setContent(`${userEmail} join a channel to view them`);
                } else {
                    setContent('browse-channels');
                }
                break;
            case 'assessment':
                setContent('assessment-info');
                setCurrentChannel(null);
                navigate('/assessment');
                break;
            case 'evaluation':
                setContent('evaluation-info');
                setCurrentChannel(null);
                navigate('/evaluation');
                break;
            case 'logout':
                handleLogout();
                break;
            default:
                break;
        }
    };

    const handleLogout = async () => {
        const email = localStorage.getItem('email');
        
        if (email && socket) {
            // Emit socket event to mark user as offline
            socket.emit('userOffline', { email });
            
            try {
                // Send logout request to update user status to offline in database
                const response = await fetch('http://localhost:5000/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                
                const data = await response.json();
                console.log("Logout response:", data);
                
                // Clear local storage
                localStorage.removeItem('username');
                localStorage.removeItem('email');
                
                // Redirect to login page
                navigate('/login');
            } catch (error) {
                console.error("Error during logout:", error);
                // Still redirect to login page even if there's an error
                localStorage.removeItem('username');
                localStorage.removeItem('email');
                navigate('/login');
            }
        } else {
            // If no email in localStorage, just redirect
            navigate('/login');
        }
    };

    const handleCreateChannel = async () => {
        // Reset error message
        setErrorMsg('');
        
        if (channelName && channelDescription) {
            try {
                const email = localStorage.getItem('email');
                if (!email) {
                    setErrorMsg('You need to be logged in to create a channel');
                    navigate('/login');
                    return;
                }

                console.log("Sending create channel request with email:", email);

                const response = await fetch('http://localhost:5000/api/channels/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: channelName,
                        description: channelDescription,
                        email: email
                    }),
                });

                const data = await response.json();
                console.log("Channel creation response:", data);
                
                if (data.success) {
                    // Clear form fields
                    setChannelName('');
                    setChannelDescription('');
                    
                    // Show success message
                    setContent(`${userEmail} go to browse channel to view it`);
                    
                    // Refresh the list of joined channels
                    fetchJoinedChannels(userEmail);
                } else {
                    setErrorMsg('Failed to create channel: ' + data.message);
                }
            } catch (error) {
                console.error('Error creating channel:', error);
                setErrorMsg('An error occurred while creating the channel. Please try again later.');
            }
        } else {
            setErrorMsg('Please provide both channel name and description');
        }
    };

    // Create new subchannel
    const handleCreateSubchannel = async () => {
        // Reset error message
        setErrorMsg('');
        
        if (subchannelName && subchannelDescription && currentChannel) {
            try {
                const email = localStorage.getItem('email');
                if (!email) {
                    setErrorMsg('You need to be logged in to create a subchannel');
                    navigate('/login');
                    return;
                }

                console.log("Sending create subchannel request");

                const response = await fetch('http://localhost:5000/api/channels/subchannel/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelId: currentChannel.id,
                        name: subchannelName,
                        description: subchannelDescription,
                        email: email
                    }),
                });

                const data = await response.json();
                console.log("Subchannel creation response:", data);
                
                if (data.success) {
                    // Clear form fields
                    setSubchannelName('');
                    setSubchannelDescription('');
                    setIsCreatingSubchannel(false);
                    
                    // Refresh the list of subchannels
                    fetchSubchannels(currentChannel.id);
                } else {
                    setErrorMsg('Failed to create subchannel: ' + data.message);
                }
            } catch (error) {
                console.error('Error creating subchannel:', error);
                setErrorMsg('An error occurred while creating the subchannel. Please try again later.');
            }
        } else {
            setErrorMsg('Please provide both subchannel name and description');
        }
    };

    const handleJoinChannel = (channel) => {
        // If clicking on the already selected channel and not in a subchannel, do nothing
        if (currentChannel && currentChannel.id === channel.id && !currentSubchannel) {
            return;
        }
        
        // If clicking on the currently selected channel that has a subchannel selected,
        // clear the subchannel selection and reload the main channel
        if (currentChannel && currentChannel.id === channel.id && currentSubchannel) {
            setCurrentSubchannel(null);
            fetchChannelMessages(channel.id);
            return;
        }
        
        // Reset member list when changing channels to prevent accumulation
        setChannelMembers([]);
        
        setCurrentChannel(channel);
        setCurrentSubchannel(null); // Reset subchannel when changing channels
        setContent('browse-channels');
    };

    const generateInviteLink = async (channelId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/channels/invite/${channelId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();
            if (data.success) {
                setInviteLink(data.inviteLink);
            }
        } catch (error) {
            console.error('Error generating invite link:', error);
        }
    };

    // Send message 
    const handleSendMessage = async () => {
        if (message.trim() && currentChannel && socket) {
            const email = localStorage.getItem('email');
            const username = localStorage.getItem('username') || 'Guest';
            
            try {
                // Determine the current user's role in this channel
                const userMember = channelMembers.find(member => member.email === email);
                const userRole = userMember ? userMember.role : 'newbie';
                
                const newMessage = {
                    senderName: username,
                    senderRole: userRole,
                    content: message,
                    timestamp: new Date().toLocaleString()
                };

                // If in a subchannel, send message to subchannel
                if (currentSubchannel) {
                    console.log('Sending message to subchannel:', currentSubchannel.id);
                    
                    // Save message to database
                    await fetch('http://localhost:5000/api/channels/subchannel/message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            channelId: currentChannel.id,
                            subchannelId: currentSubchannel.id,
                            email: email,
                            content: message
                        }),
                    });
                    
                    // Send the message through socket for real-time updates
                    socket.emit('sendSubchannelMessage', {
                        channelId: currentChannel.id,
                        subchannelId: currentSubchannel.id,
                        senderName: username,
                        senderRole: userRole,
                        content: message
                    });
                    
                } else {
                    // Regular channel message
                    console.log('Sending message to channel:', currentChannel.id);
                    
                    // Save message to database
                    await fetch('http://localhost:5000/api/channels/message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            channelId: currentChannel.id,
                            email: email,
                            content: message
                        }),
                    });
                    
                    // Send the message through socket for real-time updates
                    socket.emit('sendMessage', {
                        channelId: currentChannel.id,
                        senderName: username,
                        senderRole: userRole,
                        content: message
                    });
                }

                setMessage(''); // Clear input field
            } catch (error) {
                console.error('Error sending message:', error);
                setErrorMsg('Failed to send message. Please try again.');
            }
        }
    };

    // Get available roles based on current user's role
    const getAvailableRoles = () => {
        if (currentUserRole === 'creator') {
            return ['admin', 'moderator', 'newbie']; // Creator can assign any role except creator
        } else if (currentUserRole === 'admin') {
            return ['moderator', 'newbie']; // Admin can assign moderator or newbie
        } else if (currentUserRole === 'moderator') {
            return ['newbie']; // Moderator can only assign newbie
        }
        return [];
    };

    // Check if a user can change another user's role
    const canChangeRoles = (memberRole, memberEmail) => {
        // Users cannot change their own role
        if (memberEmail === userEmail) {
            return false;
        }
        
        if (currentUserRole === 'creator') {
            // Creator can change any role except another creator
            return memberRole !== 'creator';
        } else if (currentUserRole === 'admin') {
            // Admin can change any role except creator and admin
            return memberRole !== 'creator' && memberRole !== 'admin';
        } else if (currentUserRole === 'moderator') {
            // Moderator can only change newbie roles
            return memberRole === 'newbie';
        }
        return false; // Newbie can't change roles
    };

    // Helper function to determine if the current user can kick a member
    const canKickMember = (memberRole, memberEmail) => {
        // Cannot kick yourself
        if (memberEmail === userEmail) return false;
        
        // Creators can kick anyone except other creators
        if (currentUserRole === 'creator' && memberRole !== 'creator') return true;
        
        // Admins can kick moderators and newbies
        if (currentUserRole === 'admin' && (memberRole === 'moderator' || memberRole === 'newbie')) return true;
        
        // Moderators can only kick newbies
        if (currentUserRole === 'moderator' && memberRole === 'newbie') return true;
        
        return false;
    };

    // Handle role change with proper validation
    const handleRoleChange = async (memberId, memberEmail, newRole) => {
        try {
            const email = localStorage.getItem('email');
            
            // Find the member's current role
            const member = channelMembers.find(m => m._id === memberId || m.id === memberId);
            if (!member) return;
            
            // Store previous role in case we need to revert
            const previousRole = member.role;
            
            // Early validation check
            if (!canChangeRoles(previousRole, memberEmail)) {
                setErrorMsg(`You don't have permission to change this user's role`);
                return;
            }
            
            // Immediately update the UI state
            setChannelMembers(prev => 
                prev.map(m => 
                    (m._id === memberId || m.id === memberId) ? { ...m, role: newRole, previousRole } : m
                )
            );
            
            // Send the request to update the role in the backend
            const response = await fetch('http://localhost:5000/api/channels/member/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: currentChannel.id,
                    memberId: memberId,
                    newRole: newRole,
                    email: email
                }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                // If the request fails, revert the UI change
                setChannelMembers(prev => 
                    prev.map(m => 
                        (m._id === memberId || m.id === memberId) ? { ...m, role: previousRole } : m
                    )
                );
                setErrorMsg(`Failed to update role: ${data.message}`);
            } else {
                // Close the member options after successful role change
                setSelectedMember(null);
            }
        } catch (error) {
            console.error('Error updating member role:', error);
            // Revert UI change on error
            setChannelMembers(prev => 
                prev.map(m => 
                    (m._id === memberId || m.id === memberId) ? { ...m, role: m.previousRole || m.role } : m
                )
            );
            setErrorMsg('An error occurred while updating the role');
        }
    };

    // Handle kicking a member from the channel
    const handleKickMember = async (memberId, memberEmail) => {
        if (!window.confirm(`Are you sure you want to remove ${memberEmail} from this ${currentSubchannel ? 'subchannel' : 'channel'}?`)) {
            return;
        }
        
        try {
            const email = localStorage.getItem('email');
            
            // Find the user object in the members array
            const targetMember = channelMembers.find(m => 
                (m._id === memberId || m.id === memberId || m.email === memberEmail)
            );
            
            if (!targetMember) {
                setErrorMsg('Member not found in the current view');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/channels/member/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: currentChannel.id,
                    memberId: targetMember._id || targetMember.id,
                    subchannelId: currentSubchannel ? currentSubchannel.id : null,
                    email: email
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Successfully removed the member, update UI
                setChannelMembers(prevMembers => 
                    prevMembers.filter(m => m._id !== memberId && m.id !== memberId && m.email !== memberEmail)
                );
                setErrorMsg(`Member removed successfully from this ${currentSubchannel ? 'subchannel' : 'channel'}`);
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
                
                setSelectedMember(null); // Close member options
                
                // Refresh channel list
                fetchJoinedChannels(localStorage.getItem('email'));
                
                // If we're in a subchannel, refresh subchannel members
                if (currentSubchannel) {
                    fetchSubchannelMembers(currentChannel.id, currentSubchannel.id, email);
                } else {
                    // If in main channel, refresh channel members
                    fetchChannelMembers(currentChannel.id);
                }
            } else {
                setErrorMsg(data.message || 'Failed to remove member');
            }
        } catch (error) {
            console.error('Error removing member:', error);
            setErrorMsg('An error occurred while removing the member');
        }
    };

    // Handle member selection for role management
    const handleMemberSelect = (selectedMember) => {
        // User cannot change or kick themselves
        if (selectedMember.email === userEmail) {
            return;
        }

        // Find the exact member by matching both email and name/username
        const matchedMember = channelMembers.find(member => 
            member.email === selectedMember.email && 
            (member.username === selectedMember.username || 
             (member.username === undefined && member.email.split('@')[0] === selectedMember.email.split('@')[0]))
        );

        // Only set the selected member if we found an exact match
        setSelectedMember(currentSelected => 
            currentSelected && matchedMember && 
            currentSelected.email === matchedMember.email && 
            (currentSelected.username === matchedMember.username || 
             (currentSelected.username === undefined && currentSelected.email.split('@')[0] === matchedMember.email.split('@')[0]))
                ? null  // Deselect if clicking the same member
                : matchedMember  // Select the matched member
        );
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink)
            .then(() => alert('Invite link copied to clipboard!'))
            .catch(err => console.error('Could not copy text: ', err));
    };

    // Handle leaving a channel
    const handleLeaveChannel = async () => {
        // Confirm before leaving
        if (!window.confirm(`Are you sure you want to leave the ${currentChannel.name} channel? This will remove you from all subchannels as well.`)) {
            return; // User cancelled
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/channels/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: currentChannel.id,
                    email: localStorage.getItem('email')
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Reset channel and subchannel selection
                setCurrentChannel(null);
                setCurrentSubchannel(null);
                
                // Show success message
                setErrorMsg(`You have left the channel successfully`);
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
                
                // Refresh the joined channels list instead of redirecting
                fetchJoinedChannels(localStorage.getItem('email'));
            } else {
                setErrorMsg(data.message || 'Failed to leave channel');
                // Clear error after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error leaving channel:', error);
            setErrorMsg('An error occurred while leaving the channel');
            // Clear error after 3 seconds
            setTimeout(() => {
                setErrorMsg('');
                }, 3000);
        }
    };

    // Handle leaving a subchannel
    const handleLeaveSubchannel = async (subchannelId, subchannelName) => {
        // Confirm before leaving
        if (!window.confirm(`Are you sure you want to leave the ${subchannelName} subchannel?`)) {
            return; // User cancelled
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/channels/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: currentChannel.id,
                    subchannelId: subchannelId,
                    email: localStorage.getItem('email')
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Return to the main channel
                setCurrentSubchannel(null);
                // Fetch main channel messages
                fetchChannelMessages(currentChannel.id);
                // Refresh members for the main channel
                fetchChannelMembers(currentChannel.id);
                setErrorMsg(`You have left the ${subchannelName} subchannel`);
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            } else {
                setErrorMsg(data.message || 'Failed to leave subchannel');
                // Clear error after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error leaving subchannel:', error);
            setErrorMsg('An error occurred while leaving the subchannel');
            // Clear error after 3 seconds
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Define a new function to handle channel deletion
    const handleDeleteChannel = async () => {
        // Confirm before deleting
        if (!window.confirm(`Are you sure you want to delete the ${currentChannel.name} channel? This action cannot be undone and will delete all subchannels and messages.`)) {
            return; // User cancelled
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/channels/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: currentChannel.id,
                    email: localStorage.getItem('email')
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Reset channel and subchannel selection
                setCurrentChannel(null);
                setCurrentSubchannel(null);
                
                // Show success message
                setErrorMsg(`Channel deleted successfully`);
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
                
                // Refresh the joined channels list
                fetchJoinedChannels(localStorage.getItem('email'));
            } else {
                setErrorMsg(data.message || 'Failed to delete channel');
                // Clear error after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error deleting channel:', error);
            setErrorMsg('An error occurred while deleting the channel');
            // Clear error after 3 seconds
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Define a new function to handle subchannel deletion
    const handleDeleteSubchannel = async (subchannelId, subchannelName) => {
        // Confirm before deleting
        if (!window.confirm(`Are you sure you want to delete the ${subchannelName} subchannel? This action cannot be undone and will delete all messages.`)) {
            return; // User cancelled
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/channels/subchannel/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: currentChannel.id,
                    subchannelId: subchannelId,
                    email: localStorage.getItem('email')
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Return to the main channel
                setCurrentSubchannel(null);
                // Fetch main channel messages
                fetchChannelMessages(currentChannel.id);
                // Refresh members for the main channel
                fetchChannelMembers(currentChannel.id);
                // Refresh subchannels list
                fetchSubchannels(currentChannel.id);
                
                setErrorMsg(`Subchannel deleted successfully`);
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            } else {
                setErrorMsg(data.message || 'Failed to delete subchannel');
                // Clear error after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error deleting subchannel:', error);
            setErrorMsg('An error occurred while deleting the subchannel');
            // Clear error after 3 seconds
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Function to fetch files for a channel
    const fetchChannelFiles = async (channelId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to access files');
                return;
            }
            
            const response = await fetch(`http://localhost:5000/api/files/channel/${channelId}?email=${email}`);
            const data = await response.json();
            
            if (data.success) {
                setFiles(data.files);
                // Switch view to files
                setShowFiles(true);
            } else {
                setErrorMsg(data.message || 'Failed to fetch files');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error fetching channel files:', error);
            setErrorMsg('An error occurred while fetching files');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Function to fetch files for a subchannel
    const fetchSubchannelFiles = async (channelId, subchannelId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to access files');
                return;
            }
            
            const response = await fetch(`http://localhost:5000/api/files/channel/${channelId}/subchannel/${subchannelId}?email=${email}`);
            const data = await response.json();
            
            if (data.success) {
                setFiles(data.files);
                // Switch view to files
                setShowFiles(true);
            } else {
                setErrorMsg(data.message || 'Failed to fetch files');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error fetching subchannel files:', error);
            setErrorMsg('An error occurred while fetching files');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Function to handle file upload
    const handleFileUpload = async (e) => {
        e.preventDefault();
        
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to upload files');
                return;
            }
            
            // Check if all required fields are filled
            if (!fileName || !fileUrl || !fileType) {
                setErrorMsg('Please fill in all required fields');
                return;
            }
            
            const requestBody = {
                channelId: currentChannel.id,
                subchannelId: currentSubchannel ? currentSubchannel.id : null,
                fileName,
                fileDescription,
                fileUrl,
                fileType,
                email
            };
            
            const response = await fetch('http://localhost:5000/api/files/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Reset form fields
                setFileName('');
                setFileDescription('');
                setFileUrl('');
                setFileType('');
                setSelectedFile(null);
                setFileUploadForm(false);
                
                // Refresh files list
                if (currentSubchannel) {
                    fetchSubchannelFiles(currentChannel.id, currentSubchannel.id);
                } else {
                    fetchChannelFiles(currentChannel.id);
                }
                
                // Show success message
                setErrorMsg('File uploaded successfully');
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            } else {
                setErrorMsg(data.message || 'Failed to upload file');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setErrorMsg('An error occurred while uploading file');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Function to delete a file
    const deleteFile = async (fileId) => {
        // Confirm before deleting
        if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
            return;
        }
        
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to delete files');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/files/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId, email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Refresh files list
                if (currentSubchannel) {
                    fetchSubchannelFiles(currentChannel.id, currentSubchannel.id);
                } else {
                    fetchChannelFiles(currentChannel.id);
                }
                
                setErrorMsg('File deleted successfully');
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            } else {
                setErrorMsg(data.message || 'Failed to delete file');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            setErrorMsg('An error occurred while deleting file');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Function to search files by name
    const searchFiles = async () => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to search files');
                return;
            }
            
            if (!searchQuery.trim()) {
                setErrorMsg('Please enter a search term');
                return;
            }
            
            let url = `http://localhost:5000/api/files/search?channelId=${currentChannel.id}&email=${email}&searchQuery=${encodeURIComponent(searchQuery)}`;
            
            // Add subchannel parameter if in a subchannel
            if (currentSubchannel) {
                url += `&subchannelId=${currentSubchannel.id}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                setFiles(data.files);
                setShowSearchResults(true);
                // If no results found, show a message
                if (data.files.length === 0) {
                    setErrorMsg(`No files found matching "${searchQuery}"`);
                    setTimeout(() => {
                        setErrorMsg('');
                    }, 3000);
                }
            } else {
                setErrorMsg(data.message || 'Failed to search files');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error searching files:', error);
            setErrorMsg('An error occurred while searching files');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Function to clear search and return to all files
    const clearSearch = () => {
        setSearchQuery('');
        setShowSearchResults(false);
        
        // Reload all files
        if (currentSubchannel) {
            fetchSubchannelFiles(currentChannel.id, currentSubchannel.id);
        } else {
            fetchChannelFiles(currentChannel.id);
        }
    };

    // Helper function to determine file type icon
    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('doc')) return '📝';
        if (fileType.includes('presentation') || fileType.includes('ppt')) return '📊';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('video') || fileType.includes('youtube')) return '🎬';
        return '📁';
    };

    // Function to handle file selection for upload
    const handleFileSelection = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
            setFileType(file.type);
            
            // For actual file upload, you'd typically upload to a server here
            // and get back the URL. For this demo, we'll create a fake URL.
            setFileUrl(`http://example.com/uploads/${file.name}`);
        }
    };

    // Function to toggle bookmark status for a file
    const toggleBookmark = async (fileId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to bookmark files');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/files/toggle-bookmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId, email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update file in state to reflect new bookmark status
                setFiles(prevFiles => prevFiles.map(file => {
                    if (file.id === fileId) {
                        return { 
                            ...file, 
                            isBookmarked: data.isBookmarked,
                            // Increment or decrement bookmark count based on action
                            bookmarkCount: data.isBookmarked ? file.bookmarkCount + 1 : file.bookmarkCount - 1
                        };
                    }
                    return file;
                }));
                
                // Sort files to show bookmarked files first
                setFiles(prevFiles => [...prevFiles].sort((a, b) => {
                    if (a.isBookmarked && !b.isBookmarked) return -1;
                    if (!a.isBookmarked && b.isBookmarked) return 1;
                    return 0;
                }));
                
                // Show success message
                setErrorMsg(data.isBookmarked ? 'File bookmarked successfully' : 'File unbookmarked successfully');
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            } else {
                setErrorMsg(data.message || 'Failed to toggle bookmark');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            setErrorMsg('An error occurred while toggling bookmark');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };

    // Function to toggle between messages and files view
    const toggleFilesView = () => {
        if (!showFiles) {
            // Load files when switching to files view
            if (currentSubchannel) {
                fetchSubchannelFiles(currentChannel.id, currentSubchannel.id);
            } else if (currentChannel) {
                fetchChannelFiles(currentChannel.id);
            }
        }
        setShowFiles(!showFiles);
    };    // Function to fetch comments for a file
    const fetchFileComments = async (fileId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to view comments');
                return;
            }
            
            const response = await fetch(`http://localhost:5000/api/files/comments/${fileId}?email=${email}`);
            const data = await response.json();
            
            if (data.success) {
                setFileComments(data.comments || []);
                setSelectedFileForComments({
                    id: fileId,
                    canReply: true, // Setting default to true to enable comment input
                    userRole: data.userRole
                });
            } else {
                setErrorMsg(data.message || 'Failed to fetch comments');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error fetching file comments:', error);
            setErrorMsg('An error occurred while fetching comments');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };
    
    // Function to add a comment to a file
    const addComment = async (e) => {
        e.preventDefault();
        
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to add comments');
                return;
            }
            
            if (!newComment.trim()) {
                setErrorMsg('Comment cannot be empty');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/files/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fileId: selectedFileForComments.id, 
                    content: newComment, 
                    email 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Add the new comment to the state                // Make sure to use the right property name (userName instead of authorName)
                const commentWithCorrectProps = {
                    ...data.comment,
                    userName: data.comment.userName  // Ensure userName is correctly mapped
                };
                setFileComments(prevComments => [...prevComments, commentWithCorrectProps]);
                
                // Clear the comment input
                setNewComment('');
                
                // Update comment count in files list
                setFiles(prevFiles => prevFiles.map(file => {
                    if (file.id === selectedFileForComments.id) {
                        return { 
                            ...file, 
                            commentCount: file.commentCount + 1
                        };
                    }
                    return file;
                }));
                
                // Show success message
                setErrorMsg('Comment added successfully');
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            } else {
                setErrorMsg(data.message || 'Failed to add comment');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            setErrorMsg('An error occurred while adding comment');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };
    
    // Function to add a reply to a comment
    const addReply = async (commentId) => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You need to be logged in to add replies');
                return;
            }
            
            if (!newReply.trim()) {
                setErrorMsg('Reply cannot be empty');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/files/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fileId: selectedFileForComments.id, 
                    commentId,
                    content: newReply, 
                    email 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {                // Update the comment in state with the new reply, ensuring userName is used
                setFileComments(prevComments => prevComments.map(comment => {
                    if (comment.id === commentId) {
                        // Make sure the reply has the correct property name
                        const replyWithCorrectProps = {
                            ...data.reply,
                            userName: data.reply.userName // Ensure userName is correctly mapped
                        };
                        return {
                            ...comment,
                            replies: [...comment.replies, replyWithCorrectProps]
                        };
                    }
                    return comment;
                }));
                
                // Clear the reply input and hide reply form
                setNewReply('');
                setReplyingToCommentId(null);
                
                // Show success message
                setErrorMsg('Reply added successfully');
                
                // Make the message look like a success instead of an error
                const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
                const textElement = document.querySelector('div[style*="color: #b71c1c"]');
                
                if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
                if (textElement) textElement.style.color = '#2e7d32';
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            } else {
                setErrorMsg(data.message || 'Failed to add reply');
                setTimeout(() => {
                    setErrorMsg('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            setErrorMsg('An error occurred while adding reply');
            setTimeout(() => {
                setErrorMsg('');
            }, 3000);
        }
    };
    
    // Function to close comments view
    const closeComments = () => {
        setSelectedFileForComments(null);
        setFileComments([]);
        setNewComment('');
        setNewReply('');
        setReplyingToCommentId(null);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial' }}>
            {/* Sidebar - Icons */}
            <div
                style={{
                    width: '80px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '20px',
                }}
            >
                {/* Home Button */}
                <button
                    onClick={() => handleNavigation('home')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'home' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/home.png"
                        alt="Home"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>

                {/* Create Channel Button */}
                <button
                    onClick={() => handleNavigation('create')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'create' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/createChannel.png"
                        alt="Create Channel"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>

                {/* Browse Channel Button */}
                <button
                    onClick={() => handleNavigation('browse')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'browse' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/browseChannel.png"
                        alt="Browse Channel"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>
                
                {/* Assessment Button */}
                <button
                    onClick={() => handleNavigation('assessment')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'assessment' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/assesment.png"
                        alt="Assessment"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>
                
                {/* Evaluation Button */}
                <button
                    onClick={() => handleNavigation('evaluation')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'evaluation' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/evaluation.png"
                        alt="Evaluation"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>

                <button
          onClick={() => navigate('/meeting')}
          style={{
            border: 'none',
            backgroundColor: activeNav === 'meeting' ? '#d1e3fa' : 'transparent',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/meeting.png" alt="Meeting" style={{ width: '40px', height: '40px' }} />
        </button>

                {/* Logout Button */}
                <button
                    onClick={() => handleNavigation('logout')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'logout' ? '#d1e3fa' : 'transparent',
                        marginTop: 'auto',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/logout.png"
                        alt="Logout"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>
            </div>

            {/* Main Content Area */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    backgroundColor: '#ffffff',
                }}
            >
                {/* Error message display */}
                {errorMsg && (
                    <div style={{ 
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#ffebee', 
                        color: '#b71c1c', 
                        padding: '10px', 
                        borderRadius: '5px', 
                        width: '100%',
                        maxWidth: '500px',
                        textAlign: 'center',
                        zIndex: '100'
                    }}>
                        {errorMsg}
                    </div>
                )}
                
                {content === 'create-channel' && (
                    <div style={{ 
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px'
                    }}>
                        <div style={{ width: '100%', maxWidth: '500px' }}>
                            <h2 style={{ color: '#1976d2', marginBottom: '20px', textAlign: 'center' }}>Create Channel</h2>
                            <input
                                type="text"
                                placeholder="Channel Name (max 69 characters)"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value.slice(0, 69))}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '15px',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                }}
                            />
                            <textarea
                                placeholder="Channel Description (max 69 characters)"
                                value={channelDescription}
                                onChange={(e) => setChannelDescription(e.target.value.slice(0, 69))}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '15px',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    resize: 'none',
                                    height: '80px',
                                }}
                            />
                            <button
                                onClick={handleCreateChannel}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                Create Channel
                            </button>
                        </div>
                    </div>
                )}

                {content === 'browse-channels' && (
                    <>
                        {/* Joined Channels Sidebar */}
                        <div
                            style={{
                                width: '180px',
                                backgroundColor: '#e6f0ff',
                                borderRight: '1px solid #ccc',
                                padding: '20px 10px',
                                overflow: 'auto'
                            }}
                        >
                            <h3 style={{ color: '#1976d2', textAlign: 'center', marginBottom: '15px' }}>My Channels</h3>
                            {joinedChannels.length === 0 ? (
                                <div style={{ 
                                    padding: '10px',
                                    color: '#666',
                                    textAlign: 'center',
                                    fontSize: '14px'
                                }}>
                                    No channels joined yet
                                </div>
                            ) : (
                                joinedChannels.map(channel => (
                                    <div key={channel.id}>
                                        <div 
                                            onClick={() => handleJoinChannel(channel)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: currentChannel && currentChannel.id === channel.id ? 
                                                    (currentSubchannel ? 'rgba(193, 213, 247, 0.6)' : '#c1d5f7') : 'white',
                                                borderRadius: '5px',
                                                marginBottom: '10px',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                height: '40px', // Increased height
                                                display: 'flex',
                                                alignItems: 'center', // Center vertically
                                                justifyContent: 'center' // Center horizontally
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{channel.name}</div>
                                        </div>

                                        {/* Display subchannels directly under the selected channel */}
                                        {currentChannel && currentChannel.id === channel.id && (
                                            <div style={{ marginLeft: '15px', marginBottom: '15px' }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    marginBottom: '5px'
                                                }}>
                                                    <h4 style={{ color: '#1976d2', margin: 0, fontSize: '14px' }}>Subchannels</h4>
                                                    {/* Only show subchannel creation button to creator, admin, moderator */}
                                                    {['creator', 'admin', 'moderator'].includes(currentUserRole) && (
                                                        <button
                                                            onClick={() => setIsCreatingSubchannel(true)}
                                                            style={{
                                                                backgroundColor: '#1976d2',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '20px',
                                                                height: '20px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Subchannel creation form */}
                                                {isCreatingSubchannel && (
                                                    <div style={{ 
                                                        backgroundColor: 'white',
                                                        padding: '10px',
                                                        borderRadius: '5px',
                                                        marginBottom: '10px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                    }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Subchannel Name"
                                                            value={subchannelName}
                                                            onChange={(e) => setSubchannelName(e.target.value.slice(0, 69))}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                marginBottom: '8px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '3px',
                                                                fontSize: '12px'
                                                            }}
                                                        />
                                                        <textarea
                                                            placeholder="Subchannel Description"
                                                            value={subchannelDescription}
                                                            onChange={(e) => setSubchannelDescription(e.target.value.slice(0, 69))}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                marginBottom: '8px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '3px',
                                                                resize: 'none',
                                                                height: '60px',
                                                                fontSize: '12px'
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <button
                                                                onClick={() => setIsCreatingSubchannel(false)}
                                                                style={{
                                                                    padding: '5px 10px',
                                                                    backgroundColor: '#f5f5f5',
                                                                    color: '#666',
                                                                    border: '1px solid #ccc',
                                                                    borderRadius: '3px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={handleCreateSubchannel}
                                                                style={{
                                                                    padding: '5px 10px',
                                                                    backgroundColor: '#1976d2',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '3px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Create
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                  {/* List of subchannels */}
                                                {subchannels.length === 0 ? (
                                                    <div style={{ 
                                                        padding: '8px',
                                                        color: '#666',
                                                        textAlign: 'center',
                                                        fontSize: '12px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '5px',
                                                        marginBottom: '8px'
                                                    }}>
                                                        No subchannels yet
                                                    </div>
                                                ) : (
                                                    subchannels.map(subchannel => (
                                                        <div 
                                                            key={subchannel.id}
                                                            onClick={() => handleJoinSubchannel(subchannel)}
                                                            style={{
                                                                padding: '8px',
                                                                backgroundColor: currentSubchannel && currentSubchannel.id === subchannel.id ? '#c1d5f7' : 'white',
                                                                borderRadius: '5px',
                                                                marginBottom: '8px',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                                height: '40px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '14px' }}>{subchannel.name}</div>
                                                        </div>
                                                    ))
                                                )}
                                                
                                                {/* Files button */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    marginTop: '10px',
                                                    marginBottom: '5px'
                                                }}>
                                                    <h4 style={{ color: '#1976d2', margin: 0, fontSize: '14px' }}>Files</h4>
                                                </div>
                                                <div 
                                                    onClick={toggleFilesView}
                                                    style={{
                                                        padding: '8px',
                                                        backgroundColor: showFiles ? '#c1d5f7' : 'white',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                        height: '40px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginBottom: '10px'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '14px' }}>Shared Files</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Middle section - Messages */}
                        <div style={{ 
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRight: '1px solid #ccc'
                        }}>
                            {currentChannel ? (
                                <>
                                    {/* Channel header */}
                                    <div style={{ 
                                        padding: '15px', 
                                        backgroundColor: '#1976d2', 
                                        color: 'white',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h2 style={{ margin: 0 }}>
                                                {currentChannel.name}
                                                {currentSubchannel && (
                                                    <span style={{ fontSize: '16px' }}> &gt; {currentSubchannel.name}</span>
                                                )}
                                            </h2>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                                                {currentSubchannel ? currentSubchannel.description : currentChannel.description}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {/* Show Invite button for main channels and Manage Members button for subchannels */}
                                            {currentSubchannel ? (
                                                <button
                                                    onClick={() => showAllMembersWithStatus()}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: 'white',
                                                        color: '#1976d2',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    {showingAvailableMembers ? 'Show Members' : 'Manage Members'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => generateInviteLink(currentChannel.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: 'white',
                                                        color: '#1976d2',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    Invite
                                                </button>
                                            )}
                                            <button
                                                onClick={toggleFilesView}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: 'white',
                                                    color: '#1976d2',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {showFiles ? 'Messages' : 'Files'}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Invite link */}
                                    {inviteLink && (
                                        <div style={{ 
                                            padding: '10px',
                                            backgroundColor: '#e6f0ff',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid #ccc'
                                        }}>
                                            <div style={{ 
                                                fontSize: '12px', 
                                                whiteSpace: 'nowrap', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis' 
                                            }}>
                                                {inviteLink}
                                            </div>
                                            <button
                                                onClick={copyInviteLink}
                                                style={{
                                                    marginLeft: '10px',
                                                    padding: '5px 10px',
                                                    backgroundColor: '#1976d2',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Content area - showing either messages or files */}
                                    {!showFiles ? (
                                        // Messages container
                                        <div style={{ 
                                            flex: 1, 
                                            padding: '10px',
                                            overflow: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {messages.length === 0 ? (
                                                <div style={{ 
                                                    flex: 1,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: '#666',
                                                    fontStyle: 'italic'
                                                }}>
                                                    No messages yet. Start the conversation!
                                                </div>
                                            ) : (                                                messages.map((msg, index) => {
                                                    // Get current user information
                                                    const currentEmail = localStorage.getItem('email');
                                                    const currentUsername = localStorage.getItem('username');
                                                    
                                                    // Check if the current user is the sender based on multiple possible identifiers
                                                    const isOwnMessage = 
                                                        msg.senderName === currentUsername || 
                                                        (msg.sender && msg.sender.email === currentEmail) ||
                                                        (msg.sender && msg.sender.username === currentUsername) ||
                                                        (msg.email === currentEmail);
                                                    
                                                    return (                                                        <div
                                                            key={index}
                                                            style={{
                                                                margin: '5px 0',
                                                                padding: '10px',
                                                                borderRadius: '8px',
                                                                backgroundColor: isOwnMessage ? '#e3f2fd' : '#ffffff',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                maxWidth: '80%', // Slightly narrower for better appearance
                                                                alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                                                                borderTopRightRadius: isOwnMessage ? '2px' : '8px',
                                                                borderTopLeftRadius: isOwnMessage ? '8px' : '2px'
                                                            }}
                                                        >                                            <div style={{ 
                                                                    marginBottom: '5px', 
                                                                    display: 'flex', 
                                                                    justifyContent: isOwnMessage ? 'flex-end' : 'space-between' 
                                                                }}>
                                                                {!isOwnMessage ? (
                                                                    <>
                                                                        <div>
                                                                            <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                                                {msg.senderName || msg.sender?.username || 'Unknown User'}
                                                                            </span>
                                                                            {' '}
                                                                            <span style={{ 
                                                                                fontSize: '11px', 
                                                                                backgroundColor: (() => {
                                                                                    switch(msg.senderRole) {
                                                                                        case 'creator': return '#e3f2fd';
                                                                                        case 'admin': return '#e8f5e9';
                                                                                        case 'moderator': return '#fff3e0';
                                                                                        default: return '#f5f5f5';
                                                                                    }
                                                                                })(),
                                                                                color: (() => {
                                                                                    switch(msg.senderRole) {
                                                                                        case 'creator': return '#0d47a1';
                                                                                        case 'admin': return '#1b5e20';
                                                                                        case 'moderator': return '#e65100';
                                                                                        default: return '#616161';
                                                                                    }
                                                                                })(),
                                                                                padding: '2px 6px',
                                                                                borderRadius: '4px',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                {msg.senderRole || 'newbie'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                                                            {typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toLocaleString()}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    // For own messages, just show the timestamp
                                                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                                                        {typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </div><div style={{ 
                                                                fontSize: '14px',
                                                                lineHeight: '1.4',
                                                                wordBreak: 'break-word',
                                                                textAlign: isOwnMessage ? 'right' : 'left'
                                                            }}>
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    ) : (
                                        // Files container
                                        <div style={{ 
                                            flex: 1, 
                                            padding: '20px',
                                            overflow: 'auto'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '20px'
                                            }}>                                                <h3 style={{ margin: 0 }}>
                                                    {currentSubchannel ? `${currentSubchannel.name} Files` : `${currentChannel.name} Files`}
                                                </h3>
                                                
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {/* Search input */}
                                                    <div style={{ display: 'flex' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Search files..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && searchFiles()}
                                                            style={{
                                                                padding: '8px 12px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px 0 0 4px',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                        <button
                                                            onClick={searchFiles}
                                                            style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#1976d2',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '0 4px 4px 0',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            🔍
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Clear search button - only show when viewing search results */}
                                                    {showSearchResults && (
                                                        <button
                                                            onClick={clearSearch}
                                                            style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#f5f5f5',
                                                                color: '#333',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Clear Search
                                                        </button>
                                                    )}
                                                    
                                                    {/* Only show upload button for users with proper permissions */}
                                                    {['creator', 'admin', 'moderator'].includes(currentUserRole) && (
                                                        <button
                                                            onClick={() => setFileUploadForm(!fileUploadForm)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#1976d2',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold',
                                                            }}
                                                        >
                                                            {fileUploadForm ? 'Cancel Upload' : 'Upload File'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* File upload form */}
                                            {fileUploadForm && (
                                                <div style={{
                                                    backgroundColor: '#f5f5f5',
                                                    padding: '15px',
                                                    borderRadius: '8px',
                                                    marginBottom: '20px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                }}>
                                                    <h4 style={{ marginTop: 0 }}>Upload New File</h4>
                                                    <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="File Name*"
                                                            value={fileName}
                                                            onChange={(e) => setFileName(e.target.value)}
                                                            style={{
                                                                padding: '8px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px'
                                                            }}
                                                            required
                                                        />
                                                        
                                                        <textarea
                                                            placeholder="File Description (optional)"
                                                            value={fileDescription}
                                                            onChange={(e) => setFileDescription(e.target.value)}
                                                            style={{
                                                                padding: '8px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                resize: 'vertical',
                                                                minHeight: '80px'
                                                            }}
                                                        />
                                                        
                                                        <div>
                                                            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Select file type:</p>
                                                            <select
                                                                value={fileType}
                                                                onChange={(e) => setFileType(e.target.value)}
                                                                style={{
                                                                    padding: '8px',
                                                                    width: '100%',
                                                                    border: '1px solid #ccc',
                                                                    borderRadius: '4px'
                                                                }}
                                                                required
                                                            >
                                                                <option value="">-- Select File Type --</option>
                                                                <option value="application/pdf">PDF Document</option>
                                                                <option value="application/vnd.ms-powerpoint">PowerPoint</option>
                                                                <option value="application/vnd.ms-excel">Excel</option>
                                                                <option value="application/msword">Word Document</option>
                                                                <option value="image/jpeg">Image (JPEG)</option>
                                                                <option value="image/png">Image (PNG)</option>
                                                                <option value="video/youtube">YouTube Link</option>
                                                                <option value="text/plain">Text File</option>
                                                                <option value="other">Other</option>
                                                            </select>
                                                        </div>
                                                        
                                                        <input
                                                            type="text"
                                                            placeholder="File URL or YouTube Embed URL*"
                                                            value={fileUrl}
                                                            onChange={(e) => setFileUrl(e.target.value)}
                                                            style={{
                                                                padding: '8px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px'
                                                            }}
                                                            required
                                                        />
                                                        
                                                        <button
                                                            type="submit"
                                                            style={{
                                                                padding: '10px',
                                                                backgroundColor: '#1976d2',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            Upload
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                            
                                            {/* Files list */}
                                            {files.length === 0 ? (
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '200px',
                                                    color: '#666',
                                                    fontStyle: 'italic'
                                                }}>
                                                    No files shared yet.
                                                </div>
                                            ) : (                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    {files.map(file => (
                                                        <div
                                                            key={file.id}
                                                            style={{
                                                                padding: '15px',
                                                                borderRadius: '8px',
                                                                backgroundColor: '#ffffff',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                <div style={{ fontSize: '32px' }}>{getFileIcon(file.fileType)}</div>
                                                                <div>
                                                                    <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                                                                        {file.name}
                                                                        {file.isBookmarked && <span style={{ color: '#ff9800', marginLeft: '5px' }}>★</span>}
                                                                    </div>
                                                                    {file.description && (
                                                                        <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                                                                            {file.description}
                                                                        </div>
                                                                    )}
                                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                                        Uploaded by: <span style={{ fontWeight: 'bold' }}>{file.uploaderName}</span>
                                                                        {' '}
                                                                        <span style={{ 
                                                                            fontSize: '10px', 
                                                                            backgroundColor: (() => {
                                                                                switch(file.uploaderRole) {
                                                                                    case 'creator': return '#e3f2fd';
                                                                                    case 'admin': return '#e8f5e9';
                                                                                    case 'moderator': return '#fff3e0';
                                                                                    default: return '#f5f5f5';
                                                                                }
                                                                            })(),
                                                                            color: (() => {
                                                                                switch(file.uploaderRole) {
                                                                                    case 'creator': return '#0d47a1';
                                                                                    case 'admin': return '#1b5e20';
                                                                                    case 'moderator': return '#e65100';
                                                                                    default: return '#616161';
                                                                                }
                                                                            })(),
                                                                            padding: '1px 4px',
                                                                            borderRadius: '2px',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {file.uploaderRole}
                                                                        </span>
                                                                        {' • '}
                                                                        {new Date(file.createdAt).toLocaleString()}
                                                                    </div>
                                                                    {/* File stats (bookmark count, comment count) */}
                                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px', fontSize: '12px', color: '#757575' }}>
                                                                        <span>
                                                                            <span style={{ color: file.isBookmarked ? '#ff9800' : '#757575' }}>★</span> {file.bookmarkCount || 0}
                                                                        </span>
                                                                        <span>
                                                                            <span>💬</span> {file.commentCount || 0}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <a 
                                                                    href={file.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        padding: '8px 15px',
                                                                        backgroundColor: '#1976d2',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        textDecoration: 'none',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >
                                                                    View
                                                                </a>
                                                                
                                                                {/* Bookmark toggle button */}
                                                                <button
                                                                    onClick={() => toggleBookmark(file.id)}
                                                                    style={{
                                                                        padding: '8px 15px',
                                                                        backgroundColor: file.isBookmarked ? '#ffeb3b' : '#f5f5f5',
                                                                        color: file.isBookmarked ? '#f57f17' : '#757575',
                                                                        border: '1px solid #e0e0e0',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >
                                                                    {file.isBookmarked ? 'Unbookmark' : 'Bookmark'}
                                                                </button>
                                                                  {/* Only show delete button for file uploader or admins */}
                                                                {(['creator', 'admin', 'moderator'].includes(currentUserRole)) && (
                                                                    <button
                                                                        onClick={() => deleteFile(file.id)}
                                                                        style={{
                                                                            padding: '8px 15px',
                                                                            backgroundColor: '#f44336',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}
                                                                {/* Comments button */}
                                                                <button
                                                                    onClick={() => fetchFileComments(file.id)}
                                                                    style={{
                                                                        padding: '8px 15px',
                                                                        backgroundColor: '#1976d2',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >
                                                                    Comments ({file.commentCount || 0})
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Comments view */}
                                    {selectedFileForComments && (
                                        <div style={{ 
                                            flex: 1, 
                                            padding: '20px',
                                            overflow: 'auto',
                                            backgroundColor: '#f5f5f5',
                                            borderTop: '1px solid #ccc'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '20px'
                                            }}>
                                                <h3 style={{ margin: 0 }}>Comments</h3>
                                                <button
                                                    onClick={closeComments}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                            {fileComments.length === 0 ? (
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '200px',
                                                    color: '#666',
                                                    fontStyle: 'italic'
                                                }}>
                                                    No comments yet.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    {fileComments.map(comment => (
                                                        <div
                                                            key={comment.id}
                                                            style={{
                                                                padding: '15px',
                                                                borderRadius: '8px',
                                                                backgroundColor: '#ffffff',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '10px'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>                                                                <div>
                                                                    <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '16px' }}>
                                                                        {comment.userName}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                                        {new Date(comment.createdAt).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                {selectedFileForComments.canReply && (
                                                                    <button
                                                                        onClick={() => setReplyingToCommentId(comment.id)}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            backgroundColor: '#1976d2',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '12px'
                                                                        }}
                                                                    >
                                                                        Reply
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '14px', color: '#666' }}>
                                                                {comment.content}
                                                            </div>
                                                            {comment.replies && comment.replies.length > 0 && (
                                                                <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                    {comment.replies.map(reply => (
                                                                        <div
                                                                            key={reply.id}
                                                                            style={{
                                                                                padding: '10px',
                                                                                borderRadius: '8px',
                                                                                backgroundColor: '#f5f5f5',
                                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                gap: '5px'
                                                                            }}
                                                                        >                                                                            <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '14px' }}>
                                                                                {reply.userName}
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                                                {new Date(reply.createdAt).toLocaleString()}
                                                                            </div>
                                                                            <div style={{ fontSize: '14px', color: '#666' }}>
                                                                                {reply.content}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {replyingToCommentId === comment.id && (                                                                <form onSubmit={(e) => { e.preventDefault(); addReply(comment.id); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                    <div style={{ marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                                                                        Replying as: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{localStorage.getItem('username') || localStorage.getItem('email')?.split('@')[0] || 'User'}</span>
                                                                    </div>
                                                                    <textarea
                                                                        placeholder="Write your reply..."
                                                                        value={newReply}
                                                                        onChange={(e) => setNewReply(e.target.value)}
                                                                        style={{
                                                                            padding: '8px',
                                                                            border: '1px solid #ccc',
                                                                            borderRadius: '4px',
                                                                            resize: 'vertical',
                                                                            minHeight: '60px'
                                                                        }}
                                                                    />
                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                        <button
                                                                            type="submit"
                                                                            style={{
                                                                                padding: '8px 12px',
                                                                                backgroundColor: '#1976d2',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontWeight: 'bold',
                                                                            }}
                                                                        >
                                                                            Reply
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setReplyingToCommentId(null)}
                                                                            style={{
                                                                                padding: '8px 12px',
                                                                                backgroundColor: '#f44336',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontWeight: 'bold',
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedFileForComments.canReply && (                                                <form onSubmit={addComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                                    <div style={{ marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                                                        Commenting as: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{localStorage.getItem('username') || localStorage.getItem('email')?.split('@')[0] || 'User'}</span>
                                                    </div>
                                                    <textarea
                                                        placeholder="Write your comment..."
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        style={{
                                                            padding: '8px',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '4px',
                                                            resize: 'vertical',
                                                            minHeight: '80px'
                                                        }}
                                                    />
                                                    <button
                                                        type="submit"
                                                        style={{
                                                            padding: '10px',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        Add Comment
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Message input area - only show when viewing messages */}
                                    {!showFiles && !selectedFileForComments && (
                                    <div style={{
                                        padding: '10px',
                                        backgroundColor: '#f0f7ff',
                                        borderTop: '1px solid #ccc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Type your message here..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                border: '1px solid #ccc',
                                                borderRadius: '5px',
                                                outline: 'none',
                                            }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!message.trim()}
                                            style={{
                                                padding: '10px 15px',
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: message.trim() ? 'pointer' : 'not-allowed',
                                                opacity: message.trim() ? 1 : 0.7,
                                            }}
                                        >
                                            Send
                                        </button>
                                    </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ 
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '20px'
                                }}>
                                    <div style={{ textAlign: 'center', color: '#666' }}>
                                        <h2>Select a channel to start chatting</h2>
                                        <p>You can also create a new channel from the left sidebar</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right sidebar - Members */}
                        <div style={{
                            width: '220px',
                            backgroundColor: '#f0f7ff',
                            padding: '20px 15px',
                            overflow: 'auto',
                            position: 'relative' // Added position relative to contain the absolute positioned leave button
                        }}>
                            <h3 style={{ 
                                color: '#1976d2', 
                                textAlign: 'center', 
                                marginBottom: '15px',
                                borderBottom: '2px solid #1976d2',
                                paddingBottom: '10px'
                            }}>
                                Members
                            </h3>
                            
                            {!currentChannel ? (
                                <div style={{ 
                                    padding: '10px',
                                    color: '#666',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    backgroundColor: 'white',
                                    borderRadius: '5px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    Select a channel to see members
                                </div>
                            ) : channelMembers.length === 0 ? (
                                <div style={{ 
                                    padding: '10px',
                                    color: '#666',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    backgroundColor: 'white',
                                    borderRadius: '5px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    Loading members...
                                </div>
                            ) : showingAvailableMembers && allChannelMembers.length > 0 ? (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '10px',
                                    marginBottom: '60px' // Added bottom margin to make space for the fixed leave button
                                }}>
                                    {allChannelMembers.map(member => (
                                        <div key={member._id || member.id} style={{
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '5px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}>
                                            <div>
                                                <div style={{ 
                                                    fontWeight: 'bold', 
                                                    color: '#1976d2',
                                                    fontSize: '15px'
                                                }}>
                                                    {member.username || member.name || member.email.split('@')[0]}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '12px',
                                                    backgroundColor: (() => {
                                                        switch(member.role) {
                                                            case 'creator': return '#e3f2fd';
                                                            case 'admin': return '#e8f5e9';
                                                            case 'moderator': return '#fff3e0';
                                                            default: return '#f5f5f5';
                                                        }
                                                    })(),
                                                    color: (() => {
                                                        switch(member.role) {
                                                            case 'creator': return '#0d47a1';
                                                            case 'admin': return '#1b5e20';
                                                            case 'moderator': return '#e65100';
                                                            default: return '#616161';
                                                        }
                                                    })(),
                                                    padding: '3px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    marginTop: '5px'
                                                }}>
                                                    {member.role}
                                                </div>
                                            </div>
                                            
                                            {/* Show either "Added" status or "Add" button */}
                                            {member.inSubchannel ? (
                                                <div style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#e8f5e9',
                                                    color: '#2e7d32',
                                                    border: '1px solid #c8e6c9',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    fontSize: '13px'
                                                }}>
                                                    Added
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddMemberToSubchannel(member._id || member.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#1976d2',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '10px',
                                    marginBottom: '60px' // Added bottom margin to make space for the fixed leave button
                                }}>
                                    {channelMembers.map(member => {
                                        // Only create interactive elements for the exact matched member
                                        const isExactMatch = selectedMember && 
                                            member.email === selectedMember.email && 
                                            (member.username === selectedMember.username || 
                                             (member.username === undefined && member.email.split('@')[0] === selectedMember.email.split('@')[0]));
                                        
                                        // Regular member display for normal members view
                                        return (
                                            <div key={member._id || member.id}>
                                                {/* Member box - only clickable if we can change roles or kick */}
                                                <div 
                                                    onClick={() => {
                                                        if (member.email === userEmail) return; // Prevent self-modification
                                                        if (canChangeRoles(member.role, member.email) || canKickMember(member.role, member.email)) {
                                                            // Only set selectedMember for the exact member being clicked
                                                            setSelectedMember(member);
                                                        }
                                                    }}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        borderRadius: isExactMatch ? '8px 8px 0 0' : '8px',
                                                        padding: '10px',
                                                        cursor: (canChangeRoles(member.role, member.email) || canKickMember(member.role, member.email)) && 
                                                               member.email !== userEmail ? 'pointer' : 'default',
                                                        boxShadow: isExactMatch ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                                                        border: isExactMatch ? '1px solid #e0e0e0' : '1px solid #e0e0e0',
                                                        borderBottom: isExactMatch ? 'none' : '1px solid #e0e0e0',
                                                        position: 'relative',
                                                        transform: isExactMatch ? 'scale(1.02)' : 'scale(1)',
                                                    }}
                                                >
                                                    {/* Username at top */}
                                                    <div style={{ 
                                                        fontWeight: 'bold', 
                                                        color: '#1976d2',
                                                        marginBottom: '12px',
                                                        fontSize: '15px',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {member.username || member.email.split('@')[0]}
                                                        {member.email === userEmail && ' (You)'}
                                                    </div>
                                                    
                                                    {/* Bottom row with role and online status */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        {/* Role at bottom left */}
                                                        <div style={{ 
                                                            fontSize: '12px',
                                                            backgroundColor: (() => {
                                                                switch(member.role) {
                                                                    case 'creator': return '#e3f2fd';
                                                                    case 'admin': return '#e8f5e9';
                                                                    case 'moderator': return '#fff3e0';
                                                                    default: return '#f5f5f5';
                                                                }
                                                            })(),
                                                            color: (() => {
                                                                switch(member.role) {
                                                                    case 'creator': return '#0d47a1';
                                                                    case 'admin': return '#1b5e20';
                                                                    case 'moderator': return '#e65100';
                                                                    default: return '#616161';
                                                                }
                                                            })(),
                                                            padding: '3px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {member.role}
                                                        </div>
                                                        
                                                        {/* Online status at bottom right */}
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>                                                            <div style={{ 
                                                                width: '8px', 
                                                                height: '8px', 
                                                                borderRadius: '50%', 
                                                                backgroundColor: onlineUsers.includes(member.email) ? '#4CAF50' : '#bdbdbd',
                                                                boxShadow: onlineUsers.includes(member.email) ? '0 0 4px #4CAF50' : 'none',
                                                                transition: 'background-color 0.3s ease'
                                                            }} />
                                                            <span style={{ 
                                                                fontSize: '12px',
                                                                color: onlineUsers.includes(member.email) ? '#4CAF50' : '#bdbdbd',
                                                                fontWeight: onlineUsers.includes(member.email) ? 'bold' : 'normal',
                                                                transition: 'color 0.3s ease'
                                                            }}>
                                                                {onlineUsers.includes(member.email) ? 'Online' : 'Offline'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Role management options - Only rendered for the exact matched member */}
                                                {isExactMatch && (
                                                    <div style={{
                                                        backgroundColor: 'white',
                                                        borderRadius: '0 0 8px 8px',
                                                        padding: '10px',
                                                        marginTop: '1px',
                                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {canChangeRoles(member.role, member.email) && (
                                                            <div style={{ marginBottom: '10px' }}>
                                                                <div style={{ 
                                                                    fontSize: '12px', 
                                                                    fontWeight: 'bold', 
                                                                    marginBottom: '5px',
                                                                    color: '#1976d2'
                                                                }}>
                                                                    Change Role:
                                                                </div>
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    flexWrap: 'wrap', 
                                                                    gap: '5px' 
                                                                }}>
                                                                    {getAvailableRoles().map(role => (
                                                                        <button
                                                                            key={role}
                                                                            onClick={() => handleRoleChange(
                                                                                member._id || member.id, 
                                                                                member.email, 
                                                                                role
                                                                            )}
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                backgroundColor: member.role === role ? '#bbdefb' : '#e3f2fd',
                                                                                color: '#1976d2',
                                                                                border: member.role === role ? '1px solid #1976d2' : '1px solid #e3f2fd',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '12px'
                                                                            }}
                                                                        >
                                                                            {role}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {canKickMember(member.role, member.email) && (
                                                            <button
                                                                onClick={() => handleKickMember(
                                                                    member._id || member.id, 
                                                                    member.email
                                                                )}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '6px',
                                                                    backgroundColor: '#ffebee',
                                                                    color: '#d32f2f',
                                                                    border: '1px solid #ffcdd2',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                        
                                                        <button
                                                            onClick={() => setSelectedMember(null)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '6px',
                                                                backgroundColor: '#f5f5f5',
                                                                color: '#757575',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                marginTop: '5px'
                                                            }}
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Leave and Delete buttons - fixed position at bottom center */}
                            {currentChannel && (
                                <div style={{ 
                                    position: 'absolute',
                                    bottom: '15px',
                                    left: '0',
                                    right: '0',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: '0 15px',
                                    gap: '10px'
                                }}>
                                    {/* Only show delete button to creators and admins */}
                                    {['creator', 'admin'].includes(currentUserRole) && (
                                        <button
                                            onClick={() => {
                                                if (currentSubchannel) {
                                                    handleDeleteSubchannel(currentSubchannel.id, currentSubchannel.name);
                                                } else {
                                                    handleDeleteChannel();
                                                }
                                            }}
                                            style={{ 
                                                padding: '8px 16px', 
                                                backgroundColor: '#d32f2f', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                width: '100%', // Make button take full width of container
                                                maxWidth: '150px' // Limit maximum width for better appearance
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (currentSubchannel) {
                                                handleLeaveSubchannel(currentSubchannel.id, currentSubchannel.name);
                                            } else {
                                                handleLeaveChannel();
                                            }
                                        }}
                                        style={{ 
                                            padding: '8px 16px', 
                                            backgroundColor: '#f44336', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            width: '100%', // Make button take full width of container
                                            maxWidth: '150px' // Limit maximum width for better appearance
                                        }}
                                    >
                                        Leave
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                
                {content !== 'create-channel' && content !== 'browse-channels' && (
                    <div style={{ 
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        padding: '20px'
                    }}>
                        <h2 style={{ color: '#1976d2', marginBottom: '10px' }}>Welcome to Perform 5</h2>
                        <p style={{ textAlign: 'center', maxWidth: '600px', lineHeight: '1.6', color: '#666' }}>
                            {content}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;