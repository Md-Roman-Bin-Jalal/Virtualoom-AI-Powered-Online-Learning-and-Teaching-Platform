import React, { useEffect, useRef, useState } from 'react';

const VirtualClassroom = () => {
  const jitsiRef = useRef(null);
  const apiRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [roomName] = useState(`performclass_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    function loadJitsiScript() {
      return new Promise((resolve) => {
        if (window.JitsiMeetExternalAPI) {
          setIsScriptLoaded(true);
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve();
        };
        document.body.appendChild(script);
      });
    }

    if (!isScriptLoaded) {
      loadJitsiScript();
    }

    return () => {
      if (apiRef.current) {
        console.log('Disposing Jitsi instance');
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, []); // Only run once on mount

  useEffect(() => {
    if (!isScriptLoaded || !jitsiRef.current || apiRef.current) return;

    console.log('Initializing Jitsi instance');
    const domain = 'meet.jit.si';
    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiRef.current,
      userInfo: {
        displayName: localStorage.getItem('username') || 'Student1',
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        disableModeratorIndicator: true,
        enableLobbyChat: false,
        enableLobby: false,
        requireDisplayName: false,
        enableClosePage: false,
        disable1On1Mode: true,
        openBridgeChannel: 'websocket',
        p2p: {
          enabled: true
        }
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'chat', 'recording', 'raisehand',
          'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
          'tileview', 'participants-pane', 'security'
        ],
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'sounds'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Student',
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        DISABLE_PRESENCE_STATUS: true,
        MOBILE_APP_PROMO: false,
        ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 3000
      }
    };

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      
      // Add event handlers
      apiRef.current.addEventListeners({
        readyToClose: () => {
          console.log('Meeting closed');
        },
        participantJoined: (participant) => {
          console.log('Participant joined:', participant);
        },
        videoConferenceJoined: (participant) => {
          console.log('Joined meeting as:', participant);
        },
        participantLeft: (participant) => {
          console.log('Participant left:', participant);
        }
      });
      
      // Force participants to start without waiting for moderator
      apiRef.current.executeCommand('toggleLobby', false);
    } catch (error) {
      console.error('Error initializing Jitsi:', error);
    }
  }, [isScriptLoaded, roomName]); // Include roomName in dependencies

  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 16px',
        background: 'rgba(25, 118, 210, 0.1)',
        backdropFilter: 'blur(4px)',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ 
          margin: 0,
          color: '#1976d2',
          fontSize: '1.25rem'
        }}>Virtual Classroom</h2>
        <div style={{
          fontSize: '0.875rem',
          color: '#666'
        }}>
          Room ID: {roomName}
        </div>
      </div>
      <div ref={jitsiRef} style={{ 
        flex: 1,
        width: '100%',
        minHeight: 0,
        marginTop: '48px'
      }}></div>
    </div>
  );
};

export default VirtualClassroom;
