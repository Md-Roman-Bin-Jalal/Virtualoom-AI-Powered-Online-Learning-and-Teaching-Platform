import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Evaluation = () => {
    const [activeNav, setActiveNav] = useState('evaluation');
    const [activeEvaluation, setActiveEvaluation] = useState(null);
    const [assignedQuizzes, setAssignedQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [quizStartTime, setQuizStartTime] = useState(null);
    const [quizResults, setQuizResults] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Check if user is logged in
    useEffect(() => {
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');

        if (!username || !email) {
            navigate('/login');
            return;
        }

        // Fetch assigned quizzes when component mounts
        fetchAssignedQuizzes();
    }, [navigate]);

    // Handle timer for quiz
    useEffect(() => {
        let timer;
        if (timerActive && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timer);
                        setTimerActive(false);
                        handleSubmitQuiz();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [timerActive, timeRemaining]);    // Fetch assigned quizzes from the evaluation API
    const fetchAssignedQuizzes = async () => {
        try {
            setLoading(true);
            const email = localStorage.getItem('email');
            
            // Use new evaluation API
            const response = await fetch(`http://localhost:5000/api/evaluation/user/${email}/assignments`);
            const data = await response.json();

            if (data.success) {
                setAssignedQuizzes(data.assignments);
            } else {
                setErrorMsg(data.message || 'Failed to fetch assigned evaluations');
            }
        } catch (error) {
            console.error('Error fetching assigned evaluations:', error);
            setErrorMsg('An error occurred while fetching evaluations');
        } finally {
            setLoading(false);
        }
    };    // Fetch quiz details from the evaluation API
    const fetchQuizDetails = async (assignmentId) => {
        try {
            setLoading(true);
            const email = localStorage.getItem('email');
            
            // Use the evaluation API to get assignment details
            const response = await fetch(`http://localhost:5000/api/evaluation/assignment/${assignmentId}?email=${email}`);
            const data = await response.json();

            if (data.success) {
                // Set quiz data from the assessment part of the response
                setQuizData(data.assessment);
                setTimeRemaining(data.assessment.timeLimit * 60);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setQuizResults(null);
                
                // Start the timer if not already completed
                if (data.assignment.status === 'pending' || data.assignment.status === 'started') {
                    setTimerActive(true);
                    setQuizStartTime(Date.now());
                }
            } else {
                setErrorMsg(data.message || 'Failed to fetch assessment details');
            }
        } catch (error) {
            console.error('Error fetching assessment details:', error);
            setErrorMsg('An error occurred while fetching assessment details');
        } finally {
            setLoading(false);
        }
    };

    // Start quiz
    const startQuiz = () => {
        setTimerActive(true);
        setQuizStartTime(Date.now());
    };

    // Handle navigation
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
            setActiveNav('evaluation');
        } else if (nav === 'logout') {
            localStorage.removeItem('username');
            localStorage.removeItem('email');
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    // Handle answer selection
    const handleAnswerSelection = (questionId, optionIndex) => {
        setSelectedAnswers(prev => {
            const currentSelections = prev[questionId] || [];
            
            // Check if option is already selected
            if (currentSelections.includes(optionIndex)) {
                // Remove the option
                return {
                    ...prev,
                    [questionId]: currentSelections.filter(index => index !== optionIndex)
                };
            } else {
                // Add the option
                return {
                    ...prev,
                    [questionId]: [...currentSelections, optionIndex]
                };
            }
        });
    };

    // Navigate between questions
    const navigateToQuestion = (index) => {
        if (index >= 0 && index < quizData.questions.length) {
            setCurrentQuestionIndex(index);
        }
    };    // Submit quiz using evaluation API
    const handleSubmitQuiz = async () => {
        try {
            setLoading(true);
            setTimerActive(false);
            
            const email = localStorage.getItem('email');
            const timeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
            
            // Format answers for submission
            const formattedAnswers = Object.keys(selectedAnswers).map(questionId => ({
                questionId,
                selectedOptions: selectedAnswers[questionId] || []
            }));
              // Use the evaluation API to submit the assignment
            if (!selectedQuiz || !selectedQuiz.id) {
                setErrorMsg('Invalid quiz selection. Please try again.');
                setLoading(false);
                return;
            }
            
            const response = await fetch(`http://localhost:5000/api/evaluation/assignment/${selectedQuiz.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: email,
                    answers: formattedAnswers,
                    timeTaken
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setQuizResults(data);
                setErrorMsg('Quiz submitted successfully!');
                showSuccessMessage();
            } else {
                setErrorMsg(data.message || 'Failed to submit quiz');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            setErrorMsg('An error occurred while submitting the quiz');
        } finally {
            setLoading(false);
        }
    };    // Handle coding assessment submission
    const handleSubmitCodingAssessment = async () => {
        try {
            setLoading(true);
            setTimerActive(false);
            
            const email = localStorage.getItem('email');
            const timeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
            
            // Format answers for submission
            const formattedAnswers = Object.keys(selectedAnswers).map(questionId => ({
                questionId,
                code: selectedAnswers[questionId] || ''
            }));
            
            // Check if quiz selection is valid
            if (!selectedQuiz || !selectedQuiz.id) {
                setErrorMsg('Invalid coding assessment selection. Please try again.');
                setLoading(false);
                return;
            }
            
            // Use evaluation API for submission
            const response = await fetch(`http://localhost:5000/api/evaluation/assignment/${selectedQuiz.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: email,
                    answers: formattedAnswers,
                    timeTaken
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setQuizResults({
                    resultId: data.resultId || data.assignment?._id,
                    score: data.score,
                    maxPossibleScore: data.maxPossibleScore,
                    message: 'Coding assessment submitted successfully and is being evaluated.',
                    isBeingEvaluated: true
                });
                setErrorMsg('Coding assessment submitted successfully!');
                showSuccessMessage();
                
                // Check for evaluation after a short delay
                setTimeout(() => checkAssessmentEvaluation(data.resultId || data.assignment?._id, 'coding'), 5000);
            } else {
                setErrorMsg(data.message || 'Failed to submit coding assessment');
            }
        } catch (error) {
            console.error('Error submitting coding assessment:', error);
            setErrorMsg('An error occurred while submitting the coding assessment');
        } finally {
            setLoading(false);
        }
    };    // Handle writing assessment submission
    const handleSubmitWritingAssessment = async () => {
        try {
            setLoading(true);
            setTimerActive(false);
            
            const email = localStorage.getItem('email');
            const timeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
            
            // Format answers for submission
            const formattedAnswers = Object.keys(selectedAnswers).map(questionId => ({
                questionId,
                text: selectedAnswers[questionId] || ''
            }));
            
            // Check if quiz selection is valid
            if (!selectedQuiz || !selectedQuiz.id) {
                setErrorMsg('Invalid writing assessment selection. Please try again.');
                setLoading(false);
                return;
            }
            
            // Use evaluation API for submission
            const response = await fetch(`http://localhost:5000/api/evaluation/assignment/${selectedQuiz.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: email,
                    answers: formattedAnswers,
                    timeTaken
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setQuizResults({
                    resultId: data.resultId || data.assignment?._id,
                    message: 'Writing assessment submitted successfully and is being evaluated.',
                    isBeingEvaluated: true
                });
                setErrorMsg('Writing assessment submitted successfully!');
                showSuccessMessage();
                
                // Check for evaluation after a short delay
                setTimeout(() => checkAssessmentEvaluation(data.resultId || data.assignment?._id, 'writing'), 5000);
            } else {
                setErrorMsg(data.message || 'Failed to submit writing assessment');
            }
        } catch (error) {
            console.error('Error submitting writing assessment:', error);
            setErrorMsg('An error occurred while submitting the writing assessment');
        } finally {
            setLoading(false);
        }
    };    // Check if assessment has been evaluated
    const checkAssessmentEvaluation = async (resultId, type) => {
        try {
            // Validate resultId
            if (!resultId) {
                console.error('Invalid result ID provided to checkAssessmentEvaluation');
                setErrorMsg(`Error checking ${type} assessment: Missing result ID`);
                return;
            }
            
            // Use the evaluation API to check the status
            const endpoint = `http://localhost:5000/api/evaluation/result/${resultId}`;
                
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.success) {
                if (data.result && data.result.status === 'evaluated') {
                    // Assessment has been evaluated
                    setQuizResults({
                        ...data.result,
                        isBeingEvaluated: false
                    });
                } else {
                    // Assessment is still being evaluated, check again after 5 seconds
                    setTimeout(() => checkAssessmentEvaluation(resultId, type), 5000);
                }
            } else {
                setErrorMsg(data.message || `Failed to check ${type} assessment evaluation`);
            }
        } catch (error) {
            console.error(`Error checking ${type} assessment evaluation:`, error);
            // Try again after 10 seconds if there was an error
            setTimeout(() => checkAssessmentEvaluation(resultId, type), 10000);
        }
    };

    // Show success message
    const showSuccessMessage = () => {
        const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
        const textElement = document.querySelector('div[style*="color: #b71c1c"]');

        if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
        if (textElement) textElement.style.color = '#2e7d32';

        setTimeout(() => {
            setErrorMsg('');
        }, 3000);
    };

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Reset quiz state
    const resetQuizState = () => {
        setSelectedQuiz(null);
        setQuizData(null);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setTimeRemaining(0);
        setTimerActive(false);
        setQuizStartTime(null);
        setQuizResults(null);
    };

    return (
        <div style={{ 
            display: 'flex', 
            height: '100vh', 
            fontFamily: 'Arial',
            overflow: 'hidden'
        }}>
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
                        backgroundColor: activeNav === 'home' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/home.png"
                        alt="Home"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>

                <button
                    onClick={() => handleNavigation('create')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'create' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/createChannel.png"
                        alt="Create Channel"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>

                <button
                    onClick={() => handleNavigation('browse')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'browse' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/browseChannel.png"
                        alt="Browse Channel"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>
                
                <button
                    onClick={() => handleNavigation('assessment')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'assessment' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/assesment.png"
                        alt="Assessment"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>
                
                <button
                    onClick={() => handleNavigation('evaluation')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'evaluation' ? '#d1e3fa' : 'transparent',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/evaluation.png"
                        alt="Evaluation"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>

                <button
                    onClick={() => navigate('/meeting')}
                    style={{
                        border: 'none',
                        backgroundColor: activeNav === 'meeting' ? '#d1e3fa' : 'transparent',
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
                        backgroundColor: activeNav === 'logout' ? '#d1e3fa' : 'transparent',
                        marginTop: 'auto',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '5px',
                    }}
                >
                    <img
                        src="/logout.png"
                        alt="Logout"
                        style={{ width: '40px', height: '40px' }}
                    />
                </button>
            </div>

            {/* Evaluation Options Sidebar */}
            <div style={{ 
                width: '250px',
                backgroundColor: 'white',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '15px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px'
                }}>
                    Evaluation Options
                </div>

                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '10px' 
                }}>
                    <div 
                        onClick={() => {
                            setActiveEvaluation('quizzes');
                            resetQuizState();
                        }}
                        style={{
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: activeEvaluation === 'quizzes' ? '#d1e3fa' : 'white',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Quizzes</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Take assigned quizzes
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveEvaluation('coding')}
                        style={{
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: activeEvaluation === 'coding' ? '#d1e3fa' : 'white',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Coding Assessments</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Coming soon
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveEvaluation('writing')}
                        style={{
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: activeEvaluation === 'writing' ? '#d1e3fa' : 'white',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Writing Assessments</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Coming soon
                        </div>
                    </div>
                    
                    <div 
                        onClick={() => setActiveEvaluation('results')}
                        style={{
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: activeEvaluation === 'results' ? '#d1e3fa' : 'white',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>My Results</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            View your assessment results (coming soon)
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ 
                flex: 1,
                backgroundColor: '#f5f9ff',
                padding: '20px',
                overflowY: 'auto'
            }}>
                {errorMsg && (
                    <div style={{ 
                        backgroundColor: '#ffebee', 
                        color: '#b71c1c', 
                        padding: '10px',
                        marginBottom: '20px',
                        borderRadius: '5px', 
                        textAlign: 'center' 
                    }}>
                        {errorMsg}
                    </div>
                )}

                {loading && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px' 
                    }}>
                        Loading...
                    </div>
                )}

                {/* Welcome message when first opening the Evaluation page */}
                {!activeEvaluation && (
                    <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '70%',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Welcome to Evaluations</h3>
                        <p style={{ lineHeight: '1.6', color: '#555', maxWidth: '600px' }}>
                            Take assigned quizzes and assessments to improve your skills and track your progress.
                            Select an option from the sidebar to get started.
                        </p>
                    </div>
                )}

                {/* Quiz List View */}
                {activeEvaluation === 'quizzes' && !selectedQuiz && !loading && (
                    <div style={{ 
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Assigned Quizzes</h3>
                        
                        {assignedQuizzes.filter(assignment => assignment.category === 'quiz').length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                No quizzes have been assigned to you yet.
                            </p>
                        ) : (
                            <div>
                                {assignedQuizzes
                                    .filter(assignment => assignment.category === 'quiz')
                                    .map(assignment => (
                                        <div 
                                            key={assignment.id}
                                            onClick={() => {
                                                setSelectedQuiz(assignment);
                                                fetchQuizDetails(assignment.id);
                                            }}
                                            style={{
                                                padding: '15px',
                                                borderRadius: '5px',
                                                border: '1px solid #e0e0e0',
                                                marginBottom: '10px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                backgroundColor: 'white',
                                                ':hover': {
                                                    backgroundColor: '#f5f5f5'
                                                }
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>
                                                {assignment.title}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                                                <span>Status: {assignment.status}</span>
                                                <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No deadline'}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                Assigned by: {assignment.assignedBy}
                                            </div>
                                            {assignment.status === 'completed' && (
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#4caf50', 
                                                    marginTop: '5px',
                                                    fontWeight: 'bold' 
                                                }}>
                                                    Completed on: {new Date(assignment.completedAt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Quiz Taking View */}
                {selectedQuiz && quizData && !quizResults && !loading && (
                    <div style={{ 
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ color: '#1976d2', margin: 0 }}>{quizData.title}</h3>
                            
                            {timerActive ? (
                                <div style={{ 
                                    backgroundColor: timeRemaining < 60 ? '#ffcdd2' : '#e8f5e9',
                                    color: timeRemaining < 60 ? '#b71c1c' : '#2e7d32',
                                    padding: '8px 15px',
                                    borderRadius: '20px',
                                    fontWeight: 'bold'
                                }}>
                                    Time: {formatTime(timeRemaining)}
                                </div>
                            ) : (
                                <button
                                    onClick={startQuiz}
                                    style={{
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        padding: '8px 15px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Start Quiz
                                </button>
                            )}
                        </div>

                        {timerActive ? (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                                        Question {currentQuestionIndex + 1} of {quizData.questions.length}
                                    </div>
                                    <div style={{ padding: '15px', backgroundColor: '#f5f9ff', borderRadius: '5px' }}>
                                        {quizData.questions[currentQuestionIndex].question}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                        Options: (Select all that apply)
                                    </div>
                                    {quizData.questions[currentQuestionIndex].options.map((option, optionIndex) => (
                                        <div
                                            key={optionIndex}
                                            onClick={() => handleAnswerSelection(
                                                quizData.questions[currentQuestionIndex]._id,
                                                optionIndex
                                            )}
                                            style={{
                                                padding: '10px',
                                                marginBottom: '8px',
                                                borderRadius: '5px',
                                                border: '1px solid #e0e0e0',
                                                cursor: 'pointer',
                                                backgroundColor: selectedAnswers[quizData.questions[currentQuestionIndex]._id]?.includes(optionIndex)
                                                    ? '#d1e3fa'
                                                    : 'white'
                                            }}
                                        >
                                            {option}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    marginBottom: '20px'
                                }}>
                                    <button
                                        onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                                        disabled={currentQuestionIndex === 0}
                                        style={{
                                            padding: '8px 15px',
                                            borderRadius: '5px',
                                            border: '1px solid #1976d2',
                                            backgroundColor: 'white',
                                            color: '#1976d2',
                                            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                                            opacity: currentQuestionIndex === 0 ? 0.5 : 1
                                        }}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                                        disabled={currentQuestionIndex === quizData.questions.length - 1}
                                        style={{
                                            padding: '8px 15px',
                                            borderRadius: '5px',
                                            border: '1px solid #1976d2',
                                            backgroundColor: 'white',
                                            color: '#1976d2',
                                            cursor: currentQuestionIndex === quizData.questions.length - 1 ? 'not-allowed' : 'pointer',
                                            opacity: currentQuestionIndex === quizData.questions.length - 1 ? 0.5 : 1
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    gap: '5px',
                                    flexWrap: 'wrap',
                                    marginBottom: '20px'
                                }}>
                                    {quizData.questions.map((_, index) => (
                                        <div
                                            key={index}
                                            onClick={() => navigateToQuestion(index)}
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                backgroundColor: selectedAnswers[quizData.questions[index]._id]?.length > 0
                                                    ? '#4caf50'
                                                    : currentQuestionIndex === index
                                                        ? '#1976d2'
                                                        : '#e0e0e0',
                                                color: (currentQuestionIndex === index || selectedAnswers[quizData.questions[index]._id]?.length > 0)
                                                    ? 'white'
                                                    : '#333',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={handleSubmitQuiz}
                                        style={{
                                            backgroundColor: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            padding: '10px 20px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        Submit Quiz
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '50px 20px',
                                backgroundColor: '#f5f9ff',
                                borderRadius: '5px' 
                            }}>
                                <h4 style={{ marginTop: 0, color: '#1976d2' }}>Quiz Instructions</h4>
                                <p>This quiz contains {quizData.questions.length} questions.</p>
                                <p>You will have {quizData.timeLimit} minutes to complete the quiz.</p>
                                <p>Click the "Start Quiz" button when you're ready to begin.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Quiz Results View */}
                {quizResults && (
                    <div style={{ 
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '20px' }}>Quiz Results</h3>
                        
                        <div style={{ 
                            textAlign: 'center',
                            backgroundColor: '#e8f5e9',
                            padding: '20px',
                            borderRadius: '5px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                                Score: {quizResults.score} / {quizResults.maxPossibleScore}
                            </div>
                            <div style={{ 
                                fontSize: '18px', 
                                color: '#333',
                                marginTop: '10px'
                            }}>
                                {Math.round((quizResults.score / quizResults.maxPossibleScore) * 100)}%
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button
                                onClick={resetQuizState}
                                style={{
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Back to Quizzes
                            </button>
                        </div>
                    </div>
                )}

                {/* Coding Assessments Section */}
                {activeEvaluation === 'coding' && !loading && !selectedQuiz && (
                    <div style={{ 
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Coding Assessments</h3>
                        
                        {assignedQuizzes.filter(assignment => assignment.category === 'coding').length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                No coding assessments have been assigned to you yet.
                            </p>
                        ) : (
                            <div>
                                {assignedQuizzes
                                    .filter(assignment => assignment.category === 'coding')
                                    .map(assignment => (
                                        <div 
                                            key={assignment.id}
                                            onClick={() => {
                                                setSelectedQuiz(assignment);
                                                fetchQuizDetails(assignment.id);
                                            }}
                                            style={{
                                                padding: '15px',
                                                borderRadius: '5px',
                                                border: '1px solid #e0e0e0',
                                                marginBottom: '10px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                backgroundColor: 'white',
                                                ':hover': {
                                                    backgroundColor: '#f5f5f5'
                                                }
                                            }}
                                        >                                            <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>
                                                {assignment.title}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                                                <span>Status: {assignment.status}</span>
                                                <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No deadline'}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                Assigned by: {assignment.assignedBy}
                                            </div>
                                            {assignment.status === 'completed' && (
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#4caf50', 
                                                    marginTop: '5px',
                                                    fontWeight: 'bold' 
                                                }}>
                                                    Completed on: {new Date(assignment.completedAt).toLocaleString()}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '8px', fontStyle: 'italic' }}>
                                                Type: Coding Assessment
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                )}

                {/* Writing Assessments Section */}
                {activeEvaluation === 'writing' && !loading && !selectedQuiz && (
                    <div style={{ 
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Writing Assessments</h3>
                        
                        {assignedQuizzes.filter(assignment => assignment.category === 'writing').length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                No writing assessments have been assigned to you yet.
                            </p>
                        ) : (
                            <div>
                                {assignedQuizzes
                                    .filter(assignment => assignment.category === 'writing')
                                    .map(assignment => (
                                        <div 
                                            key={assignment.id}
                                            onClick={() => {
                                                setSelectedQuiz(assignment);
                                                fetchQuizDetails(assignment.id);
                                            }}
                                            style={{
                                                padding: '15px',
                                                borderRadius: '5px',
                                                border: '1px solid #e0e0e0',
                                                marginBottom: '10px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                backgroundColor: 'white',
                                                ':hover': {
                                                    backgroundColor: '#f5f5f5'
                                                }
                                            }}
                                        >                                            <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>
                                                {assignment.title}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                                                <span>Status: {assignment.status}</span>
                                                <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No deadline'}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                Assigned by: {assignment.assignedBy}
                                            </div>
                                            {assignment.status === 'completed' && (
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#4caf50', 
                                                    marginTop: '5px',
                                                    fontWeight: 'bold' 
                                                }}>
                                                    Completed on: {new Date(assignment.completedAt).toLocaleString()}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '8px', fontStyle: 'italic' }}>
                                                Type: Writing Assessment
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                )}

                {/* Results View (Coming Soon) */}
                {activeEvaluation === 'results' && !loading && (
                    <div style={{ 
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>My Results</h3>
                        <div style={{ padding: '40px 20px' }}>
                            <p>Results history feature is coming soon!</p>
                            <p>Check back later to view your past assessment results.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Evaluation;