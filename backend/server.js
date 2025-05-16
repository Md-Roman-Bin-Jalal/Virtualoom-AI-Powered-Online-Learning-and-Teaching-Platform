const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');
const fileRoutes = require('./routes/fileRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const writingManualRoutes = require('./routes/writingManualRoutes');
const codingManualRoutes = require('./routes/codingManualRoutes');
const quizManualRoutes = require('./routes/quizManualRoutes');
const writingAIRoutes = require('./routes/writingAIRoutes');
const codingAIRoutes = require('./routes/codingAIRoutes');
const quizAIRoutes = require('./routes/quizAIRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const User = require('./models/User'); // Add User model import
const Channel = require('./models/Channel'); // Add Channel model import
const Message = require('./models/Message'); // Add Message model import

// Check if required API keys are in environment
if (!process.env.OPENROUTER_API_KEY) {
    console.error('WARNING: OPENROUTER_API_KEY not found in environment variables. Quiz generation will not work.');
}

if (!process.env.GEMINI_API_KEY) {
    console.error('WARNING: GEMINI_API_KEY not found in environment variables. AI features will not work.');
}

const app = express();

// Configure CORS with more specific options
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
}));

// Apply our custom enhanced CORS middleware for additional protection
const corsMiddleware = require('./middlewares/corsMiddleware');
app.use(corsMiddleware);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost'],
        methods: ['GET', 'POST'],
    },
});

// Make io instance available to our routes
app.set('io', io);

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/perform5';
const connectToDatabase = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
        
        // Clean up any existing duplicate members in channels
        await cleanupDuplicateMembers();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1); // Exit the process if the database connection fails
    }
};
connectToDatabase();

// Function to clean up duplicate members in all channels
const cleanupDuplicateMembers = async () => {
    try {
        console.log('Starting cleanup of duplicate channel members...');
        const channels = await Channel.find({});
        let duplicatesFixed = 0;
        
        for (const channel of channels) {
            // Check if channel has duplicate members
            const memberIds = channel.members.map(m => m.user?.toString());
            const uniqueIds = new Set(memberIds.filter(id => id)); // Filter out undefined values
            
            if (uniqueIds.size < memberIds.filter(id => id).length) {
                // Channel has duplicates, clean them up
                channel.removeDuplicateMembers();
                await channel.save();
                duplicatesFixed++;
            }
        }
        
        console.log(`Duplicate member cleanup complete. Fixed ${duplicatesFixed} channels.`);
    } catch (error) {
        console.error('Error cleaning up duplicate members:', error);
    }
};

