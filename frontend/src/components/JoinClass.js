import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinClass = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!name || !room || !password) {
      alert("Please fill in all fields");
      return;
    }
    if (password !== '1234') {
      alert("Invalid password");
      return;
    }
    localStorage.setItem('v_user', name);
    localStorage.setItem('v_room', room);
    navigate('/video');
  };

  return (
    <div className="page-container">
      <h2 className="page-title">🔐 Join a Video Class</h2>
      <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
      <br />
      <input type="text" placeholder="Class Room ID" value={room} onChange={(e) => setRoom(e.target.value)} className="input-field" />
      <br />
      <input type="password" placeholder="Class Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
      <br />
      <button onClick={handleJoin} className="join-btn">Join</button>
    </div>
  );
};

export default JoinClass;
