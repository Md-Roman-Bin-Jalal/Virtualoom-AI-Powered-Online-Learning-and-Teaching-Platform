import React, { useState } from 'react';
import axios from 'axios';

const WritingAIAssessment = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [assessment, setAssessment] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        timeLimit: 60,
        email: '',
        expiresIn: 7,
        expiryUnit: 'day',
        difficulty: 'moderate',
        writingType: 'essay',
        topic: '',
        wordLimit: 500,
        points: 10,
        instructions: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        // Convert numeric fields
        if (name === 'timeLimit' || name === 'wordLimit' || name === 'points' || name === 'expiresIn') {
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
            const response = await axios.post('http://localhost:5000/api/writing-ai/create', formData);
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
            <h2>Create AI Writing Assessment</h2>
            
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
                        <label htmlFor="wordLimit" className="form-label">Word Limit</label>
                        <input
                            type="number"
                            className="form-control"
                            id="wordLimit"
                            name="wordLimit"
                            value={formData.wordLimit}
                            onChange={handleChange}
                            min="50"
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
                        <label htmlFor="writingType" className="form-label">Writing Type</label>
                        <select
                            className="form-select"
                            id="writingType"
                            name="writingType"
                            value={formData.writingType}
                            onChange={handleChange}
                            required
                        >
                            <option value="essay">Essay</option>
                            <option value="short-answer">Short Answer</option>
                            <option value="technical-document">Technical Document</option>
                            <option value="creative-writing">Creative Writing</option>
                            <option value="analysis">Analysis</option>
                            <option value="research-paper">Research Paper</option>
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
                    <div className="form-text">Enter a specific topic for the AI to generate a writing prompt about</div>
                </div>
                
                <div className="mb-3">
                    <label htmlFor="instructions" className="form-label">Additional Instructions (Optional)</label>
                    <textarea
                        className="form-control"
                        id="instructions"
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleChange}
                        rows="3"
                    ></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate AI Writing Assessment'}
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
                                    <h5>Prompt</h5>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {assessment.questions[0].prompt}
                                    </div>
                                    {assessment.questions[0].instructions && (
                                        <>
                                            <h5>Instructions</h5>
                                            <p>{assessment.questions[0].instructions}</p>
                                        </>
                                    )}
                                    <p>
                                        <strong>Word Limit:</strong> {assessment.questions[0].wordLimit} | 
                                        <strong> Difficulty:</strong> {assessment.questions[0].difficulty} | 
                                        <strong> Type:</strong> {assessment.questions[0].writingType} | 
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

export default WritingAIAssessment;
