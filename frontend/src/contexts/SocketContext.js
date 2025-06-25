import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsersMap, setOnlineUsersMap] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]); // Array of online user emails
    const [roleUpdate, setRoleUpdate] = useState(null); // State to track role updates
    const pingIntervalRef = useRef(null);

    // Convert onlineUsersMap to array whenever it changes
    useEffect(() => {
        const onlineUserEmails = Object.entries(onlineUsersMap)
            .filter(([_, status]) => status === 'online')
            .map(([email]) => email);
        
        setOnlineUsers(onlineUserEmails);
        console.log('Online users updated:', onlineUserEmails);
    }, [onlineUsersMap]);

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        
        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected:', newSocket.id);
            
            // Request current online users when connecting
            newSocket.emit('getOnlineUsers');
            
            // Add current user to online users if they're logged in
            const email = localStorage.getItem('email');
            if (email) {
                newSocket.emit('userOnline', { email });
                // Immediately update local state to show current user as online
                setOnlineUsersMap(prev => ({
                    ...prev,
                    [email]: 'online'
                }));
                
                // Set up periodic ping to keep online status current
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
                pingIntervalRef.current = setInterval(() => {
                    if (newSocket.connected) {
                        newSocket.emit('ping', { email });
                    }
                }, 30000); // Ping every 30 seconds
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
        });
        
        // Listen for user status updates
        newSocket.on('userStatusUpdate', (userData) => {
            console.log('User status update received:', userData);
            setOnlineUsersMap(prev => ({
                ...prev,
                [userData.email]: userData.status
            }));
        });
        
        // Listen for initial online users list
        newSocket.on('onlineUsersList', (users) => {
            console.log('Received online users list:', users);
            const usersMap = {};
            users.forEach(user => {
                usersMap[user.email] = user.status;
            });
            
            // Make sure current user always shows as online in the local state
            const currentUserEmail = localStorage.getItem('email');
            if (currentUserEmail) {
                usersMap[currentUserEmail] = 'online';
                
                // Also ensure we update the database with our online status
                newSocket.emit('userOnline', { email: currentUserEmail });
            }
            
            setOnlineUsersMap(usersMap);
        });

        // Listen for user online event
        newSocket.on('userConnected', (userData) => {
            console.log('User connected:', userData);
            setOnlineUsersMap(prev => ({
                ...prev,
                [userData.email]: 'online'
            }));
        });

        // Listen for user offline event
        newSocket.on('userDisconnected', (userData) => {
            console.log('User disconnected:', userData);
            setOnlineUsersMap(prev => ({
                ...prev,
                [userData.email]: 'offline'
            }));
        });

        // Listen for member role updates
        newSocket.on('memberRoleUpdate', (updateData) => {
            console.log('Member role update received:', updateData);
            setRoleUpdate(updateData);
        });

        setSocket(newSocket);

        // Clean up on unmount
        return () => {
            const email = localStorage.getItem('email');
            if (email && newSocket.connected) {
                newSocket.emit('userOffline', { email });
            }
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
            newSocket.disconnect();
        };
    }, []);

    // Reset role update after it's been consumed
    const clearRoleUpdate = () => {
        setRoleUpdate(null);
    };

    return (
        <SocketContext.Provider value={{ 
            socket, 
            isConnected, 
            onlineUsers, 
            roleUpdate, 
            clearRoleUpdate 
        }}>
            {children}
        </SocketContext.Provider>
    );
};