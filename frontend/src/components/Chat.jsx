import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Adjust if using different port or proxy

function ChatPage({ username, room }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [toUsername, setToUsername] = useState('');

  useEffect(() => {
    socket.emit('join-room', { username, room });

    socket.on('previous-messages', (msgs) => setMessages(msgs));
    socket.on('public-message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('private-message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('user-list', (users) => setUsers(users));
    socket.on('typing', ({ from }) => {
      if (!typingUsers.includes(from)) {
        setTypingUsers((prev) => [...prev, from]);
      }
    });
    socket.on('stop-typing', ({ from }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== from));
    });

    return () => socket.disconnect();
  }, [username, room]);

  const sendMessage = () => {
    if (!message) return;
    if (toUsername) {
      socket.emit('private-message', { toUsername, content: message });
    } else {
      socket.emit('public-message', { sender: username, content: message });
    }
    setMessage('');
    socket.emit('stop-typing', { toUsername });
  };

  const handleTyping = () => {
    socket.emit('typing', { toUsername });
  };

  const handleStopTyping = () => {
    socket.emit('stop-typing', { toUsername });
  };

  // ...render logic here (omitted for brevity)...
  return <div>Chat Component (UI omitted for brevity)</div>;
}

export default ChatPage;
