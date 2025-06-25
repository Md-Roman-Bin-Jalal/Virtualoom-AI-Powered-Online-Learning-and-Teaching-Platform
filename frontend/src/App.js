import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Invite from './components/Invite';
import Assessment from './components/asssesment';
import Evaluation from './components/evaluation';
import QuizAIAssessment from './components/QuizAIAssessment';
import Meeting from './components/Meeting';
import { SocketProvider } from './contexts/SocketContext';

function App() {
    return (
        <SocketProvider>
            <Router>
                <Routes>
                    {/* Redirect from "/" to "/login" */}
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/invite/:inviteCode" element={<Invite />} />
                    <Route path="/assessment" element={<Assessment />} />
                    <Route path="/evaluation" element={<Evaluation />} />
                    <Route path="/quizai" element={<QuizAIAssessment />} />
                    <Route path="/meeting" element={<Meeting />} />
                </Routes>
            </Router>
        </SocketProvider>
    );
}

export default App;