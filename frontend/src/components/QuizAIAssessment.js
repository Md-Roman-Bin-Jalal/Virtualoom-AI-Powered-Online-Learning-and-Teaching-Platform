import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Debug logging helper function
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[QuizAI ${timestamp}]`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, data);
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

const QuizAIAssessment = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [assessment, setAssessment] = useState(null);
      // Add state for auto-retry functionality
    const [submissionAttempts, setSubmissionAttempts] = useState(0);
    const [retryCount, setRetryCount] = useState(0);
    
    // Add state for recovery from failed requests
    const [lastSuccessfulResponse, setLastSuccessfulResponse] = useState(() => {
        // Try to load from localStorage on initial render
        const cached = localStorage.getItem('lastSuccessfulQuizResponse');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                debugLog('Error parsing cached quiz response:', e);
                return null;
            }
        }
        return null;
    });
      // Automatic retry mechanism
    useEffect(() => {
        let retryTimer;
        
        if (error && retryCount < 2 && submissionAttempts > 0) {
            debugLog(`Setting up automatic retry ${retryCount + 1} in 5 seconds...`);
            retryTimer = setTimeout(() => {
                debugLog(`Automatic retry ${retryCount + 1} triggered`);
                setRetryCount(prev => prev + 1);
                setError('');
                handleSubmitWithRetry();
            }, 5000);
        }
        
        return () => clearTimeout(retryTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error, submissionAttempts, retryCount]);
    
    // Clear errors after timeout
    useEffect(() => {
        let errorTimer;
        if (error) {
            errorTimer = setTimeout(() => {
                if (!success) {
                    setError('');
                }
            }, 30000); // Clear error after 30 seconds if no success
        }
        return () => clearTimeout(errorTimer);    }, [error, success]);
    
    // Add retry-specific submit function
    const handleSubmitWithRetry = async () => {
        setLoading(true);
        
        try {
            // Create a modified version with fewer questions for better reliability
            const retryFormData = {
                ...formData,
                numberOfQuestions: Math.min(formData.numberOfQuestions, 3) // Force max 3 questions on retry
            };
            
            debugLog('Retry attempt with simplified parameters:', retryFormData);
            
            // Validate and prepare data
            const validatedFormData = {
                title: String(retryFormData.title || "Quiz Assessment").trim(),
                timeLimit: Number(retryFormData.timeLimit || 30),
                email: String(retryFormData.email || "user@example.com").trim(),
                expiresIn: Number(retryFormData.expiresIn || 7),
                expiryUnit: String(retryFormData.expiryUnit || 'day'),
                category: String(retryFormData.category || 'General'),
                difficulty: retryFormData.difficulty === 'hard' ? 'moderate' : retryFormData.difficulty, // Lower difficulty on retry
                topic: String(retryFormData.topic || "General Knowledge").trim(),
                numberOfQuestions: Math.min(Number(retryFormData.numberOfQuestions || 3), 3), // Max 3 questions
                pointsPerQuestion: Number(retryFormData.pointsPerQuestion || 10)
            };
            
            // Send the request with increased timeout
            const response = await axios.post('http://localhost:5000/api/quiz-ai/create', validatedFormData, {
                timeout: 180000, // 3 minutes - longer timeout for retries
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            // Process response
            if (response.data && response.data.success === true && response.data.assessment) {
                setSuccess(true);
                setAssessment(response.data.assessment);
                setError('');
                
                // Cache successful response
                setLastSuccessfulResponse(response.data);
                localStorage.setItem('lastSuccessfulQuizResponse', JSON.stringify(response.data));
                debugLog('Quiz creation retry succeeded!');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            debugLog('Retry attempt failed:', err);
            setError(`Automatic retry failed. Please try with fewer questions or a simpler topic.\n\nError: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const [formData, setFormData] = useState({
        title: '',
        timeLimit: 30,
        email: '',
        expiresIn: 7,
        expiryUnit: 'day',
        category: 'General',
        difficulty: 'moderate',
        topic: '',
        numberOfQuestions: 3, // Default to 3 for better reliability
        pointsPerQuestion: 10
    });

    const categories = [
        'General', 'Science', 'History', 'Geography', 'Literature', 
        'Arts', 'Sports', 'Technology', 'Mathematics', 'Music'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        // Convert numeric fields
        if (name === 'timeLimit' || name === 'numberOfQuestions' || 
            name === 'pointsPerQuestion' || name === 'expiresIn') {
            processedValue = Number(value);
        }
        
        setFormData({
            ...formData,
            [name]: processedValue
        });
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError('');
        setRetryCount(0);
        
        // Track submission attempts to enable auto-retry functionality
        setSubmissionAttempts(prev => prev + 1);
        
        try {
            // Validate required fields before submission
            if (!formData.title) {
                throw new Error('Quiz title is required');
            }
            
            if (!formData.email) {
                throw new Error('Your email is required');
            }
            
            if (!formData.topic) {
                throw new Error('Topic is required');
            }
            
            // Enhanced debugging - validate numbers are actually numbers and ensure all fields are present
            debugLog('PRE-VALIDATION formData:', formData);
            
            // Initialize with default values for required fields to ensure they always exist
            // Convert all values to proper types to match backend expectations
            const validatedFormData = {
                title: String(formData.title || "Quiz Assessment").trim(),
                timeLimit: parseInt(formData.timeLimit || 30, 10),
                email: String(formData.email || "user@example.com").trim(),
                expiresIn: parseInt(formData.expiresIn || 7, 10),
                expiryUnit: String(formData.expiryUnit || 'day'),
                category: String(formData.category || 'General'),
                difficulty: String(formData.difficulty || 'moderate'),
                topic: String(formData.topic || "General Knowledge").trim(),
                numberOfQuestions: Math.min(parseInt(formData.numberOfQuestions || 5, 10), 10), // Cap at 10 questions to prevent timeouts
                pointsPerQuestion: parseInt(formData.pointsPerQuestion || 10, 10)
            };
            
            // Final check to guarantee numeric fields are numbers
            const numericFields = ['timeLimit', 'numberOfQuestions', 'pointsPerQuestion', 'expiresIn'];
            numericFields.forEach(field => {
                if (isNaN(validatedFormData[field])) {
                    validatedFormData[field] = field === 'timeLimit' ? 30 : 
                                            field === 'expiresIn' ? 7 :
                                            field === 'numberOfQuestions' ? 5 : 10;
                }
            });
            
            debugLog('POST-VALIDATION formData:', validatedFormData);
            
            try {
                debugLog('Sending quiz assessment data to server:', validatedFormData);
                debugLog('API URL:', 'http://localhost:5000/api/quiz-ai/create');
                
                // Debug - print each field individually to check for undefined values
                debugLog('DETAILED VALIDATION:');
                debugLog('- title:', validatedFormData.title);
                debugLog('- timeLimit:', validatedFormData.timeLimit);
                debugLog('- email:', validatedFormData.email);
                debugLog('- topic:', validatedFormData.topic);
                debugLog('- numberOfQuestions:', validatedFormData.numberOfQuestions);
                  // Convert and stringify the data first to inspect it
                const jsonData = JSON.stringify(validatedFormData);
                debugLog('REQUEST BODY BEING SENT:', jsonData);
                
                // First check if server is reachable with a simple ping
                try {
                    await axios.get('http://localhost:5000', { timeout: 5000 });
                    debugLog('Server is reachable, proceeding with quiz creation');
                } catch (pingError) {
                    throw new Error('Quiz server is not reachable. Please check your connection and try again.');
                }
                
                // Add timeout to the request to prevent hanging
                const response = await axios.post('http://localhost:5000/api/quiz-ai/create', validatedFormData, {
                    timeout: 120000, // 120 second timeout (increased from 90 seconds)
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });                // Debug the response in greater detail
                debugLog('RAW RESPONSE:', response);
                debugLog('Response status:', response.status);
                debugLog('Response headers:', response.headers);
                debugLog('Response data:', response.data);
                
                // Enhanced validation of response data
                if (!response.data) {
                    throw new Error('Empty response received from server');
                }
                
                // Force convert success flag to boolean (handle string '1', 'true', etc)
                const successValue = response.data.success;
                const isSuccess = successValue === true || 
                                 successValue === 'true' || 
                                 successValue === 1 || 
                                 successValue === '1';
                debugLog('Success value conversion:', { original: successValue, converted: isSuccess });
                
                // More thorough validation of the response
                if (isSuccess && 
                    response.data.assessment && 
                    response.data.assessmentId) {
                    
                    // Verify the assessment has the required properties
                    const assessment = response.data.assessment;
                    
                    if (!assessment.questions || !Array.isArray(assessment.questions) || assessment.questions.length === 0) {
                        debugLog('Invalid assessment structure - missing or empty questions array:', assessment);
                        setError('The quiz was created but no valid questions were generated. Please try again.');
                        return;
                    }
                    
                    // Set success state and assessment data
                    setSuccess(true);
                    setAssessment(assessment);
                    debugLog('Quiz assessment created successfully:', assessment);
                    
                    // Display success message with more details
                    debugLog(`Quiz created with ID: ${response.data.assessmentId}`);
                    debugLog(`Number of questions: ${assessment.questions.length}`);
                    
                    // Save the successful response for recovery if needed later
                    try {
                        setLastSuccessfulResponse(response.data);
                        localStorage.setItem('lastSuccessfulQuizResponse', JSON.stringify(response.data));
                        debugLog('Saved successful response to localStorage');
                    } catch (saveErr) {
                        debugLog('Error saving response to localStorage:', saveErr);
                    }
                } else {
                    // Handle unexpected success response format with more details about what's missing
                    debugLog('Unexpected response format:', response);
                    if (!response.data) {
                        setError('Empty response received from the server. Please try again.');
                    } else if (response.data.success !== true) {
                        setError(`Server returned an unsuccessful response: ${response.data.message || 'Unknown error'}`);
                    } else if (!response.data.assessment) {
                        setError('Server response missing assessment data. Please try again.');
                    } else if (!response.data.assessmentId) {
                        setError('Server response missing assessment ID. Please try again.');
                    } else {
                        setError('Received an invalid response from the server. Please try again.');
                    }
                }            } catch (err) {
                debugLog('Full error object:', err);
                
                // Create a more user-friendly error message based on the error
                let userFriendlyError = 'An error occurred while creating your quiz. Please try again.';
                
                // Even more detailed error reporting with enhanced debugging
                if (err.response) {
                    debugLog('Response error data:', err.response.data);
                    debugLog('Response error status:', err.response.status);
                    debugLog('Response headers:', err.response.headers);
                    
                    // Add specific handling for different status codes
                    if (err.response.status === 504) {
                        userFriendlyError = 'The quiz generation timed out. Try again with fewer questions (2-3) or a simpler topic.';
                    } else if (err.response.status === 400) {
                        const errorMsg = err.response.data?.message || 'Invalid quiz parameters';
                        userFriendlyError = `Validation error: ${errorMsg}`;
                        debugLog(`Validation error: ${errorMsg}`);
                        setError(`Validation Error: ${errorMsg}`);
                    } else if (err.response.status === 500) {
                        const errorMsg = err.response.data?.message || 'Failed to generate quiz';
                        debugLog(`Server error message: ${errorMsg}`);
                        
                        // Check for common AI generation errors
                        if (errorMsg.includes('generate') || errorMsg.includes('AI') || errorMsg.includes('content')) {
                            setError(`AI Generation Error: The system couldn't generate a quiz with your parameters. Please try a different topic or fewer questions.`);
                        } else {
                            setError(`Server Error: ${errorMsg}`);
                        }
                    } else {
                        const errorMsg = err.response.data?.message || 'Failed to generate quiz';
                        debugLog(`Server error message: ${errorMsg}`);
                        setError(`Error ${err.response.status}: ${errorMsg}`);
                    }
                } else if (err.request) {
                    debugLog('Request was made but no response received - Request details:', err.request);
                    
                    // More specific error message with troubleshooting steps
                    setError('Server connection error: Please check that the server is running and try again.');
                    
                    // Check if server is likely down
                    if (err.message && err.message.includes('Network Error')) {
                        debugLog('NETWORK ERROR - SERVER LIKELY DOWN OR UNREACHABLE');
                        setError('Network error: The server appears to be down or unreachable. Please ensure the backend server is running at http://localhost:5000');
                    } else if (err.message && err.message.includes('timeout')) {
                        debugLog('REQUEST TIMEOUT');
                        setError('Request timeout: The server took too long to respond. Try again with fewer questions (2-3) or a simpler topic.');
                    }
                    
                    // Try to provide more context about the failed request
                    try {
                        const requestInfo = {
                            url: err.config?.url,
                            method: err.config?.method,
                            headers: err.config?.headers,
                            timeout: err.config?.timeout
                        };
                        debugLog('Failed request configuration:', requestInfo);
                    } catch (debugErr) {
                        debugLog('Error while logging request details:', debugErr);
                    }
                } else if (err.code === 'ECONNABORTED') {
                    debugLog('Request timeout details:', err);
                    setError('The request timed out. Try again with fewer questions (3-5) or a less complex topic.');
                } else {
                    debugLog('Error setting up request:', err.message);
                    setError(`Error: ${err.message || 'Failed to generate quiz. Please try again with different parameters.'}`);
                }
                
                // Add error recovery guidance
                setError(prevError => prevError + "\n\nRecovery steps:\n1. Make sure the server is running\n2. Try with fewer questions (3-5)\n3. Use a simpler topic\n4. Check your network connection");
                
                // Try direct fetch as fallback for debugging
                try {
                    debugLog('Attempting direct fetch as fallback:');
                    fetch('http://localhost:5000/api/quiz-ai/create', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(validatedFormData)
                    })
                    .then(res => {
                        debugLog('Fallback fetch response status:', res.status);
                        return res.text();
                    })
                    .then(text => {
                        try {
                            debugLog('Fallback fetch raw response:', text);
                            // If we got a valid response, try to use it directly
                            if (text && text.includes('success') && text.includes('true')) {
                                try {
                                    const jsonResponse = JSON.parse(text);
                                    if (jsonResponse.success === true && jsonResponse.assessment) {
                                        setSuccess(true);
                                        setAssessment(jsonResponse.assessment);
                                        setError('');
                                        setLastSuccessfulResponse(jsonResponse);
                                        localStorage.setItem('lastSuccessfulQuizResponse', text);
                                        debugLog('Successfully recovered using fallback fetch');
                                    } else {
                                        setError(prevError => prevError + "\n\nFallback fetch succeeded but returned invalid data.");
                                    }
                                } catch (parseErr) {
                                    setError(prevError => prevError + "\n\nFallback fetch succeeded! Try refreshing the page and submitting again.");
                                }
                            }
                        } catch (e) {
                            debugLog('Fallback fetch response (not JSON):', text);
                        }
                    })
                    .catch(fetchErr => {
                        debugLog('Fallback fetch also failed:', fetchErr);
                    });
                } catch (fallbackErr) {
                    debugLog('Error in fallback fetch:', fallbackErr);
                }
            }
        } catch (validationError) {
            setError(validationError.message || 'Validation error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Create AI Quiz Assessment</h2>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < error.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                      {retryCount > 0 && (
                        <div className="mt-2">
                            <small className="text-muted">Automatic retry attempt {retryCount}/2</small>
                        </div>
                    )}
                    
                    {/* Recovery option from cache if available */}
                    {lastSuccessfulResponse && (
                        <div className="mt-2">
                            <button 
                                className="btn btn-sm btn-warning" 
                                onClick={() => {
                                    setError('');
                                    setSuccess(true);
                                    setAssessment(lastSuccessfulResponse.assessment);
                                    debugLog('Restored from cached response');
                                }}
                            >
                                Restore Last Successful Quiz
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {success && (
                <div className="alert alert-success" role="alert">
                    Quiz assessment created successfully!
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Quiz Title</label>
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
                        <label htmlFor="numberOfQuestions" className="form-label">Number of Questions</label>
                        <input
                            type="number"
                            className="form-control"
                            id="numberOfQuestions"
                            name="numberOfQuestions"
                            value={formData.numberOfQuestions}
                            onChange={handleChange}
                            min="1"
                            max="10" 
                            required
                        />
                        <small className="text-muted">For reliable results, keep between 1-5 questions</small>
                    </div>
                    
                    <div className="col">
                        <label htmlFor="pointsPerQuestion" className="form-label">Points per Question</label>
                        <input
                            type="number"
                            className="form-control"
                            id="pointsPerQuestion"
                            name="pointsPerQuestion"
                            value={formData.pointsPerQuestion}
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
                        <label htmlFor="category" className="form-label">Category</label>
                        <select
                            className="form-select"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
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
                    <div className="form-text">Enter a specific topic for the AI to generate quiz questions about</div>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate AI Quiz'}
                </button>
            </form>
            
            {assessment && (
                <div className="mt-4">
                    <h3>Generated Quiz Assessment</h3>
                    <div className="card">
                        <div className="card-header">
                            <h4>{assessment.title}</h4>
                        </div>
                        <div className="card-body">
                            <p>
                                <strong>Category:</strong> {assessment.category} | 
                                <strong> Difficulty:</strong> {assessment.difficulty} | 
                                <strong> Questions:</strong> {assessment.questions?.length || 0}
                            </p>
                            
                            {assessment.questions && assessment.questions.length > 0 && (
                                <div className="mt-4">
                                    <h5>Preview of Questions</h5>
                                    <div className="list-group">
                                        {assessment.questions.slice(0, 3).map((question, idx) => (
                                            <div key={idx} className="list-group-item">
                                                <h6>Question {idx + 1}: {question.questionText}</h6>
                                                <ol type="A">
                                                    {question.options.map((option, optIdx) => (
                                                        <li key={optIdx} className={question.correctOptions.includes(optIdx) ? "text-success fw-bold" : ""}>
                                                            {option} {question.correctOptions.includes(optIdx) && "(Correct)"}
                                                        </li>
                                                    ))}
                                                </ol>
                                                <small>Points: {question.points}</small>
                                            </div>
                                        ))}
                                    </div>
                                    {assessment.questions.length > 3 && (
                                        <p className="text-center mt-2">
                                            ...and {assessment.questions.length - 3} more questions
                                        </p>
                                    )}
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

export default QuizAIAssessment;
