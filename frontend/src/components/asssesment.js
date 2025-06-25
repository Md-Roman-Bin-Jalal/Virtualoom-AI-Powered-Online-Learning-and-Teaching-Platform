import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WritingViewSection } from './writingViewSection';

const Assessment = () => {
    // State for navigation
    const [activeNav, setActiveNav] = useState('assessment');    

    // State for assessment type
    const [activeAssessment, setActiveAssessment] = useState('quiz');    
      // State for assignment modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assessmentToAssign, setAssessmentToAssign] = useState(null);
    const [userChannels, setUserChannels] = useState([]);
    const [assignmentType, setAssignmentType] = useState(''); // 'quiz', 'coding', or 'writing'
    const [isAssigning, setIsAssigning] = useState(false);
    const [assigningChannels, setAssigningChannels] = useState({}); // Track which channels are being assigned
    
    // State for assessment creation tracking
    const [quizCreated, setQuizCreated] = useState(false);
    const [quizId, setQuizId] = useState(null);
    
    // State for assessment submissions
    const [writingAssessmentSubmitted, setWritingAssessmentSubmitted] = useState(false);
    const [codingAssessmentSubmitted, setCodingAssessmentSubmitted] = useState(false);
    const [quizAssessmentSubmitted, setQuizAssessmentSubmitted] = useState(false);    

    // State for general assessment properties
    const [assessmentTitle, setAssessmentTitle] = useState('');
    const [timeLimit, setTimeLimit] = useState(30);
    const [expiresIn, setExpiresIn] = useState(7);
    const [expiryUnit, setExpiryUnit] = useState('day');

    // State for dropdown menu visibility
    const [showQuizDropdown, setShowQuizDropdown] = useState(false);
    const [showCodingDropdown, setShowCodingDropdown] = useState(false);
    const [showWritingDropdown, setShowWritingDropdown] = useState(false);

    // State for generation mode
    const [quizGenerationMode, setQuizGenerationMode] = useState('manual'); // 'manual' or 'ai'
    const [codingGenerationMode, setCodingGenerationMode] = useState('manual'); // 'manual' or 'ai'
    const [writingGenerationMode, setWritingGenerationMode] = useState('manual'); // 'manual' or 'ai'
    
    // State for viewing created assessments
    const [quizViewMode, setQuizViewMode] = useState(false); // When true, show created quizzes
    const [codingViewMode, setCodingViewMode] = useState(false); // When true, show created coding assessments
    const [writingViewMode, setWritingViewMode] = useState(false); // When true, show created writing assessments
    
    // State for storing created assessments
    const [createdQuizzes, setCreatedQuizzes] = useState([]);
    const [createdCodingAssessments, setCreatedCodingAssessments] = useState([]);
    const [createdWritingAssessments, setCreatedWritingAssessments] = useState([]);
    
    // State for viewing a specific assessment
    const [viewingAssessment, setViewingAssessment] = useState(null);

    // State for quiz questions
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctOptions, setCorrectOptions] = useState([]);
    const [points, setPoints] = useState(10);

    // State for coding assessment questions
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [currentCodingQuestionIndex, setCurrentCodingQuestionIndex] = useState(0);
    const [codingQuestionText, setCodingQuestionText] = useState('');
    const [codingProblemDescription, setCodingProblemDescription] = useState('');
    const [codingStarterCode, setCodingStarterCode] = useState('');
    const [codingExpectedOutput, setCodingExpectedOutput] = useState('');
    const [codingPoints, setCodingPoints] = useState(10);
    const [codingDifficulty, setCodingDifficulty] = useState('moderate');

    // State for writing assessment questions
    const [writingQuestions, setWritingQuestions] = useState([]);
    const [currentWritingQuestionIndex, setCurrentWritingQuestionIndex] = useState(0);
    const [writingQuestionText, setWritingQuestionText] = useState('');
    const [writingPrompt, setWritingPrompt] = useState('');
    const [writingInstructions, setWritingInstructions] = useState('');
    const [writingWordLimit, setWritingWordLimit] = useState(500);
    const [writingPoints, setWritingPoints] = useState(10);
    const [writingDifficulty, setWritingDifficulty] = useState('moderate');

    // State for AI-generated assessments
    const [aiQuizTitle, setAiQuizTitle] = useState('');
    const [aiCodingTitle, setAiCodingTitle] = useState('');
    const [aiWritingTitle, setAiWritingTitle] = useState('');
    const [aiTimeLimit, setAiTimeLimit] = useState(30);
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    const [aiNumCodingQuestions, setAiNumCodingQuestions] = useState(3);
    const [aiNumWritingQuestions, setAiNumWritingQuestions] = useState(3);
    const [aiPointsPerQuestion, setAiPointsPerQuestion] = useState(10);
    const [aiQuizTopic, setAiQuizTopic] = useState('');
    const [aiQuizCategory, setAiQuizCategory] = useState('General'); // Added missing state variable
    const [aiCodingEvalInstructions, setAiCodingEvalInstructions] = useState('');
    const [aiWritingEvalInstructions, setAiWritingEvalInstructions] = useState('');
    const [aiDifficulty, setAiDifficulty] = useState('moderate');
    const [isGenerating, setIsGenerating] = useState(false);

    // Add necessary state for coding assessment parameters
    const [programmingLanguage, setProgrammingLanguage] = useState('JavaScript');
    const [codingTopic, setCodingTopic] = useState('');
    
    // Add state for writing assessment parameters
    const [writingTopic, setWritingTopic] = useState('');
    const [writingType, setWritingType] = useState('essay');

    // Error and success message states
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoadingWritingAssessments, setIsLoadingWritingAssessments] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const successToast = useRef(null);
    const navigate = useNavigate();

    const handleWritingModeChange = (mode) => {
        // Reset view states
        setWritingViewMode(false);
        setViewingAssessment(null);
        
        // Set the active assessment and generation mode
        setActiveAssessment('writing');
        setWritingGenerationMode(mode);
        
        // Reset form fields when switching modes
        setWritingQuestionText('');
        setWritingPrompt('');
        setWritingInstructions('');
        setWritingWordLimit(500);
        setWritingPoints(10);
        setWritingDifficulty('moderate');
        setWritingType('essay');
        setAiWritingTitle('');
        
        console.log(`Switching to writing ${mode} mode`);
    };

    useEffect(() => {
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');

        if (!username || !email) {
            navigate('/login');
            return;
        }

        // Initialize assessment handling options
        if (activeAssessment === '') {
            setQuizCreated(false);
        }
    }, [navigate, activeAssessment]);    

    // Add effect to track active assessment changes
    useEffect(() => {
        console.log("activeAssessment changed:", activeAssessment);
        console.log("writingGenerationMode:", writingGenerationMode);
        console.log("writingViewMode:", writingViewMode);
    }, [activeAssessment, writingGenerationMode, writingViewMode]);

    // Function to fetch created quiz assessments
    const fetchCreatedQuizzes = async () => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You must be logged in to view your assessments');
                return;
            }

            // Fetch manual quizzes
            const manualResponse = await fetch(`http://localhost:5000/api/quiz-manual/creator/${email}`);
            const manualData = await manualResponse.json();
            
            // Fetch AI quizzes
            const aiResponse = await fetch(`http://localhost:5000/api/quiz-ai/creator/${email}`);
            const aiData = await aiResponse.json();

            // Combine both types of quizzes
            const combinedQuizzes = [];
            
            if (manualData.success) {
                combinedQuizzes.push(...manualData.assessments);
            }
            
            if (aiData.success) {
                combinedQuizzes.push(...aiData.assessments);
            }
            
            setCreatedQuizzes(combinedQuizzes);
            
            if (!manualData.success && !aiData.success) {
                setErrorMsg('Failed to fetch your quizzes');
            }
        } catch (error) {
            console.error('Error fetching quiz assessments:', error);
            setErrorMsg('Error retrieving your quiz assessments');
        }
    };    

    // Function to fetch created coding assessments
    const fetchCreatedCodingAssessments = async () => {
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You must be logged in to view your assessments');
                return;
            }

            // Fetch manual coding assessments
            const manualResponse = await fetch(`http://localhost:5000/api/coding-manual/creator/${email}`);
            const manualData = await manualResponse.json();
            
            // Fetch AI coding assessments
            const aiResponse = await fetch(`http://localhost:5000/api/coding-ai/creator/${email}`);
            const aiData = await aiResponse.json();

            // Combine both types of coding assessments
            const combinedAssessments = [];
            
            if (manualData.success) {
                combinedAssessments.push(...manualData.assessments);
            }
            
            if (aiData.success) {
                combinedAssessments.push(...aiData.assessments);
            }
            
            setCreatedCodingAssessments(combinedAssessments);
            
            if (!manualData.success && !aiData.success) {
                setErrorMsg('Failed to fetch your coding assessments');
            }
        } catch (error) {
            console.error('Error fetching coding assessments:', error);
            setErrorMsg('Error retrieving your coding assessments');
        }
    };
    
