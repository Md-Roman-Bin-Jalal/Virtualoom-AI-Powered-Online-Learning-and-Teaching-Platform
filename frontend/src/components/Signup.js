import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (data.success) {
                console.log('Signup successful:', data.message); // Log success message
                navigate('/login'); // Redirect to login after signup
            } else {
                console.log('Signup failed:', data.message || 'An error occurred.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
            <h1 style={{ color: 'blue' }}>Signup</h1>
            <form onSubmit={handleSubmit} style={{ margin: '20px auto', width: '300px' }}>
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    minLength="1"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
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
                    Signup
                </button>
            </form>
        </div>
    );
};

export default Signup;