// Socket.IO connection
let onlineChatUsers = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    let userEmail = '';

    // Track user's online status
    socket.on('userOnline', async (data) => {
        console.log(`User online: ${data.email}`);
        userEmail = data.email;
        
        // Update user status in database
        try {
            await User.findOneAndUpdate(
                { email: data.email },
                { status: 'online' }
            );
            console.log(`Updated ${data.email} status to online in database`);
              // Broadcast user status to all clients
            io.emit('userStatusUpdate', {
                email: data.email,
                status: 'online'
            });
            
            // Also emit the userConnected event for compatibility
            io.emit('userConnected', {
                email: data.email
            });
        } catch (error) {
            console.error(`Error updating user status to online: ${error.message}`);
        }
    });
    
    socket.on('userOffline', async (data) => {
        console.log(`User offline: ${data.email}`);
        
        // Update user status in database
        try {
            await User.findOneAndUpdate(
                { email: data.email },
                { status: 'offline' }
            );
            console.log(`Updated ${data.email} status to offline in database`);
              // Broadcast user status to all clients
            io.emit('userStatusUpdate', {
                email: data.email,
                status: 'offline'
            });
            
            // Also emit the userDisconnected event for compatibility
            io.emit('userDisconnected', {
                email: data.email
            });
        } catch (error) {
            console.error(`Error updating user status to offline: ${error.message}`);
        }
    });

    // Handle ping to keep online status current
    socket.on('ping', async (data) => {
        if (data.email) {
            userEmail = data.email;
            
            try {
                // Update last activity timestamp
                await User.findOneAndUpdate(
                    { email: data.email },
                    { 
                        status: 'online',
                        lastActivityAt: new Date()
                    }
                );
                
                // We don't need to broadcast for pings to reduce network traffic
            } catch (error) {
                console.error(`Error updating user's last activity: ${error.message}`);
            }
        }
    });    // Get online users
    socket.on('getOnlineUsers', async () => {
        try {
            // Set users inactive for more than 5 minutes to offline
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            await User.updateMany(
                { 
                    status: 'online',
                    lastActivityAt: { $lt: fiveMinutesAgo }
                },
                { status: 'offline' }
            );
            
            // Get all users with their status
            const users = await User.find({}, 'email status lastActivityAt');
            // Send the list to the requesting client
            socket.emit('onlineUsersList', users);
            console.log('Sent online users list to client');
        } catch (error) {
            console.error(`Error fetching online users: ${error.message}`);
        }
    });

    // Join a channel room
    socket.on('joinChannel', (channelId) => {
        socket.join(channelId);
        console.log(`User ${socket.id} joined channel: ${channelId}`);
    });

    // Join a subchannel room
    socket.on('joinSubchannel', (data) => {
        const subchannelRoom = `${data.channelId}-${data.subchannelId}`;
        socket.join(subchannelRoom);
        console.log(`User ${socket.id} joined subchannel room: ${subchannelRoom}`);
    });    // Send message to a specific channel
    socket.on('sendMessage', async (data) => {
        console.log('Received message via socket:', data);
        
        // Broadcast the message to all users in the channel
        io.to(data.channelId).emit('message', {
            senderName: data.senderName,
            senderRole: data.senderRole,
            content: data.content,
            timestamp: data.timestamp || new Date().toLocaleString()
        });
        
        // Check if this is a bot message
        if (data.content && data.content.trim().toLowerCase().startsWith('@bot')) {
            try {
                // Make request to bot processing endpoint
                const axios = require('axios');
                const response = await axios.post('http://localhost:5000/api/chatbot/process', {
                    channelId: data.channelId,
                    content: data.content,
                    senderName: data.senderName
                });
                
                if (response.data.success) {
                    console.log('Bot response processed successfully');
                    // No need to emit here as the controller already handles emitting the bot response
                }
            } catch (error) {
                console.error('Error processing bot message:', error.message);
                // Send error message from bot
                io.to(data.channelId).emit('message', {
                    senderName: 'Bot',
                    senderRole: 'bot',
                    content: 'Sorry, I had trouble processing that request.',
                    timestamp: new Date().toLocaleString()
                });
            }
        }
    });    // Send message to a specific subchannel
    socket.on('sendSubchannelMessage', async (data) => {
        console.log('Received subchannel message via socket:', data);
        
        // Create a room identifier for this subchannel
        const subchannelRoom = `${data.channelId}-${data.subchannelId}`;
        
        // Broadcast the message to all users in the subchannel room
        io.to(subchannelRoom).emit('subchannelMessage', {
            senderName: data.senderName,
            senderRole: data.senderRole,
            content: data.content,
            timestamp: data.timestamp || new Date().toLocaleString()
        });
        
        // Check if this is a bot message
        if (data.content && data.content.trim().toLowerCase().startsWith('@bot')) {
            try {
                // Make request to bot processing endpoint
                const axios = require('axios');
                const response = await axios.post('http://localhost:5000/api/chatbot/process', {
                    channelId: data.channelId,
                    subchannelId: data.subchannelId,
                    content: data.content,
                    senderName: data.senderName
                });
                
                if (response.data.success) {
                    console.log('Bot response processed successfully');
                    // No need to emit here as the controller already handles emitting the bot response
                }
            } catch (error) {
                console.error('Error processing bot message:', error.message);
                // Send error message from bot
                io.to(subchannelRoom).emit('subchannelMessage', {
                    senderName: 'Bot',
                    senderRole: 'bot',
                    content: 'Sorry, I had trouble processing that request.',
                    timestamp: new Date().toLocaleString()
                });
            }
        }
    });

    // --- Chat/Meeting Events ---
    socket.on('join-room', async ({ username, room }) => {
        socket.username = username;
        socket.room = room;
        onlineChatUsers[socket.id] = username;
        // Broadcast updated user list for chat
        io.emit('user-list', Object.values(onlineChatUsers));
        // Send last 10 public messages for chat
        const messages = await Message.find({ receiver: null })
            .sort({ timestamp: -1 })
            .limit(10)
            .exec();
        socket.emit('previous-messages', messages.reverse());
        // Notify others
        const joinMsg = {
            sender: 'System',
            content: `${username} joined the chat.`,
            timestamp: new Date(),
        };
        io.emit('public-message', joinMsg);
    });

    socket.on('public-message', async (msg) => {
        const message = new Message({
            sender: msg.sender,
            content: msg.content,
        });
        await message.save();
        io.emit('public-message', message);
    });

    socket.on('private-message', async ({ toUsername, content }) => {
        const toSocketId = Object.keys(onlineChatUsers).find(
            (key) => onlineChatUsers[key] === toUsername
        );
        if (toSocketId) {
            const message = new Message({
                sender: socket.username,
                receiver: toUsername,
                content,
            });
            await message.save();
            io.to(toSocketId).emit('private-message', message);
            socket.emit('private-message', message); // Echo back to sender
        }
    });

    socket.on('typing', ({ toUsername }) => {
        const toSocketId = Object.keys(onlineChatUsers).find(
            (key) => onlineChatUsers[key] === toUsername
        );
        if (toSocketId) {
            io.to(toSocketId).emit('typing', { from: socket.username });
        }
    });

    socket.on('stop-typing', ({ toUsername }) => {
        const toSocketId = Object.keys(onlineChatUsers).find(
            (key) => onlineChatUsers[key] === toUsername
        );
        if (toSocketId) {
            io.to(toSocketId).emit('stop-typing', { from: socket.username });
        }
    });

    socket.on('disconnect', async () => {
        console.log('A user disconnected:', socket.id);
        
        // When user disconnects, update database and broadcast offline status if we have their email
        if (userEmail) {
            try {
                await User.findOneAndUpdate(
                    { email: userEmail },
                    { status: 'offline' }
                );
                console.log(`Updated ${userEmail} status to offline in database on disconnect`);
                  io.emit('userStatusUpdate', {
                    email: userEmail,
                    status: 'offline'
                });
                
                // Also emit the userDisconnected event for compatibility
                io.emit('userDisconnected', {
                    email: userEmail
                });
            } catch (error) {
                console.error(`Error updating user status to offline on disconnect: ${error.message}`);
            }
        }

        // Chat/Meeting user list update
        const username = onlineChatUsers[socket.id];
        delete onlineChatUsers[socket.id];
        io.emit('user-list', Object.values(onlineChatUsers));
        if (username) {
            const leaveMsg = {
                sender: 'System',
                content: `${username} left the chat.`,
                timestamp: new Date(),
            };
            io.emit('public-message', leaveMsg);
        }
    });
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    exposedHeaders: ['Content-Length', 'X-Content-Length']
}));

// Increase request size limit and timeout
app.use(express.json({ limit: '10mb' })); // Parse incoming JSON requests with increased limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set longer timeout for API requests (2 minutes)
server.timeout = 120000; // 2 minutes

// Serve static files from the public directory
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/writing-manual', writingManualRoutes);
app.use('/api/coding-manual', codingManualRoutes);
app.use('/api/quiz-manual', quizManualRoutes);
app.use('/api/writing-ai', writingAIRoutes);
app.use('/api/coding-ai', codingAIRoutes);
app.use('/api/quiz-ai', quizAIRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Server is running with Socket.IO and Authentication');
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});