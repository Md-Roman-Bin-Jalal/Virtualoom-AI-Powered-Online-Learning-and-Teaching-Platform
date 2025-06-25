import React, { useState } from 'react';
import axios from 'axios';

const CodingAIAssessment = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [assessment, setAssessment] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        timeLimit: 45,
        email: '',
        expiresIn: 7,
        expiryUnit: 'day',
        difficulty: 'moderate',
        programmingLanguage: 'JavaScript',
        topic: '',
        points: 10
    });

    const programmingLanguages = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 
        'PHP', 'Swift', 'Kotlin', 'TypeScript', 'Rust'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        // Convert numeric fields
        if (name === 'timeLimit' || name === 'points' || name === 'expiresIn') {
            processedValue = Number(value);
        }
        
        setFormData({
            ...formData,
            [name]: processedValue
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError('');
          try {            console.log('Sending data to server:', formData);
            // Ensure the URL is correctly pointing to the API endpoint
            const response = await axios.post('http://localhost:5000/api/coding-ai/create', formData);
            setSuccess(true);
            setAssessment(response.data.assessment);
            console.log('Assessment created:', response.data);
        } catch (err) {
            console.error('Full error object:', err);
            const errorMsg = err.response?.data?.message || 'An error occurred while creating the assessment';
            setError(`Error: ${errorMsg}. Status: ${err.response?.status || 'unknown'}`);
            console.error('Error creating assessment:', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Create AI Coding Assessment</h2>
            
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="alert alert-success" role="alert">
                    Assessment created successfully!
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Assessment Title</label>
                    <input
                        type="text"
                        className="form-control"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Your Email</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="row mb-3">
                    <div className="col">
                        <label htmlFor="timeLimit" className="form-label">Time Limit (minutes)</label>
                        <input
                            type="number"
                            className="form-control"
                            id="timeLimit"
                            name="timeLimit"
                            value={formData.timeLimit}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>
                    
                    <div className="col">
                        <label htmlFor="points" className="form-label">Points</label>
                        <input
                            type="number"
                            className="form-control"
                            id="points"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>
                </div>
                
                <div className="row mb-3">
                    <div className="col">
                        <label htmlFor="difficulty" className="form-label">Difficulty</label>
                        <select
                            className="form-select"
                            id="difficulty"
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            required
                        >
                            <option value="easy">Easy</option>
                            <option value="moderate">Moderate</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    
                    <div className="col">
                        <label htmlFor="programmingLanguage" className="form-label">Programming Language</label>
                        <select
                            className="form-select"
                            id="programmingLanguage"
                            name="programmingLanguage"
                            value={formData.programmingLanguage}
                            onChange={handleChange}
                            required
                        >
                            {programmingLanguages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="row mb-3">
                    <div className="col">
                        <label htmlFor="expiresIn" className="form-label">Expires In</label>
                        <input
                            type="number"
                            className="form-control"
                            id="expiresIn"
                            name="expiresIn"
                            value={formData.expiresIn}
                            onChange={handleChange}
                            min="1"
                        />
                    </div>
                    
                    <div className="col">
                        <label htmlFor="expiryUnit" className="form-label">Expiry Unit</label>
                        <select
                            className="form-select"
                            id="expiryUnit"
                            name="expiryUnit"
                            value={formData.expiryUnit}
                            onChange={handleChange}
                        >
                            <option value="hour">Hours</option>
                            <option value="day">Days</option>
                            <option value="week">Weeks</option>
                        </select>
                    </div>
                </div>
                
                <div className="mb-3">
                    <label htmlFor="topic" className="form-label">Topic</label>
                    <input
                        type="text"
                        className="form-control"
                        id="topic"
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        required
                    />
                    <div className="form-text">Enter a specific coding problem topic (e.g., "Array sorting algorithm", "Binary search tree implementation")</div>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate AI Coding Assessment'}
                </button>
            </form>
            
            {assessment && (
                <div className="mt-4">
                    <h3>Generated Assessment</h3>
                    <div className="card">
                        <div className="card-header">
                            <h4>{assessment.title}</h4>
                        </div>
                        <div className="card-body">
                            {assessment.questions && assessment.questions.length > 0 && (
                                <div>
                                    <h5>Question</h5>
                                    <p><strong>{assessment.questions[0].questionText}</strong></p>
                                    
                                    <h5>Problem Description</h5>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {assessment.questions[0].problemDescription}
                                    </div>
                                    
                                    {assessment.questions[0].starterCode && (
                                        <>
                                            <h5>Starter Code</h5>
                                            <pre className="bg-light p-3 rounded">
                                                <code>{assessment.questions[0].starterCode}</code>
                                            </pre>
                                        </>
                                    )}
                                    
                                    <h5>Expected Output</h5>
                                    <pre className="bg-light p-3 rounded">
                                        <code>{assessment.questions[0].expectedOutput}</code>
                                    </pre>
                                    
                                    <p>
                                        <strong>Difficulty:</strong> {assessment.questions[0].difficulty} | 
                                        <strong> Language:</strong> {assessment.questions[0].programmingLanguage} | 
                                        <strong> Points:</strong> {assessment.questions[0].points}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="card-footer text-muted">
                            Time Limit: {assessment.timeLimit} minutes | Created by: {assessment.createdBy}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodingAIAssessment;