// Function to fetch created writing assessments
const fetchCreatedWritingAssessments = async () => {
    try {
        setIsLoadingWritingAssessments(true);
        setErrorMsg(''); // Clear any existing error message
        const email = localStorage.getItem('email');
        if (!email) {
            setErrorMsg('You must be logged in to view your assessments');
            return;
        }

        console.log('Fetching writing assessments for email:', email);

        // Fetch both manual and AI writing assessments in parallel
        const [manualResponse, aiResponse] = await Promise.all([
            fetch(`http://localhost:5000/api/writing-manual/creator/${email}`),
            fetch(`http://localhost:5000/api/writing-ai/creator/${email}`)
        ]);

        // Process manual writing assessments
        const manualData = await manualResponse.json();
        console.log('Manual writing assessments response:', manualData);

        // Process AI writing assessments
        const aiData = await aiResponse.json();
        console.log('AI writing assessments response:', aiData);

        const combinedAssessments = [];
        
        // Add manual assessments if available
        if (manualData && manualData.success && Array.isArray(manualData.assessments)) {
            console.log('Adding manual assessments:', manualData.assessments.length);
            manualData.assessments.forEach(assessment => {
                assessment.type = 'manual';
                combinedAssessments.push(assessment);
            });
        }
        
        // Add AI assessments if available
        if (aiData && aiData.success && Array.isArray(aiData.assessments)) {
            console.log('Adding AI assessments:', aiData.assessments.length);
            aiData.assessments.forEach(assessment => {
                assessment.type = 'ai';
                combinedAssessments.push(assessment);
            });
        }
        
        // Sort assessments by creation date, newest first
        combinedAssessments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        console.log('Combined writing assessments:', combinedAssessments);
        setCreatedWritingAssessments(combinedAssessments);
          if (combinedAssessments.length === 0) {
            console.log('No writing assessments found');
            // Don't set error message for empty assessments, UI will handle this case
        }
    } catch (error) {
        console.error('Error fetching writing assessments:', error);
        setErrorMsg('Error retrieving your writing assessments: ' + (error.message || 'Unknown error'));
        setCreatedWritingAssessments([]); // Reset to empty array on error
    } finally {
        setIsLoadingWritingAssessments(false);
    }
};

    // Function to fetch full quiz details
    const fetchFullQuizDetails = async (quizId) => {
        try {
            // Try fetching as manual quiz first
            let response = await fetch(`http://localhost:5000/api/quiz-manual/${quizId}`);
            let data = await response.json();
            
            // If not found, try fetching as AI quiz
            if (!data.success) {
                response = await fetch(`http://localhost:5000/api/quiz-ai/${quizId}`);
                data = await response.json();
            }
            
            if (data.success) {
                setViewingAssessment(data.assessment);
            } else {
                setErrorMsg(data.message || 'Failed to fetch quiz details');
            }
        } catch (error) {
            console.error('Error fetching quiz details:', error);
            setErrorMsg('Error retrieving quiz details');
        }
    };

    // Function to fetch full coding assessment details
    const fetchFullCodingDetails = async (assessmentId) => {
        try {
            // Try fetching as manual coding assessment first
            let response = await fetch(`http://localhost:5000/api/coding-manual/${assessmentId}`);
            let data = await response.json();
            
            // If not found, try fetching as AI coding assessment
            if (!data.success) {
                response = await fetch(`http://localhost:5000/api/coding-ai/${assessmentId}`);
                data = await response.json();
            }
            
            if (data.success) {
                setViewingAssessment(data.assessment);
            } else {
                setErrorMsg(data.message || 'Failed to fetch coding assessment details');
            }
        } catch (error) {
            console.error('Error fetching coding assessment details:', error);
            setErrorMsg('Error retrieving coding assessment details');
        }
    };

    // Function to fetch full writing assessment details
    const fetchFullWritingDetails = async (assessmentId) => {
        try {
            // Try fetching as manual writing assessment first
            let response = await fetch(`http://localhost:5000/api/writing-manual/${assessmentId}`);
            let data = await response.json();
            
            // If not found, try fetching as AI writing assessment
            if (!data.success) {
                response = await fetch(`http://localhost:5000/api/writing-ai/${assessmentId}`);
                data = await response.json();
            }
            
            if (data.success) {
                setViewingAssessment(data.assessment);
            } else {
                setErrorMsg(data.message || 'Failed to fetch writing assessment details');
            }
        } catch (error) {
            console.error('Error fetching writing assessment details:', error);
            setErrorMsg('Error retrieving writing assessment details');
        }
    };
    
    // Handle generating AI coding assessment
    const handleGenerateCodingAssessment = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setErrorMsg('');
        
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You must be logged in to create assessments');
                setIsGenerating(false);
                return;
            }
            
            if (!codingTopic || !programmingLanguage) {
                setErrorMsg('Topic and programming language are required');
                setIsGenerating(false);
                return;
            }
            
            // Call the new coding-ai endpoint
            const response = await fetch('http://localhost:5000/api/coding-ai/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: assessmentTitle || `${aiDifficulty} ${programmingLanguage} Coding Challenge`,
                    timeLimit: aiTimeLimit,
                    email,
                    expiresIn,
                    expiryUnit,
                    difficulty: aiDifficulty,
                    programmingLanguage,
                    topic: codingTopic,
                    points: aiPointsPerQuestion || 10
                }),
            });
            const data = await response.json();
            
            if (data.success) {
                setSuccessMsg('Coding assessment created successfully!');
                setErrorMsg('');
                setQuizCreated(true);
                setQuizId(data.assessmentId); // Match the new API response
                setCodingAssessmentSubmitted(true);
                
                // Show success message
                setErrorMsg('Coding assessment created successfully!');
                showSuccessMessage();
                
                // Log the created assessment
                console.log("Created AI coding assessment:", data.assessment);
                
                // Switch to view mode after short delay
                setTimeout(() => {
                    setErrorMsg('');
                    setCodingGenerationMode('');
                    setCodingViewMode(true);
                    
                    // Fetch updated coding list
                    fetchCreatedCodingAssessments();
                    
                    // Set the newly created assessment as the one being viewed
                    const createdAssessment = {
                        _id: data.assessmentId,
                        title: data.title || `${aiDifficulty} ${programmingLanguage} Coding Challenge`
                    };
                    setViewingAssessment(createdAssessment);
                    
                    // Reset form
                    setCodingTopic('');
                    setProgrammingLanguage('JavaScript');
                }, 1500);
            } else {
                setErrorMsg(data.message || 'Failed to create coding assessment');
            }
        } catch (error) {
            console.error('Error generating coding assessment:', error);
            setErrorMsg('Failed to generate coding assessment. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    // Handle generating AI writing assessment
    const handleGenerateWritingAssessment = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setErrorMsg('');
        
        try {
            const email = localStorage.getItem('email');
            if (!email) {
                setErrorMsg('You must be logged in to create assessments');
                setIsGenerating(false);
                return;
            }
            
            if (!writingTopic || !writingType) {
                setErrorMsg('Topic and writing type are required');
                setIsGenerating(false);
                return;
            }
            
            // Call the new writing-ai endpoint
            const response = await fetch('http://localhost:5000/api/writing-ai/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: assessmentTitle || `${aiDifficulty} ${writingType} Assessment`,
                    timeLimit: aiTimeLimit,
                    email,
                    expiresIn,
                    expiryUnit,
                    difficulty: aiDifficulty,
                    writingType,
                    topic: writingTopic,
                    wordLimit: 500, // Default word limit
                    points: aiPointsPerQuestion || 10,
                    instructions: ''
                }),
            });
            const data = await response.json();
            
            if (data.success) {
                setSuccessMsg('Writing assessment created successfully!');
                setErrorMsg('');
                setQuizCreated(true);
                setQuizId(data.assessmentId); // Match the new API response
                setWritingAssessmentSubmitted(true);
                
                // Show success message
                setErrorMsg('Writing assessment created successfully!');
                showSuccessMessage();
                
                // Log the created assessment
                console.log("Created AI writing assessment:", data.assessment);
                
                // Switch to view mode after short delay
                setTimeout(() => {
                    setErrorMsg('');
                    setWritingGenerationMode('');
                    setWritingViewMode(true);
                    
                    // Fetch updated writing list
                    fetchCreatedWritingAssessments();
                    
                    // Set the newly created assessment as the one being viewed
                    const createdAssessment = {
                        _id: data.assessmentId,
                        title: data.title || `${aiDifficulty} ${writingType} Assessment`
                    };
                    setViewingAssessment(createdAssessment);
                    
                    // Reset form
                    setWritingTopic('');
                    setWritingType('essay');
                }, 1500);
            } else {
                setErrorMsg(data.message || 'Failed to create writing assessment');
            }
        } catch (error) {
            console.error('Error generating writing assessment:', error);
            setErrorMsg('Failed to generate writing assessment. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Function to open assignment modal
    const handleOpenAssignModal = async (assessment, type) => {
        try {
            setAssessmentToAssign(assessment);
            setAssignmentType(type);
            setShowAssignModal(true);
            
            // Fetch user channels
            const email = localStorage.getItem('email');
            const response = await fetch(`http://localhost:5000/api/assessment/user/${email}/channels`);
            const data = await response.json();
            
            if (data.success) {
                setUserChannels(data.channels);
            } else {
                setErrorMsg(data.message || 'Failed to fetch channels');
                setTimeout(() => setErrorMsg(''), 3000);
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
            setErrorMsg('Failed to fetch channels. Please try again.');
            setTimeout(() => setErrorMsg(''), 3000);
        }
    };

    // Function to close assignment modal
    const handleCloseAssignModal = () => {
        setShowAssignModal(false);
        setAssessmentToAssign(null);
        setUserChannels([]);
        setAssignmentType('');
        setAssigningChannels({}); // Reset all assignment states when closing the modal
    };

    // Function to send assessment to a channel or subchannel
    const handleSendAssessment = async (channelId, subchannelId = null) => {
        try {
            // Create unique key for this channel/subchannel combination
            const assignmentKey = subchannelId ? `${channelId}-${subchannelId}` : channelId;
            
            // Mark this specific channel/subchannel as assigning
            setAssigningChannels(prev => ({
                ...prev,
                [assignmentKey]: true
            }));
            
            const email = localStorage.getItem('email');
            const username = localStorage.getItem('username');
            
            // Log assessment details for debugging
            console.log(`Preparing to assign assessment:`, {
                type: assignmentType,
                assessmentId: assessmentToAssign._id,
                title: assessmentToAssign.title,
                channelId,
                subchannelId
            });
            
            // Map assessment type to evaluation system model
            let assessmentModel = '';
            let category = '';
            
            // Set model type based on assessment type
            switch (assignmentType) {
                case 'quiz':
                    category = 'quiz';
                    assessmentModel = assessmentToAssign.isAIGenerated ? 'QuizAIAssessment' : 'QuizManualAssessment';
                    break;
                case 'coding':
                    category = 'coding';
                    assessmentModel = assessmentToAssign.isAIGenerated ? 'CodingAIAssessment' : 'CodingManualAssessment';
                    break;
                case 'writing':
                    category = 'writing';
                    assessmentModel = assessmentToAssign.isAIGenerated ? 'WritingAIAssessment' : 'WritingManualAssessment';
                    break;
                default:
                    throw new Error('Invalid assessment type');
            }
            
            // Create payload for the evaluation system
            const payload = {
                assessmentId: assessmentToAssign._id,
                assessmentType: assessmentModel,
                category: category,
                channelId,
                subchannelId,
                assignedBy: username || email
            };
            
            // Use the new evaluation API
            console.log(`Sending ${assignmentType} assessment to evaluation API`, payload);
            
            const response = await fetch(`http://localhost:5000/api/evaluation/create-assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            // Log raw response status
            console.log(`API response status: ${response.status}`);
            
            const data = await response.json();
            console.log(`API response data:`, data);
            
            if (data.success) {
                setSuccessMsg(`Assessment successfully assigned to ${subchannelId ? 'subchannel' : 'channel'} (${data.assignmentCount} users)`);
                
                // Mark this channel/subchannel as sent permanently
                setAssigningChannels(prev => ({
                    ...prev,
                    [assignmentKey]: 'sent'
                }));
                
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setErrorMsg(data.message || 'Failed to assign assessment');
                console.error(`Assignment error:`, data);
                setTimeout(() => setErrorMsg(''), 3000);
                
                // Clear the assigning state for this channel/subchannel
                setAssigningChannels(prev => ({
                    ...prev,
                    [assignmentKey]: false
                }));
            }
        } catch (error) {
            console.error('Error assigning assessment:', error);
            setErrorMsg('Failed to assign assessment. Please try again.');
            setTimeout(() => setErrorMsg(''), 3000);
            
            // Clear the assigning state for this channel/subchannel
            const assignmentKey = subchannelId ? `${channelId}-${subchannelId}` : channelId;
            setAssigningChannels(prev => ({
                ...prev,
                [assignmentKey]: false
            }));
        }
    };

    const handleNavigation = (nav) => {
        if (nav === 'home') {
            navigate('/dashboard');
        } else if (nav === 'create') {
            navigate('/dashboard?section=create');
        } else if (nav === 'browse') {
            navigate('/dashboard?section=browse');
        } else if (nav === 'assessment') {
            setActiveNav('assessment');
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

    // Reset success states when changing assessment type
    useEffect(() => {
        // Reset success states when changing assessment type
        setQuizAssessmentSubmitted(false);
        setCodingAssessmentSubmitted(false);
        setWritingAssessmentSubmitted(false);
        setQuizCreated(false);
        setQuizId(null);
        setErrorMsg('');
        setViewingAssessment(null);
    }, [activeAssessment, quizGenerationMode, codingGenerationMode, writingGenerationMode]);
      // Reset states when switching view modes or generation modes
    useEffect(() => {
        setViewingAssessment(null);
        console.log('View mode changed:', {quizViewMode, codingViewMode, writingViewMode});
    }, [quizViewMode, codingViewMode, writingViewMode]);

    useEffect(() => {
        console.log('Generation mode changed:', {writingGenerationMode});
        if (writingGenerationMode) {
            setWritingViewMode(false);
            setViewingAssessment(null);
        }
    }, [writingGenerationMode]);

    // Effect to manage writing assessment state transitions
    useEffect(() => {
        if (activeAssessment === 'writing') {
            if (writingViewMode) {
                // When switching to view mode, clear generation mode
                setWritingGenerationMode('');
                // Fetch assessments if we don't have any
                if (createdWritingAssessments.length === 0 && !isLoadingWritingAssessments) {
                    fetchCreatedWritingAssessments();
                }
            } else if (writingGenerationMode) {
                // When switching to generation mode, clear view mode
                setWritingViewMode(false);
                setViewingAssessment(null);
            }
        }
    }, [activeAssessment, writingViewMode, writingGenerationMode]);

    // Effect to log state changes for debugging
    useEffect(() => {
        if (activeAssessment === 'writing') {
            console.log('Writing Assessment State:', {
                writingGenerationMode,
                writingViewMode,
                viewingAssessment: viewingAssessment?.title || null,
                assessmentsCount: createdWritingAssessments.length,
                isLoading: isLoadingWritingAssessments
            });
        }
    }, [activeAssessment, writingGenerationMode, writingViewMode, viewingAssessment, createdWritingAssessments]);

    const showSuccessMessage = () => {
        const errorElement = document.querySelector('div[style*="background-color: #ffebee"]');
        const textElement = document.querySelector('div[style*="color: #b71c1c"]');

        if (errorElement) errorElement.style.backgroundColor = '#e8f5e9';
        if (textElement) textElement.style.color = '#2e7d32';

        setTimeout(() => {
            setErrorMsg('');
        }, 3000);
    };

    const handleWritingViewClick = async () => {
        console.log("Handling writing view click");
        setWritingViewMode(true);
        setWritingGenerationMode('');
        setViewingAssessment(null);
        await fetchCreatedWritingAssessments();
    };

    // Assignment Modal Component
    const AssignmentModal = () => {
        if (!showAssignModal) return null;
        
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '5px',
                    width: '500px',
                    maxHeight: '80vh',
                    padding: '20px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    overflowY: 'auto'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ margin: 0 }}>
                            Assign {assessmentToAssign?.title || 'Assessment'}
                        </h3>
                        <button 
                            onClick={handleCloseAssignModal}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    
                    {userChannels.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p>You haven't joined any channels yet.</p>
                        </div>
                    ) : (
                        <div>
                            <p style={{ marginBottom: '15px' }}>
                                Select a channel or subchannel to assign this assessment:
                            </p>
                            
                            {userChannels.map(channel => (
                                <div key={channel.id} style={{ marginBottom: '20px' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '4px',
                                        marginBottom: '10px'
                                    }}>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{channel.name}</h4>
                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                {channel.memberCount} members
                                            </span>
                                        </div>                                        <button
                                            onClick={() => handleSendAssessment(channel.id)}
                                            disabled={assigningChannels[channel.id] === true}
                                            style={{
                                                backgroundColor: assigningChannels[channel.id] === 'sent' ? '#4CAF50' : '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: assigningChannels[channel.id] === true ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {assigningChannels[channel.id] === true ? 'Sending...' : 
                                             assigningChannels[channel.id] === 'sent' ? 'Sent' : 'Send'}
                                        </button>
                                    </div>
                                    
                                    {channel.subchannels && channel.subchannels.length > 0 && (
                                        <div style={{ paddingLeft: '20px' }}>
                                            {channel.subchannels.map(subchannel => (
                                                <div key={subchannel.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '8px',
                                                    borderBottom: '1px solid #eee',
                                                    marginBottom: '5px'
                                                }}>
                                                    <div>
                                                        <h5 style={{ margin: 0 }}>{subchannel.name}</h5>
                                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                                            {subchannel.memberCount} members
                                                        </span>
                                                    </div>                                                    <button
                                                        onClick={() => handleSendAssessment(channel.id, subchannel.id)}
                                                        disabled={assigningChannels[`${channel.id}-${subchannel.id}`] === true}
                                                        style={{
                                                            backgroundColor: assigningChannels[`${channel.id}-${subchannel.id}`] === 'sent' ? '#4CAF50' : '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: assigningChannels[`${channel.id}-${subchannel.id}`] === true ? 'not-allowed' : 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        {assigningChannels[`${channel.id}-${subchannel.id}`] === true ? 'Sending...' : 
                                                         assigningChannels[`${channel.id}-${subchannel.id}`] === 'sent' ? 'Sent' : 'Send'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <button 
                            onClick={handleCloseAssignModal}
                            style={{
                                backgroundColor: '#e0e0e0',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginLeft: '10px'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            fontFamily: 'Arial',
            overflow: 'hidden'
        }}>
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
                    Assessment Options
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px'
                }}>
                    <div
                        onClick={() => setActiveAssessment('create-quiz')}
                        style={{
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: activeAssessment === 'create-quiz' ? '#d1e3fa' : 'white',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Quiz Assessments</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Create a new quiz for your channels
                        </div>
                    </div>

                    {activeAssessment === 'create-quiz' && (
                        <div style={{ paddingLeft: '15px', marginBottom: '15px' }}>
                            <div
                                onClick={() => {
                                    setQuizGenerationMode('manual');
                                    setQuizViewMode(false);
                                }}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: quizGenerationMode === 'manual' ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px',
                                    marginBottom: '5px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: quizGenerationMode === 'manual' ? '#1976d2' : '#666' }}>
                                    Generate on your own
                                </div>
                            </div>
                            <div
                                onClick={() => {
                                    setQuizGenerationMode('ai');
                                    setQuizViewMode(false);
                                }}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: quizGenerationMode === 'ai' ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px',
                                    marginBottom: '5px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: quizGenerationMode === 'ai' ? '#1976d2' : '#666' }}>
                                    Generate by AI
                                </div>
                            </div>
                            <div
                                onClick={() => {
                                    setQuizViewMode(true);
                                    setQuizGenerationMode('');
                                    fetchCreatedQuizzes();
                                }}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: quizViewMode ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: quizViewMode ? '#1976d2' : '#666' }}>
                                    My Created Quiz Assessments
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        onClick={() => setActiveAssessment('coding')}
                        style={{
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: activeAssessment === 'coding' ? '#d1e3fa' : 'white',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Coding Assessments</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Create coding challenges
                        </div>
                    </div>

                    {activeAssessment === 'coding' && (
                        <div style={{ paddingLeft: '15px', marginBottom: '15px' }}>
                            <div
                                onClick={() => {
                                    setCodingGenerationMode('manual');
                                    setCodingViewMode(false);
                                }}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: codingGenerationMode === 'manual' ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px',
                                    marginBottom: '5px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: codingGenerationMode === 'manual' ? '#1976d2' : '#666' }}>
                                    Generate on your own
                                </div>
                            </div>
                            <div
                                onClick={() => {
                                    setCodingGenerationMode('ai');
                                    setCodingViewMode(false);
                                }}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: codingGenerationMode === 'ai' ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px',
                                    marginBottom: '5px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: codingGenerationMode === 'ai' ? '#1976d2' : '#666' }}>
                                    Generate by AI
                                </div>
                            </div>
                            <div
                                onClick={() => {
                                    setCodingViewMode(true);
                                    setCodingGenerationMode('');
                                    fetchCreatedCodingAssessments();
                                }}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: codingViewMode ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: codingViewMode ? '#1976d2' : '#666' }}>
                                    My Created Coding Assessments
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        onClick={() => setActiveAssessment('writing')}
                        style={{
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: activeAssessment === 'writing' ? '#d1e3fa' : 'white',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>Writing Assessments</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Create writing assignments
                        </div>
                    </div>

                    {activeAssessment === 'writing' && (
                        <div style={{ paddingLeft: '15px', marginBottom: '15px' }}>
                            <div
                                onClick={() => handleWritingModeChange('manual')}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: writingGenerationMode === 'manual' ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px',
                                    marginBottom: '5px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: writingGenerationMode === 'manual' ? '#1976d2' : '#666' }}>
                                    Generate on your own
                                </div>
                            </div>
                            <div
                                onClick={() => handleWritingModeChange('ai')}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: writingGenerationMode === 'ai' ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px',
                                    borderLeft: writingGenerationMode === 'ai' ? '3px solid #1976d2' : '3px solid transparent',
                                    marginBottom: '5px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: writingGenerationMode === 'ai' ? '#1976d2' : '#666' }}>
                                    Generate by AI
                                </div>
                            </div>
                            <div
                                onClick={handleWritingViewClick}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: writingViewMode ? '#e8f0fe' : 'transparent',
                                    borderRadius: '4px',
                                    marginBottom: '5px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: writingViewMode ? '#1976d2' : '#666' }}>
                                    View Created Assessments
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ 
                flex: 1,
                backgroundColor: '#f5f9ff',
                padding: '20px',
                overflowY: 'auto',
                position: 'relative'
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
                {/* Success message replaced with direct redirection to assessment view */}
                {activeAssessment === 'create-quiz' && (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Create a Quiz</h3>

                        <p style={{ marginBottom: '20px', color: '#555' }}>
                            {quizGenerationMode === 'manual' 
                                ? 'Create a quiz manually for your channels.' 
                                : quizGenerationMode === 'ai' 
                                ? 'Let AI generate a quiz based on your specifications.'
                                : quizViewMode
                                ? 'View your created quiz assessments.'
                                : ''}
                        </p>
                        
                        {/* Quiz manual creation form */}
                        {quizGenerationMode === 'manual' && (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                // Handle manual quiz assessment creation
                                const email = localStorage.getItem('email');
                                if (!email) {
                                    setErrorMsg('You must be logged in to create assessments');
                                    return;
                                }
                                
                                if (questions.length === 0) {
                                    setErrorMsg('Please add at least one question');
                                    return;
                                }
                                
                                if (!assessmentTitle) {
                                    setErrorMsg('Please provide an assessment title');
                                    return;
                                }
                                
                                try {
                                    setIsGenerating(true);
                                    setErrorMsg('Creating quiz...');
                                    
                                    // Send data to the backend
                                    const response = await fetch('http://localhost:5000/api/quiz-manual/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            title: assessmentTitle,
                                            timeLimit,
                                            questions,
                                            email,
                                            expiresIn,
                                            expiryUnit
                                        }),
                                    });
                                    
                                    const data = await response.json();
                                    
                                    if (data.success) {
                                        // Save quiz ID for reference
                                        setQuizId(data.assessmentId);
                                        
                                        // Clear error message
                                        setErrorMsg('');
                                        
                                        // Switch to view mode
                                        setQuizGenerationMode('');
                                        setQuizViewMode(true);
                                        
                                        // Fetch updated quiz list
                                        await fetchCreatedQuizzes();
                                        
                                        // Set the newly created quiz as the one being viewed
                                        const createdQuiz = {
                                            _id: data.assessmentId,
                                            title: assessmentTitle
                                        };
                                        setViewingAssessment(createdQuiz);
                                    } else {
                                        setErrorMsg(data.message || 'Failed to create quiz');
                                    }
                                } catch (error) {
                                    console.error('Error creating quiz:', error);
                                    setErrorMsg('Failed to create quiz. Please try again.');
                                } finally {
                                    setIsGenerating(false);
                                }
                            }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Quiz Title
                                    </label>
                                    <input 
                                        type="text" 
                                        value={assessmentTitle} 
                                        onChange={(e) => setAssessmentTitle(e.target.value)}
                                        placeholder="Enter quiz title" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Time Limit (minutes)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="5" 
                                        max="180" 
                                        value={timeLimit} 
                                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Expires In
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={expiresIn} 
                                            onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                            style={{ 
                                                width: '70%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                        <select 
                                            value={expiryUnit} 
                                            onChange={(e) => setExpiryUnit(e.target.value)}
                                            style={{ 
                                                width: '30%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="hour">Hour(s)</option>
                                            <option value="day">Day(s)</option>
                                            <option value="week">Week(s)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Show current questions if any */}
                                {questions.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>Questions Added ({questions.length})</h4>
                                        <div style={{ 
                                            maxHeight: '200px', 
                                            overflowY: 'auto',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '10px'
                                        }}>
                                            {questions.map((q, index) => (
                                                <div key={index} style={{ 
                                                    marginBottom: '10px',
                                                    padding: '10px',
                                                    backgroundColor: '#f5f5f5',
                                                    borderRadius: '4px'
                                                }}>
                                                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Q{index + 1}: {q.questionText}</p>
                                                    <div>
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} style={{ 
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                marginBottom: '2px'
                                                            }}>
                                                                <span style={{ 
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: q.correctOptions.includes(i) ? '#4caf50' : 'transparent',
                                                                    border: '1px solid #ddd',
                                                                    display: 'inline-block',
                                                                    marginRight: '5px'
                                                                }}></span>
                                                                <span>{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#555' }}>
                                                        Points: {q.points}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Form for adding a new question */}
                                <div style={{ 
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#f5f9ff',
                                    borderRadius: '8px',
                                    border: '1px solid #d1e3fa'
                                }}>
                                    <h4 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Add Question</h4>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Question Text
                                        </label>
                                        <textarea 
                                            value={questionText} 
                                            onChange={(e) => setQuestionText(e.target.value)}
                                            placeholder="Enter your question" 
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd',
                                                minHeight: '80px' 
                                            }} 
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Options (select correct answers)
                                        </label>
                                        {options.map((option, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={correctOptions.includes(index)}
                                                    onChange={() => {
                                                        if (correctOptions.includes(index)) {
                                                            setCorrectOptions(correctOptions.filter(i => i !== index));
                                                        } else {
                                                            setCorrectOptions([...correctOptions, index]);
                                                        }
                                                    }}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <input 
                                                    type="text" 
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...options];
                                                        newOptions[index] = e.target.value;
                                                        setOptions(newOptions);
                                                    }}
                                                    placeholder={`Option ${index + 1}`} 
                                                    style={{ 
                                                        flex: 1,
                                                        padding: '6px', 
                                                        borderRadius: '4px', 
                                                        border: '1px solid #ddd' 
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Points
                                        </label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="100" 
                                            value={points} 
                                            onChange={(e) => setPoints(parseInt(e.target.value))}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!questionText || options.some(o => !o.trim())) {
                                                setErrorMsg('Please provide question text and all options');
                                                return;
                                            }
                                            
                                            if (correctOptions.length === 0) {
                                                setErrorMsg('Please select at least one correct option');
                                                return;
                                            }
                                            
                                            const newQuestion = {
                                                questionText,
                                                options: [...options],
                                                correctOptions: [...correctOptions],
                                                points
                                            };
                                            
                                            setQuestions([...questions, newQuestion]);
                                            
                                            // Reset form for next question
                                            setQuestionText('');
                                            setOptions(['', '', '', '']);
                                            setCorrectOptions([]);
                                            setPoints(10);
                                            setErrorMsg('');
                                        }}
                                        style={{ 
                                            backgroundColor: '#4caf50', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 15px', 
                                            borderRadius: '4px', 
                                            cursor: 'pointer',
                                            marginRight: '10px'
                                        }}
                                    >
                                        Add Question
                                    </button>
                                </div>
                                
                                <div style={{ marginTop: '20px' }}>
                                    <button 
                                        type="submit"
                                        disabled={questions.length === 0 || !assessmentTitle || isGenerating}
                                        style={{ 
                                            backgroundColor: '#1976d2', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 15px', 
                                            borderRadius: '4px', 
                                            cursor: (questions.length === 0 || !assessmentTitle || isGenerating) ? 'not-allowed' : 'pointer',
                                            opacity: (questions.length === 0 || !assessmentTitle || isGenerating) ? 0.7 : 1
                                        }}
                                    >
                                        {isGenerating ? 'Creating...' : 'Create Quiz'}
                                    </button>
                                </div>
                            </form>
                        )}
                        {/* Quiz AI generation form */}
                        {quizGenerationMode === 'ai' && (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setIsGenerating(true);
                                setErrorMsg('');
                                
                                try {
                                    const email = localStorage.getItem('email');
                                    if (!email) {
                                        setErrorMsg('You must be logged in to create assessments');
                                        setIsGenerating(false);
                                        return;
                                    }
                                    
                                    if (!aiQuizTopic) {
                                        setErrorMsg('Topic is required');
                                        setIsGenerating(false);
                                        return;
                                    }
                                    
                                    // Call the new quiz-ai endpoint
                                    const response = await fetch('http://localhost:5000/api/quiz-ai/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            title: assessmentTitle || `${aiDifficulty} Quiz on ${aiQuizTopic}`,
                                            timeLimit: aiTimeLimit,
                                            email,
                                            expiresIn,
                                            expiryUnit,
                                            difficulty: aiDifficulty,
                                            topic: aiQuizTopic,
                                            category: aiQuizCategory || 'General',
                                            numberOfQuestions: aiNumQuestions,
                                            pointsPerQuestion: aiPointsPerQuestion
                                        }),
                                    });
                                    
                                    const data = await response.json();
                                    
                                    if (data.success) {
                                        // Save quiz ID for reference
                                        setQuizId(data.quizId || data.assessmentId);
                                        
                                        // Set quiz created state to true (matches manual behavior)
                                        setQuizCreated(true);
                                        
                                        // Show success message
                                        setErrorMsg('Quiz assessment created successfully!');
                                        showSuccessMessage();
                                        
                                        // Clear error message
                                        setTimeout(() => {
                                            setErrorMsg('');
                                        
                                            // Switch to view mode
                                            setQuizGenerationMode('');
                                            setQuizViewMode(true);
                                            
                                            // Fetch updated quiz list
                                            fetchCreatedQuizzes();
                                            
                                            // Set the newly created quiz as the one being viewed
                                            const createdQuiz = {
                                                _id: data.quizId || data.assessmentId,
                                                title: data.title || aiQuizTopic
                                            };
                                            setViewingAssessment(createdQuiz);
                                        }, 1500);
                                    } else {
                                        setErrorMsg(data.message || 'Failed to create quiz');
                                    }
                                } catch (error) {
                                    console.error('Error generating quiz:', error);
                                    setErrorMsg('Failed to generate quiz. Please try again.');
                                } finally {
                                    setIsGenerating(false);
                                }
                            }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Quiz Topic
                                    </label>
                                    <input 
                                        type="text" 
                                        value={aiQuizTopic} 
                                        onChange={(e) => setAiQuizTopic(e.target.value)}
                                        placeholder="e.g., JavaScript Basics, World History, Science" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Difficulty
                                    </label>
                                    <select 
                                        value={aiDifficulty} 
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Number of Questions
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="20" 
                                        value={aiNumQuestions} 
                                        onChange={(e) => setAiNumQuestions(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Points per Question
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="100" 
                                        value={aiPointsPerQuestion} 
                                        onChange={(e) => setAiPointsPerQuestion(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Time Limit (minutes)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="5" 
                                        max="180" 
                                        value={aiTimeLimit} 
                                        onChange={(e) => setAiTimeLimit(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Expires In
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={expiresIn} 
                                            onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                            style={{ 
                                                width: '70%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                        <select 
                                            value={expiryUnit} 
                                            onChange={(e) => setExpiryUnit(e.target.value)}
                                            style={{ 
                                                width: '30%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="hour">Hour(s)</option>
                                            <option value="day">Day(s)</option>
                                            <option value="week">Week(s)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={isGenerating || !aiQuizTopic}
                                    style={{ 
                                        backgroundColor: '#1976d2', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '10px 15px', 
                                        borderRadius: '4px', 
                                        cursor: (isGenerating || !aiQuizTopic) ? 'not-allowed' : 'pointer',
                                        opacity: (isGenerating || !aiQuizTopic) ? 0.7 : 1
                                    }}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Quiz'}
                                </button>
                            </form>
                        )}
                        {/* Quiz Assessment View Mode */}
                        {quizViewMode && !viewingAssessment && !quizGenerationMode && (
                            <div>
                                <h4>My Created Quiz Assessments</h4>
                                {createdQuizzes.length === 0 ? (
                                    <p>You haven't created any quiz assessments yet.</p>
                                ) : (
                                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                        {createdQuizzes.map(quiz => (
                                            <div 
                                                key={quiz._id} 
                                                style={{ 
                                                    padding: '15px',
                                                    marginBottom: '10px', 
                                                    backgroundColor: '#f5f5f5', 
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >                                                <div>
                                                    <h4 style={{ margin: 0 }}>{quiz.title}</h4>
                                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                                        Time Limit: {quiz.timeLimit} minutes | 
                                                        Questions: {quiz.questions?.length || 0}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                                        Created: {new Date(quiz.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        onClick={() => handleOpenAssignModal(quiz, 'quiz')}
                                                        style={{
                                                            backgroundColor: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Assign
                                                    </button>
                                                    <button
                                                        onClick={() => setViewingAssessment(quiz)}
                                                        style={{
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setQuizViewMode(false);
                                        setQuizGenerationMode('manual');
                                    }}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back to Quiz Creation
                                </button>
                            </div>
                        )}
                        {/* Individual Quiz Assessment View */}
                        {quizViewMode && viewingAssessment && !quizGenerationMode && (
                            <div>
                                <h4>{viewingAssessment.title}</h4>
                                {/* Check if we have full assessment details */}
                                {viewingAssessment.questions ? (
                                    <div>
                                        <p><strong>Time Limit:</strong> {viewingAssessment.timeLimit} minutes</p>
                                        <h4>Questions:</h4>
                                        {viewingAssessment.questions.map((question, index) => (
                                            <div 
                                                key={index}
                                                style={{ 
                                                    padding: '15px', 
                                                    marginBottom: '10px', 
                                                    backgroundColor: '#f5f5f5', 
                                                    borderRadius: '4px' 
                                                }}
                                            >
                                                <p style={{ fontWeight: 'bold' }}>Question {index + 1}: {question.questionText}</p>
                                                <div style={{ marginLeft: '15px' }}>
                                                    {question.options.map((option, optIndex) => (
                                                        <div key={optIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                                            <div style={{ 
                                                                width: '16px', 
                                                                height: '16px', 
                                                                borderRadius: '50%',
                                                                border: '1px solid #aaa',
                                                                backgroundColor: question.correctOptions.includes(optIndex) ? '#4caf50' : 'transparent',
                                                                marginRight: '10px'
                                                            }}></div>
                                                            {option}
                                                        </div>
                                                    ))}
                                                    <p style={{ marginTop: '10px', fontSize: '14px' }}>Points: {question.points}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Fetch and display full assessment details
                                    <div>
                                        <p>Loading assessment details...</p>
                                        <button 
                                            onClick={() => fetchFullQuizDetails(viewingAssessment._id)}
                                            style={{
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Load Details
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setViewingAssessment(null)}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back to Assessment List
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeAssessment === 'coding' && (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Create Coding Assessment</h3>

                        <p style={{ marginBottom: '20px', color: '#555' }}>
                            {codingGenerationMode === 'manual' 
                                ? 'Create coding challenges manually for your channels.' 
                                : codingGenerationMode === 'ai' 
                                ? 'Let AI generate coding challenges based on your specifications.'
                                : codingViewMode
                                ? 'View your created coding assessments.'
                                : ''}
                        </p>
                        {/* Coding Assessment View Mode */}
                        {activeAssessment === 'coding' && codingViewMode && !viewingAssessment && !codingGenerationMode && (
                            <div>
                                <h4>My Created Coding Assessments</h4>
                                {createdCodingAssessments && createdCodingAssessments.length === 0 ? (
                                    <p>You haven't created any coding assessments yet.</p>
                                ) : createdCodingAssessments ? (
                                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                        {createdCodingAssessments.map(assessment => (
                                            <div 
                                                key={assessment._id} 
                                                style={{ 
                                                    padding: '15px',
                                                    marginBottom: '10px', 
                                                    backgroundColor: '#f5f5f5', 
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{assessment.title}</h4>
                                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                                        Time Limit: {assessment.timeLimit} minutes | 
                                                        Questions: {assessment.questions?.length || 0}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                                        Created: {new Date(assessment.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        onClick={() => handleOpenAssignModal(assessment, 'coding')}
                                                        style={{
                                                            backgroundColor: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Assign
                                                    </button>
                                                    <button
                                                        onClick={() => setViewingAssessment(assessment)}
                                                        style={{
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                                <button
                                    onClick={() => {
                                        setCodingViewMode(false);
                                        setCodingGenerationMode('manual');
                                    }}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back to Coding Assessment Creation
                                </button>
                            </div>
                        )}
                        {/* Individual Coding Assessment View */}
                        {activeAssessment === 'coding' && codingViewMode && viewingAssessment && !codingGenerationMode && (
                            <div>
                                <h4>{viewingAssessment.title}</h4>
                                {/* Check if we have full assessment details */}
                                {viewingAssessment.questions ? (
                                    <div>
                                        <p><strong>Time Limit:</strong> {viewingAssessment.timeLimit} minutes</p>
                                        <h4>Questions:</h4>
                                        {viewingAssessment.questions.map((question, index) => (
                                            <div 
                                                key={index}
                                                style={{ 
                                                    padding: '15px', 
                                                    marginBottom: '10px', 
                                                    backgroundColor: '#f5f5f5', 
                                                    borderRadius: '4px' 
                                                }}
                                            >
                                                <p style={{ fontWeight: 'bold' }}>Question {index + 1}: {question.questionText}</p>
                                                <div style={{ marginLeft: '15px' }}>
                                                    <p><strong>Problem:</strong> {question.problemDescription}</p>
                                                    {question.starterCode && (
                                                        <div>
                                                            <p><strong>Starter Code:</strong></p>
                                                            <pre style={{ 
                                                                backgroundColor: '#f0f0f0', 
                                                                padding: '10px',
                                                                overflow: 'auto',
                                                                borderRadius: '4px'
                                                            }}>
                                                                {question.starterCode}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {question.expectedOutput && (
                                                        <p><strong>Expected Output:</strong> {question.expectedOutput}</p>
                                                    )}
                                                    <p><strong>Language:</strong> {question.programmingLanguage}</p>
                                                    <p><strong>Difficulty:</strong> {question.difficulty}</p>
                                                    <p style={{ marginTop: '10px', fontSize: '14px' }}>Points: {question.points}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Fetch and display full assessment details
                                    <div>
                                        <p>Loading assessment details...</p>
                                        <button 
                                            onClick={() => fetchFullCodingDetails(viewingAssessment._id)}
                                            style={{
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Load Details
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setViewingAssessment(null)}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back to Assessment List
                                </button>
                            </div>
                        )}
                        
                        {activeAssessment === 'coding' && codingGenerationMode === 'ai' && !codingViewMode && (
                            <form onSubmit={handleGenerateCodingAssessment}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Topic/Concept
                                    </label>
                                    <input 
                                        type="text" 
                                        value={codingTopic} 
                                        onChange={(e) => setCodingTopic(e.target.value)}
                                        placeholder="e.g., Array Manipulation, Recursion, Data Structures" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Programming Language
                                    </label>
                                    <select 
                                        value={programmingLanguage} 
                                        onChange={(e) => setProgrammingLanguage(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="JavaScript">JavaScript</option>
                                        <option value="Python">Python</option>
                                        <option value="Java">Java</option>
                                        <option value="C++">C++</option>
                                        <option value="C#">C#</option>
                                        <option value="Go">Go</option>
                                        <option value="Ruby">Ruby</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Difficulty
                                    </label>
                                    <select 
                                        value={aiDifficulty} 
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Number of Questions
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="10" 
                                        value={aiNumCodingQuestions} 
                                        onChange={(e) => setAiNumCodingQuestions(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Points per Question
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="100" 
                                        value={aiPointsPerQuestion} 
                                        onChange={(e) => setAiPointsPerQuestion(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Time Limit (minutes)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="5" 
                                        max="180" 
                                        value={aiTimeLimit} 
                                        onChange={(e) => setAiTimeLimit(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Expires In
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={expiresIn} 
                                            onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                            style={{ 
                                                width: '70%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                        <select 
                                            value={expiryUnit} 
                                            onChange={(e) => setExpiryUnit(e.target.value)}
                                            style={{ 
                                                width: '30%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="hour">Hour(s)</option>
                                            <option value="day">Day(s)</option>
                                            <option value="week">Week(s)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Evaluation Instructions (Optional)
                                    </label>
                                    <textarea
                                        value={aiCodingEvalInstructions}
                                        onChange={(e) => setAiCodingEvalInstructions(e.target.value)}
                                        placeholder="Specific instructions for evaluating this coding assessment"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            minHeight: '80px'
                                        }}
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={isGenerating}
                                    style={{ 
                                        backgroundColor: '#1976d2', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '10px 15px', 
                                        borderRadius: '4px', 
                                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                                        opacity: isGenerating ? 0.7 : 1 
                                    }}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Coding Assessment'}
                                </button>
                            </form>
                        )}
                        
                        {activeAssessment === 'coding' && codingGenerationMode === 'manual' && !codingViewMode && (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                // Handle manual coding assessment creation
                                const email = localStorage.getItem('email');
                                if (!email) {
                                    setErrorMsg('You must be logged in to create assessments');
                                    return;
                                }
                                
                                if (codingQuestions.length === 0) {
                                    setErrorMsg('Please add at least one coding question');
                                    return;
                                }
                                
                                if (!aiCodingTitle) {
                                    setErrorMsg('Please provide an assessment title');
                                    return;
                                }
                                
                                try {
                                    setIsGenerating(true);
                                    setErrorMsg('Creating manual coding assessment...');
                                    
                                    // Deep inspect each question's structure to ensure it has required fields
                                    const validatedQuestions = codingQuestions.map(q => ({
                                        questionText: q.questionText,
                                        problemDescription: q.problemDescription || 'No description provided',
                                        starterCode: q.starterCode || '',
                                        expectedOutput: q.expectedOutput || '',
                                        difficulty: q.difficulty || 'moderate',
                                        programmingLanguage: q.programmingLanguage || programmingLanguage,
                                        points: q.points || 10
                                    }));
                                    
                                    // This is our form data with validated questions
                                    const formData = {
                                        title: aiCodingTitle,
                                        timeLimit,
                                        questions: validatedQuestions,
                                        email,
                                        expiresIn,
                                        expiryUnit
                                    };
                                    console.log('Sending coding assessment data:', JSON.stringify(formData, null, 2));
                                    
                                    // Send data to the backend using the new dedicated endpoint
                                    const response = await fetch('http://localhost:5000/api/coding-manual/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(formData),
                                    });
                                    
                                    console.log('Response status:', response.status);
                                    
                                    // Check if response is valid JSON before parsing
                                    const contentType = response.headers.get("content-type");
                                    if (contentType && contentType.indexOf("application/json") !== -1) {
                                        const data = await response.json();
                                        console.log('Response data:', data);
                                        
                                        if (data.success) {
                                            // Save assessment ID for reference
                                            setQuizId(data.assessmentId);
                                            
                                            // Clear error message
                                            setErrorMsg('');
                                            
                                            // Instead of showing popup, switch to view mode
                                            setCodingGenerationMode('');
                                            setCodingViewMode(true);
                                            
                                            // Fetch updated coding assessment list
                                            await fetchCreatedCodingAssessments();
                                            
                                            // Set the newly created assessment as the one being viewed
                                            const createdAssessment = {
                                                _id: data.assessmentId,
                                                title: aiCodingTitle
                                            };
                                            setViewingAssessment(createdAssessment);
                                        } else {
                                            // Display detailed error messages if available
                                            if (data.errors && Array.isArray(data.errors)) {
                                                setErrorMsg(`Validation errors: ${data.errors.join(', ')}`);
                                            } else {
                                                setErrorMsg(data.message || 'Failed to create coding assessment');
                                            }
                                        }
                                    } else {
                                        // Handle non-JSON response (like HTML error page)
                                        const textResponse = await response.text();
                                        console.error('Server returned non-JSON response:', textResponse.substring(0, 200) + '...');
                                        setErrorMsg(`Server error: Received non-JSON response (HTTP ${response.status})`);
                                    }
                                } catch (error) {
                                    console.error('Error creating coding assessment:', error);
                                    setErrorMsg(`Failed to create coding assessment: ${error.message}`);
                                } finally {
                                    setIsGenerating(false);
                                }
                            }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Assessment Title
                                    </label>
                                    <input 
                                        type="text" 
                                        value={aiCodingTitle} 
                                        onChange={(e) => setAiCodingTitle(e.target.value)}
                                        placeholder="Enter assessment title" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Programming Language
                                    </label>
                                    <select 
                                        value={programmingLanguage} 
                                        onChange={(e) => setProgrammingLanguage(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="JavaScript">JavaScript</option>
                                        <option value="Python">Python</option>
                                        <option value="Java">Java</option>
                                        <option value="C++">C++</option>
                                        <option value="C#">C#</option>
                                        <option value="Go">Go</option>
                                        <option value="Ruby">Ruby</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Time Limit (minutes)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="5" 
                                        max="180" 
                                        value={timeLimit} 
                                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Expires In
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={expiresIn} 
                                            onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                            style={{ 
                                                width: '70%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                        <select 
                                            value={expiryUnit} 
                                            onChange={(e) => setExpiryUnit(e.target.value)}
                                            style={{ 
                                                width: '30%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="hour">Hour(s)</option>
                                            <option value="day">Day(s)</option>
                                            <option value="week">Week(s)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Show current coding questions if any */}
                                {codingQuestions.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>Coding Questions Added ({codingQuestions.length})</h4>
                                        <div style={{ 
                                            maxHeight: '200px', 
                                            overflowY: 'auto',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '10px'
                                        }}>
                                            {codingQuestions.map((q, index) => (
                                                <div key={index} style={{ 
                                                    marginBottom: '10px',
                                                    padding: '10px',
                                                    backgroundColor: '#f5f5f5',
                                                    borderRadius: '4px'
                                                }}>
                                                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Q{index + 1}: {q.questionText}</p>
                                                    <p style={{ marginBottom: '5px' }}><strong>Language:</strong> {q.programmingLanguage}</p>
                                                    <p style={{ marginBottom: '5px' }}><strong>Difficulty:</strong> {q.difficulty}</p>
                                                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#555' }}>
                                                        Points: {q.points}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Form for adding a new coding question */}
                                <div style={{ 
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#f5f9ff',
                                    borderRadius: '8px',
                                    border: '1px solid #d1e3fa'
                                }}>
                                    <h4 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Add Coding Question</h4>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Question Title
                                        </label>
                                        <input 
                                            type="text" 
                                            value={codingQuestionText} 
                                            onChange={(e) => setCodingQuestionText(e.target.value)}
                                            placeholder="E.g., 'Implement a function to reverse a linked list'" 
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd'
                                            }} 
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Problem Description
                                        </label>
                                        <textarea 
                                            value={codingProblemDescription} 
                                            onChange={(e) => setCodingProblemDescription(e.target.value)}
                                            placeholder="Provide a detailed description of the problem to solve" 
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd',
                                                minHeight: '100px' 
                                            }} 
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Starter Code (Optional)
                                        </label>
                                        <textarea 
                                            value={codingStarterCode} 
                                            onChange={(e) => setCodingStarterCode(e.target.value)}
                                            placeholder="Provide starter code for the student"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd',
                                                minHeight: '100px',
                                                fontFamily: 'monospace' 
                                            }} 
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Expected Output / Test Cases
                                        </label>
                                        <textarea 
                                            value={codingExpectedOutput} 
                                            onChange={(e) => setCodingExpectedOutput(e.target.value)}
                                            placeholder="Describe the expected output or provide test cases"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd',
                                                minHeight: '80px' 
                                            }} 
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Difficulty
                                        </label>
                                        <select 
                                            value={codingDifficulty} 
                                            onChange={(e) => setCodingDifficulty(e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Points
                                        </label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="100" 
                                            value={codingPoints} 
                                            onChange={(e) => setCodingPoints(parseInt(e.target.value))}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!codingQuestionText || !codingProblemDescription) {
                                                setErrorMsg('Please provide a question title and problem description');
                                                return;
                                            }
                                            
                                            const newCodingQuestion = {
                                                questionText: codingQuestionText,
                                                problemDescription: codingProblemDescription,
                                                starterCode: codingStarterCode,
                                                expectedOutput: codingExpectedOutput,
                                                difficulty: codingDifficulty,
                                                programmingLanguage,
                                                points: codingPoints
                                            };
                                            
                                            setCodingQuestions([...codingQuestions, newCodingQuestion]);
                                            
                                            // Reset form
                                            setCodingQuestionText('');
                                            setCodingProblemDescription('');
                                            setCodingStarterCode('');
                                            setCodingExpectedOutput('');
                                            setCodingDifficulty('moderate');
                                            setCodingPoints(10);
                                            setErrorMsg('');
                                        }}
                                        style={{ 
                                            backgroundColor: '#4caf50', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 15px', 
                                            borderRadius: '4px', 
                                            cursor: 'pointer',
                                            marginRight: '10px'
                                        }}
                                    >
                                        Add Question
                                    </button>
                                </div>
                                  <div style={{ marginTop: '20px' }}>
                                    <button                                        type="submit"
                                        disabled={codingQuestions.length === 0 || !aiCodingTitle}
                                        style={{ 
                                            backgroundColor: '#1976d2', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 15px', 
                                            borderRadius: '4px', 
                                            cursor: codingQuestions.length === 0 || !aiCodingTitle ? 'not-allowed' : 'pointer',
                                            opacity: codingQuestions.length === 0 || !aiCodingTitle ? 0.7 : 1
                                        }}
                                    >
                                        Create Coding Assessment
                                    </button>
                                </div>
                                
                                <button
                                    onClick={() => setViewingAssessment(null)}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back to Assessment List
                                </button>
                            </form>
                        )}                          {activeAssessment === 'writing' && writingGenerationMode === 'ai' && !writingViewMode && !viewingAssessment && (
                            <form onSubmit={handleGenerateWritingAssessment}>
                                <div style={{ marginBottom: '15px', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '5px' }}>
                                    <p style={{ fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>Writing AI Form Visible</p>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Topic/Subject
                                    </label>
                                    <input 
                                        type="text" 
                                        value={writingTopic} 
                                        onChange={(e) => setWritingTopic(e.target.value)}
                                        placeholder="e.g., Climate Change, Literature Analysis, Technical Documentation" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Writing Type
                                    </label>
                                    <select 
                                        value={writingType} 
                                        onChange={(e) => setWritingType(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="essay">Essay</option>
                                        <option value="short-answer">Short Answer</option>
                                        <option value="technical-document">Technical Document</option>
                                        <option value="creative-writing">Creative Writing</option>
                                        <option value="analysis">Analysis</option>
                                        <option value="research-paper">Research Paper</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Difficulty
                                    </label>
                                    <select 
                                        value={aiDifficulty} 
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Number of Questions
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="5" 
                                        value={aiNumWritingQuestions} 
                                        onChange={(e) => setAiNumWritingQuestions(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Points per Question
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="100" 
                                        value={aiPointsPerQuestion} 
                                        onChange={(e) => setAiPointsPerQuestion(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Time Limit (minutes)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="5" 
                                        max="180" 
                                        value={aiTimeLimit} 
                                        onChange={(e) => setAiTimeLimit(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Expires In
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={expiresIn} 
                                            onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                            style={{ 
                                                width: '70%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                        <select 
                                            value={expiryUnit} 
                                            onChange={(e) => setExpiryUnit(e.target.value)}
                                            style={{ 
                                                width: '30%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="hour">Hour(s)</option>
                                            <option value="day">Day(s)</option>
                                            <option value="week">Week(s)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Evaluation Instructions (Optional)
                                    </label>
                                    <textarea
                                        value={aiWritingEvalInstructions}
                                        onChange={(e) => setAiWritingEvalInstructions(e.target.value)}
                                        placeholder="Specific instructions for evaluating this writing assessment"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            minHeight: '80px'
                                        }}
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={isGenerating}
                                    style={{ 
                                        backgroundColor: '#1976d2', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '10px 15px', 
                                        borderRadius: '4px', 
                                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                                        opacity: isGenerating ? 0.7 : 1 
                                    }}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Writing Assessment'}
                                </button>                            </form>
                        )}
                          {activeAssessment === 'writing' && writingGenerationMode === 'manual' && !writingViewMode && !viewingAssessment && (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                console.log("Writing manual form submitted");
                                console.log("activeAssessment:", activeAssessment);
                                console.log("writingGenerationMode:", writingGenerationMode);
                                console.log("writingViewMode:", writingViewMode);
                                // Handle manual writing assessment creation
                                const email = localStorage.getItem('email');
                                if (!email) {
                                    setErrorMsg('You must be logged in to create assessments');
                                    return;
                                }
                                
                                if (writingQuestions.length === 0) {
                                    setErrorMsg('Please add at least one writing question');
                                    return;
                                }
                                
                                if (!aiWritingTitle) {
                                    setErrorMsg('Please provide an assessment title');
                                    return;
                                }
                                
                                try {
                                    setIsGenerating(true);
                                    setErrorMsg('Creating manual writing assessment...');
                                    
                                    // Deep inspect each question's structure to ensure it has required fields
                                    const validatedQuestions = writingQuestions.map(q => ({
                                        questionText: q.questionText,
                                        prompt: q.prompt || 'No prompt provided', // Ensure prompt field exists
                                        instructions: q.instructions || '',
                                        wordLimit: q.wordLimit || 500,
                                        difficulty: q.difficulty || 'moderate',
                                        writingType: q.writingType || writingType,
                                        points: q.points || 10
                                    }));
                                    
                                    // This is our form data with validated questions
                                    const formData = {
                                        title: aiWritingTitle,
                                        timeLimit,
                                        questions: validatedQuestions,
                                        email,
                                        expiresIn,
                                        expiryUnit,
                                        writingType
                                    };
                                    console.log('Sending writing assessment data:', JSON.stringify(formData, null, 2));
                                    
                                    // Send data to the backend using the new dedicated endpoint
                                    const response = await fetch('http://localhost:5000/api/writing-manual/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(formData),
                                    });
                                    
                                    console.log('Response status:', response.status);
                                    
                                    // Check if response is valid JSON before parsing
                                    const contentType = response.headers.get("content-type");
                                    if (contentType && contentType.indexOf("application/json") !== -1) {
                                        const data = await response.json();
                                        console.log('Response data:', data);
                                        
                                        if (data.success) {
                                            // Save assessment ID for reference
                                            setQuizId(data.assessmentId);
                                            
                                            // Clear error message
                                            setErrorMsg('');
                                            
                                            // Instead of showing popup, switch to view mode
                                            setWritingGenerationMode('');
                                            setWritingViewMode(true);
                                            
                                            // Fetch updated writing assessment list
                                            await fetchCreatedWritingAssessments();
                                            
                                            // Set the newly created assessment as the one being viewed
                                            const createdAssessment = {
                                                _id: data.assessmentId,
                                                title: aiWritingTitle
                                            };
                                            setViewingAssessment(createdAssessment);
                                        } else {
                                            // Display detailed error messages if available
                                            if (data.errors && Array.isArray(data.errors)) {
                                                setErrorMsg(`Validation errors: ${data.errors.join(', ')}`);
                                            } else {
                                                setErrorMsg(data.message || 'Failed to create writing assessment');
                                            }
                                        }
                                    } else {
                                        // Handle non-JSON response (like HTML error page)
                                        const textResponse = await response.text();
                                        console.error('Server returned non-JSON response:', textResponse.substring(0, 200) + '...');
                                        setErrorMsg(`Server error: Received non-JSON response (HTTP ${response.status})`);
                                    }
                                } catch (error) {
                                    console.error('Error creating writing assessment:', error);
                                    setErrorMsg(`Failed to create writing assessment: ${error.message}`);
                                } finally {
                                    setIsGenerating(false);
                                }
                            }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Assessment Title
                                    </label>
                                    <input 
                                        type="text" 
                                        value={aiWritingTitle} 
                                        onChange={(e) => setAiWritingTitle(e.target.value)}
                                        placeholder="Enter assessment title" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Writing Type
                                    </label>
                                    <select 
                                        value={writingType} 
                                        onChange={(e) => setWritingType(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="essay">Essay</option>
                                        <option value="short-answer">Short Answer</option>
                                        <option value="technical-document">Technical Document</option>
                                        <option value="creative-writing">Creative Writing</option>
                                        <option value="analysis">Analysis</option>
                                        <option value="research-paper">Research Paper</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Time Limit (minutes)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="5" 
                                        max="180" 
                                        value={timeLimit} 
                                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Expires In
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={expiresIn} 
                                            onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                            style={{ 
                                                width: '70%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                        <select 
                                            value={expiryUnit} 
                                            onChange={(e) => setExpiryUnit(e.target.value)}
                                            style={{ 
                                                width: '30%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="hour">Hour(s)</option>
                                            <option value="day">Day(s)</option>
                                            <option value="week">Week(s)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Show current writing questions if any */}
                                {writingQuestions.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>Writing Questions Added ({writingQuestions.length})</h4>
                                        <div style={{ 
                                            maxHeight: '200px', 
                                            overflowY: 'auto',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '10px'
                                        }}>
                                            {writingQuestions.map((q, index) => (
                                                <div key={index} style={{ 
                                                    marginBottom: '10px',
                                                    padding: '10px',
                                                    backgroundColor: '#f5f5f5',
                                                    borderRadius: '4px'
                                                }}>
                                                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Q{index + 1}: {q.questionText}</p>
                                                    <p style={{ marginBottom: '5px' }}><strong>Type:</strong> {q.writingType}</p>
                                                    <p style={{ marginBottom: '5px' }}><strong>Difficulty:</strong> {q.difficulty}</p>
                                                    <p style={{ marginBottom: '5px' }}><strong>Word Limit:</strong> {q.wordLimit} words</p>
                                                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#555' }}>
                                                        Points: {q.points}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Form for adding a new writing question */}
                                <div style={{ 
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#f5f9ff',
                                    borderRadius: '8px',
                                    border: '1px solid #d1e3fa'
                                }}>
                                    <h4 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Add Writing Question</h4>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Question Title
                                        </label>
                                        <input 
                                            type="text" 
                                            value={writingQuestionText} 
                                            onChange={(e) => setWritingQuestionText(e.target.value)}
                                            placeholder="E.g., 'Analyze the impact of climate change'" 
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd'
                                            }} 
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Writing Prompt
                                        </label>
                                        <textarea 
                                            value={writingPrompt} 
                                            onChange={(e) => setWritingPrompt(e.target.value)}
                                            placeholder="Provide the main prompt or question for the student to respond to" 
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd',
                                                minHeight: '100px' 
                                            }} 
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Additional Instructions (Optional)
                                        </label>
                                        <textarea 
                                            value={writingInstructions} 
                                            onChange={(e) => setWritingInstructions(e.target.value)}
                                            placeholder="Provide any additional instructions or guidelines"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd',
                                                minHeight: '80px'
                                            }} 
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Word Limit
                                        </label>
                                        <input 
                                            type="number" 
                                            min="50" 
                                            max="5000" 
                                            value={writingWordLimit} 
                                            onChange={(e) => setWritingWordLimit(parseInt(e.target.value))}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Difficulty
                                        </label>
                                        <select 
                                            value={writingDifficulty} 
                                            onChange={(e) => setWritingDifficulty(e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Points
                                        </label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="100" 
                                            value={writingPoints} 
                                            onChange={(e) => setWritingPoints(parseInt(e.target.value))}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd' 
                                            }} 
                                        />
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!writingQuestionText || !writingPrompt) {
                                                setErrorMsg('Please provide a question title and writing prompt');
                                                return;
                                            }
                                            
                                            const newWritingQuestion = {
                                                questionText: writingQuestionText,
                                                prompt: writingPrompt,
                                                instructions: writingInstructions,
                                                wordLimit: writingWordLimit,
                                                difficulty: writingDifficulty,
                                                writingType: writingType,
                                                points: writingPoints
                                            };
                                            
                                            setWritingQuestions([...writingQuestions, newWritingQuestion]);
                                            
                                            // Reset form
                                            setWritingQuestionText('');
                                            setWritingPrompt('');
                                            setWritingInstructions('');
                                            setWritingWordLimit(500);
                                            setWritingDifficulty('moderate');
                                            setWritingPoints(10);
                                            setErrorMsg('');
                                        }}
                                        style={{ 
                                            backgroundColor: '#4caf50', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 15px', 
                                            borderRadius: '4px', 
                                            cursor: 'pointer',
                                            marginRight: '10px'
                                        }}
                                    >
                                        Add Question
                                    </button>
                                </div>
                                
                                <div style={{ marginTop: '20px' }}>
                                    <button 
                                        type="submit"
                                        disabled={writingQuestions.length === 0 || !aiWritingTitle}
                                        style={{ 
                                            backgroundColor: '#1976d2', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 15px', 
                                            borderRadius: '4px', 
                                            cursor: writingQuestions.length === 0 || !aiWritingTitle ? 'not-allowed' : 'pointer',
                                            opacity: writingQuestions.length === 0 || !aiWritingTitle ? 0.7 : 1
                                        }}
                                    >                                        Create Writing Assessment
                                    </button>
                                </div>
                            </form>
                        )}
                          {/* Writing Assessment View Mode */}
                        {activeAssessment === 'writing' && writingViewMode && !viewingAssessment && !writingGenerationMode && (
                            <div>
                                <h4>My Created Writing Assessments</h4>
                                {!createdWritingAssessments || createdWritingAssessments.length === 0 ? (
                                    <div>
                                        <p>You haven't created any writing assessments yet.</p>
                                        <button
                                            onClick={() => {
                                                setWritingViewMode(false);
                                                setWritingGenerationMode('ai');
                                                console.log("Switching to AI writing mode from empty state");
                                            }}
                                            style={{
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginTop: '10px'
                                            }}
                                        >
                                            Create New Writing Assessment
                                        </button>
                                        <button
                                            onClick={() => fetchCreatedWritingAssessments()}
                                            style={{
                                                backgroundColor: '#f0f0f0',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                marginTop: '10px',
                                                marginLeft: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Refresh List
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                        {createdWritingAssessments.map(assessment => (
                                            <div 
                                                key={assessment._id} 
                                                style={{ 
                                                    padding: '15px',
                                                    marginBottom: '10px', 
                                                    backgroundColor: '#f5f5f5', 
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{assessment.title}</h4>
                                                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                                        Time Limit: {assessment.timeLimit} minutes | 
                                                        Questions: {assessment.questions?.length || 0}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                                        Created: {new Date(assessment.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        onClick={() => handleOpenAssignModal(assessment, 'writing')}
                                                        style={{
                                                            backgroundColor: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Assign
                                                    </button>
                                                    <button
                                                        onClick={() => setViewingAssessment(assessment)}
                                                        style={{
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setWritingViewMode(false);
                                        setWritingGenerationMode('manual');
                                    }}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back to Writing Assessment Creation
                                </button>
                            </div>
                        )}
                        
                        {/* Individual Writing Assessment View */}
                        {activeAssessment === 'writing' && writingViewMode && viewingAssessment && !writingGenerationMode && (
                            <div>
                                <h4>{viewingAssessment.title}</h4>
                                {/* Check if we have full assessment details */}
                                {viewingAssessment.questions ? (
                                    <div>
                                        <p><strong>Time Limit:</strong> {viewingAssessment.timeLimit} minutes</p>
                                        <h4>Questions:</h4>
                                        {viewingAssessment.questions.map((question, index) => (
                                            <div 
                                                key={index}
                                                style={{ 
                                                    padding: '15px', 
                                                    marginBottom: '10px', 
                                                    backgroundColor: '#f5f5f5', 
                                                    borderRadius: '4px' 
                                                }}
                                            >
                                                <p style={{ fontWeight: 'bold' }}>Question {index + 1}: {question.questionText}</p>
                                                <div style={{ marginLeft: '15px' }}>
                                                    <p><strong>Prompt:</strong> {question.prompt}</p>
                                                    {question.instructions && (
                                                        <p><strong>Instructions:</strong> {question.instructions}</p>
                                                    )}
                                                    <p><strong>Word Limit:</strong> {question.wordLimit} words</p>
                                                    <p><strong>Type:</strong> {question.writingType || viewingAssessment.writingType}</p>
                                                    <p><strong>Difficulty:</strong> {question.difficulty}</p>
                                                    <p style={{ marginTop: '10px', fontSize: '14px' }}>Points: {question.points}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Fetch and display full assessment details
                                    <div>
                                        <p>Loading assessment details...</p>
                                        <button 
                                            onClick={() => fetchFullWritingDetails(viewingAssessment._id)}
                                            style={{
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Load Details
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setViewingAssessment(null)}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Back to Assessment List
                                </button>
                            </div>
                        )}
                        
                        {/* Success message replaced with direct redirection to assessment view */}
                    </div>
                )}
                {activeAssessment === 'create-writing' && (                    <WritingViewSection
                        writingViewMode={writingViewMode}
                        viewingAssessment={viewingAssessment}
                        writingGenerationMode={writingGenerationMode}
                        createdWritingAssessments={createdWritingAssessments}
                        handleOpenAssignModal={handleOpenAssignModal}
                        setViewingAssessment={setViewingAssessment}
                        setWritingViewMode={setWritingViewMode}
                        setWritingGenerationMode={setWritingGenerationMode}
                        isLoadingWritingAssessments={isLoadingWritingAssessments}
                    />
                )}

                {activeAssessment === 'writing' && (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ color: '#1976d2', marginTop: 0, marginBottom: '15px' }}>Writing Assessment</h3>
                        
                        <p style={{ marginBottom: '20px', color: '#555' }}>
                            {writingGenerationMode === 'manual' 
                                ? 'Create writing assignments manually for your channels.' 
                                : writingGenerationMode === 'ai' 
                                ? 'Let AI generate writing assignments based on your specifications.'
                                : writingViewMode
                                ? 'View your created writing assessments.'
                                : 'Select an option to create or view writing assessments.'}
                        </p>
                        
                        {/* Writing section forms, views, and controls */}
                        <WritingViewSection
                            writingViewMode={writingViewMode}
                            viewingAssessment={viewingAssessment}
                            writingGenerationMode={writingGenerationMode}
                            createdWritingAssessments={createdWritingAssessments}
                            handleOpenAssignModal={handleOpenAssignModal}
                            setViewingAssessment={setViewingAssessment}
                            setWritingViewMode={setWritingViewMode}
                            setWritingGenerationMode={setWritingGenerationMode}
                            isLoadingWritingAssessments={isLoadingWritingAssessments}
                            handleWritingModeChange={handleWritingModeChange}
                            handleWritingViewClick={handleWritingViewClick}
                            handleGenerateWritingAssessment={handleGenerateWritingAssessment}
                            writingTopic={writingTopic}
                            setWritingTopic={setWritingTopic}
                            writingType={writingType}
                            setWritingType={setWritingType}
                            aiDifficulty={aiDifficulty}
                            setAiDifficulty={setAiDifficulty}
                            aiTimeLimit={aiTimeLimit}
                            setAiTimeLimit={setAiTimeLimit}
                            aiPointsPerQuestion={aiPointsPerQuestion}
                            setAiPointsPerQuestion={setAiPointsPerQuestion}
                            aiNumWritingQuestions={aiNumWritingQuestions}
                            setAiNumWritingQuestions={setAiNumWritingQuestions}
                            isGenerating={isGenerating}
                            expiresIn={expiresIn}
                            setExpiresIn={setExpiresIn}
                            expiryUnit={expiryUnit}
                            setExpiryUnit={setExpiryUnit}
                            aiWritingEvalInstructions={aiWritingEvalInstructions}
                            setAiWritingEvalInstructions={setAiWritingEvalInstructions}
                            errorMsg={errorMsg}
                            setErrorMsg={setErrorMsg}
                            // Manual form props
                            writingQuestions={writingQuestions}
                            setWritingQuestions={setWritingQuestions}
                            writingQuestionText={writingQuestionText}
                            setWritingQuestionText={setWritingQuestionText}
                            writingPrompt={writingPrompt}
                            setWritingPrompt={setWritingPrompt}
                            writingInstructions={writingInstructions}
                            setWritingInstructions={setWritingInstructions}
                            writingWordLimit={writingWordLimit}
                            setWritingWordLimit={setWritingWordLimit}
                            writingPoints={writingPoints}
                            setWritingPoints={setWritingPoints}
                            writingDifficulty={writingDifficulty}
                            setWritingDifficulty={setWritingDifficulty}
                            aiWritingTitle={aiWritingTitle}
                            setAiWritingTitle={setAiWritingTitle}
                        />
                    </div>
                )}

                {/* Assignment Modal */}
                <AssignmentModal />
            </div>
        </div>
    );
};

export default Assessment;