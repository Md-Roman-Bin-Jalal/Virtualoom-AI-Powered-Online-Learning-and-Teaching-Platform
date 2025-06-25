import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const { socket } = useSocket();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (data.success) {
                console.log('Login successful:', data.message); // Log success message
                localStorage.setItem('username', data.username); // Store username
                localStorage.setItem('email', form.email); // Store email for future use
                localStorage.setItem('token', data.token); // Store authentication token
                
                // Emit socket event to mark user as online
                if (socket) {
                    socket.emit('userOnline', { email: form.email });
                    console.log('Emitted userOnline event');
                } else {
                    console.warn('Socket not available to emit online status');
                }
                
                navigate('/dashboard'); // Redirect to dashboard
            } else {
                console.log('Login failed:', data.message || 'An error occurred.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSignupRedirect = () => {
        navigate('/signup'); // Redirect to signup page
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
            <h1 style={{ color: 'blue' }}>Login</h1>
            <form onSubmit={handleSubmit} style={{ margin: '20px auto', width: '300px' }}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    minLength="3"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    minLength="3"
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'blue',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Login
                </button>
            </form>
            <button
                onClick={handleSignupRedirect}
                style={{
                    marginTop: '20px',
                    padding: '10px',
                    backgroundColor: 'white',
                    color: 'blue',
                    border: '1px solid blue',
                    cursor: 'pointer',
                }}
            >
                Signup
            </button>
        </div>
    );
};

export default Login;