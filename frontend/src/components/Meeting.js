import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JoinClass from './JoinClass';
import VirtualClassroom from './VirtualClassroom';

const Meeting = () => {
  const [activeMeeting, setActiveMeeting] = useState('join');
  const navigate = useNavigate();

  const handleNavigation = (nav) => {
    if (nav === 'home') {
      navigate('/dashboard');
    } else if (nav === 'create') {
      navigate('/dashboard?section=create');
    } else if (nav === 'browse') {
      navigate('/dashboard?section=browse');
    } else if (nav === 'assessment') {
      navigate('/assessment');
    } else if (nav === 'evaluation') {
      navigate('/evaluation');
    } else if (nav === 'meeting') {
      navigate('/meeting');
    } else if (nav === 'logout') {
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  let content;
  if (activeMeeting === 'join') content = <JoinClass />;
  else if (activeMeeting === 'virtual') content = <VirtualClassroom />;
  else content = (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Logo" style={{ width: 120, marginBottom: 30 }} />
      <h2>Coming Soon</h2>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial', overflow: 'hidden' }}>
      {/* Left Navigation Bar */}
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
        <button
          onClick={() => handleNavigation('home')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/home.png" alt="Dashboard" style={{ width: '40px', height: '40px' }} />
        </button>
        <button
          onClick={() => handleNavigation('assessment')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/assesment.png" alt="Assessment" style={{ width: '40px', height: '40px' }} />
        </button>
        <button
          onClick={() => handleNavigation('evaluation')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/evaluation.png" alt="Evaluation" style={{ width: '40px', height: '40px' }} />
        </button>
        <button
          onClick={() => handleNavigation('create')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/createChannel.png" alt="Create Channel" style={{ width: '40px', height: '40px' }} />
        </button>
        <button
          onClick={() => handleNavigation('browse')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/browseChannel.png" alt="Browse Channel" style={{ width: '40px', height: '40px' }} />
        </button>
        <button
          onClick={() => handleNavigation('meeting')}
          style={{
            border: 'none',
            backgroundColor: '#d1e3fa',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/meeting.png" alt="Meeting" style={{ width: '40px', height: '40px' }} />
        </button>
        <button
          onClick={() => handleNavigation('logout')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            marginTop: 'auto',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <img src="/logout.png" alt="Logout" style={{ width: '40px', height: '40px' }} />
        </button>
      </div>
      {/* Meeting Options Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '15px', backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
          Meeting Options
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          <div
            onClick={() => setActiveMeeting('join')}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: activeMeeting === 'join' ? '#d1e3fa' : 'white',
              borderRadius: '4px',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Join Class</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Join a live video class session
            </div>
          </div>
          <div
            onClick={() => setActiveMeeting('virtual')}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: activeMeeting === 'virtual' ? '#d1e3fa' : 'white',
              borderRadius: '4px',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Virtual Classroom</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Start or join a virtual classroom
            </div>
          </div>
        </div>
      </div>      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#f5f9ff', 
        padding: activeMeeting === 'virtual' ? '0' : '20px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {content}
      </div>
    </div>
  );
};

export default Meeting;
