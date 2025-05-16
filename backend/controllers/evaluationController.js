const mongoose = require('mongoose');
const EvaluationAssignment = require('../models/EvaluationAssignment');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const AssessmentResult = require('../models/AssessmentResult');

// Helper function to get the correct assessment model based on type
const getAssessmentModel = (type) => {
    switch(type) {
        case 'Quiz': 
            return 'Quiz';
        case 'QuizAIAssessment': 
            return 'QuizAIAssessment';
        case 'QuizManualAssessment': 
            return 'QuizManualAssessment';
        case 'CodingAIAssessment': 
            return 'CodingAIAssessment';
        case 'CodingManualAssessment': 
            return 'CodingManualAssessment';
        case 'WritingAIAssessment': 
            return 'WritingAIAssessment';
        case 'WritingManualAssessment': 
            return 'WritingManualAssessment';
        default:
            return 'Quiz';
    }
};

// Get all evaluation assignments for a user
exports.getUserAssignments = async (req, res) => {
    try {
        const { email, category } = req.params;
        
        // Validate input
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'User email is required' 
            });
        }
        
        // Build query
        const query = { 
            userEmail: email,
            hidden: false
        };
        
        // Add category filter if specified
        if (category && ['quiz', 'coding', 'writing'].includes(category)) {
            query.category = category;
        }
        
        // Find assignments
        const assignments = await EvaluationAssignment.find(query)
            .sort({ assignedAt: -1 })
            .populate({
                path: 'assessmentId',
                refPath: 'assessmentType'
            });        // Format response data
        const formattedAssignments = assignments.map(assignment => {
            const assessment = assignment.assessmentId;
            // Handle case where assessment might be null
            if (!assessment) {
                return {
                    id: assignment._id,
                    title: 'Missing Assessment',
                    category: assignment.category,
                    status: assignment.status,
                    assignedBy: assignment.assignedBy,
                    assignedAt: assignment.assignedAt,
                };
            }
            
            return {
                id: assignment._id,
                assessmentId: assessment._id,
                title: assessment.title || 'Untitled Assessment',
                category: assignment.category,
                status: assignment.status,
                assignedBy: assignment.assignedBy,
                assignedAt: assignment.assignedAt,
                attempts: assignment.attempts,
                timeTaken: assignment.timeTaken,
                resultId: assignment.resultId,
                // Include only safe details from the assessment
                assessmentDetails: {
                    timeLimit: assessment.timeLimit,
                    questionCount: assessment.questions ? assessment.questions.length : 0
                }
            };
        });
        
        res.status(200).json({ 
            success: true, 
            assignments: formattedAssignments
        });
    } catch (error) {
        console.error('Error fetching user assignments:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to fetch assignments: ${error.message}` 
        });
    }
};

// Get details of a specific assignment
exports.getAssignmentDetails = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { email } = req.query;
        
        // Validate input
        if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid assignment ID is required' 
            });
        }
        
        // Find the assignment
        const assignment = await EvaluationAssignment.findById(assignmentId)
            .populate({
                path: 'assessmentId',
                refPath: 'assessmentType'
            });
        
        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignment not found' 
            });
        }
        
        // Security check - only allow access to the user's own assignments
        if (email && assignment.userEmail !== email) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to access this assignment'
            });
        }
        
        // Get the assessment from the assignment
        const assessment = assignment.assessmentId;
        if (!assessment) {
            return res.status(404).json({ 
                success: false, 
                message: 'The referenced assessment could not be found' 
            });
        }
        
        // Create a assessment data without correct answers
        const safeAssessment = {
            id: assessment._id,
            title: assessment.title || 'Untitled Assessment',
            category: assignment.category,
            timeLimit: assessment.timeLimit || 60,
            questions: assessment.questions.map(q => ({
                id: q._id,
                question: q.question,
                questionText: q.questionText || q.question,
                options: q.options,
                points: q.points || 10,
                // For coding/writing questions
                evaluationInstructions: q.evaluationInstructions,
                problemDescription: q.problemDescription,
                starterCode: q.starterCode,
                programmingLanguage: q.programmingLanguage
            }))
        };
        
        // Mark assignment as started if pending
        if (assignment.status === 'pending') {
            assignment.status = 'started';
            assignment.startedAt = new Date();
            await assignment.save();
        }
        
        res.status(200).json({ 
            success: true, 
            assignment: {
                id: assignment._id,
                assignedAt: assignment.assignedAt,
                assignedBy: assignment.assignedBy,
                status: assignment.status,
                startedAt: assignment.startedAt,
                completedAt: assignment.completedAt,
                attempts: assignment.attempts,
                timeTaken: assignment.timeTaken,
                resultId: assignment.resultId
            },
            assessment: safeAssessment
        });
    } catch (error) {
        console.error('Error fetching assignment details:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to fetch assignment details: ${error.message}` 
        });
    }
};

// Submit an assignment response
exports.submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { userEmail, answers, timeTaken } = req.body;
        
        // Validate input
        if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid assignment ID is required' 
            });
        }
        
        if (!userEmail || !answers) {
            return res.status(400).json({ 
                success: false, 
                message: 'User email and answers are required'
            });
        }
        
        // Find the assignment
        const assignment = await EvaluationAssignment.findById(assignmentId)
            .populate({
                path: 'assessmentId',
                refPath: 'assessmentType'
            });
        
        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignment not found' 
            });
        }
        
        // Security check - only allow the assigned user to submit
        if (assignment.userEmail !== userEmail) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to submit this assignment'
            });
        }
        
        // Get the assessment
        const assessment = assignment.assessmentId;
        if (!assessment) {
            return res.status(404).json({ 
                success: false, 
                message: 'The referenced assessment could not be found' 
            });
        }
        
        // Increment attempts
        assignment.attempts += 1;
        
        // Process submission based on category
        let result;
        
        if (assignment.category === 'quiz') {
            // Calculate score for quiz
            let score = 0;
            let maxScore = 0;
            const correctAnswersMap = {};
            
            assessment.questions.forEach(question => {
                maxScore += question.points || 10;
                const userAnswer = answers.find(a => a.questionId === question._id.toString());
                
                if (userAnswer && userAnswer.selectedOptions) {
                    const correctAnswers = new Set(question.correctAnswers);
                    const userSelected = new Set(userAnswer.selectedOptions);
                    
                    if (correctAnswers.size === userSelected.size && 
                        [...correctAnswers].every(ans => userSelected.has(ans))) {
                        score += question.points || 10;
                    }
                    
                    correctAnswersMap[question._id] = question.correctAnswers;
                }
            });
            
            // Create result
            result = new AssessmentResult({
                quiz: assessment._id,
                userEmail: userEmail,
                score: score,
                maxPossibleScore: maxScore,
                answers: answers,
                timeTaken: timeTaken || 0,
                assessmentType: 'quiz'
            });
            
            await result.save();
            
            // Update assignment
            assignment.status = 'completed';
            assignment.completedAt = new Date();
            assignment.resultId = result._id;
            assignment.timeTaken = timeTaken || 0;
            
            await assignment.save();
            
            return res.status(200).json({
                success: true,
                message: 'Quiz submitted successfully',
                score: score,
                maxPossibleScore: maxScore,
                resultId: result._id,
                correctAnswers: correctAnswersMap
            });
        } else if (['coding', 'writing'].includes(assignment.category)) {
            // For coding/writing, create a pending result for manual evaluation
            result = new AssessmentResult({
                quiz: assessment._id,
                candidateName: userEmail.split('@')[0], // Extract username from email
                candidateEmail: userEmail,
                answers: answers.map(ans => ({
                    questionId: ans.questionId,
                    answer: ans.answer || ans.code || '',
                    status: 'pending',
                    points: 0
                })),
                status: 'pending',
                totalPoints: 0,
                assessmentType: assignment.category
            });
            
            await result.save();
            
            // Update assignment
            assignment.status = 'completed'; // Completed from user perspective, but pending evaluation
            assignment.completedAt = new Date();
            assignment.resultId = result._id;
            assignment.timeTaken = timeTaken || 0;
            
            await assignment.save();
            
            return res.status(201).json({
                success: true,
                message: `${assignment.category} assessment submitted successfully and is pending evaluation`,
                resultId: result._id
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `Invalid assignment category: ${assignment.category}`
            });
        }
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to submit assignment: ${error.message}` 
        });
    }
};

// Create evaluation assignments for all channel members
exports.createEvaluationAssignments = async (req, res) => {
    try {
        const { 
            assessmentId, 
            assessmentType, 
            category, 
            channelId,
            subchannelId,
            assignedBy
        } = req.body;
        
        // Validate required fields
        if (!assessmentId || !assessmentType || !category || !channelId || !assignedBy) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }
        
        // Validate assessment type
        const validTypes = [
            'Quiz', 'QuizAIAssessment', 'QuizManualAssessment',
            'CodingAIAssessment', 'CodingManualAssessment',
            'WritingAIAssessment', 'WritingManualAssessment'
        ];
        
        if (!validTypes.includes(assessmentType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid assessment type' 
            });
        }
        
        // Validate category
        if (!['quiz', 'coding', 'writing'].includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Category must be one of: quiz, coding, writing'
            });
        }
        
        // Create assignments
        const assignments = await EvaluationAssignment.createForChannelMembers(
            assessmentId,
            assessmentType,
            category,
            channelId,
            subchannelId,
            assignedBy
        );
        
        res.status(201).json({
            success: true,
            message: `Created ${assignments.length} evaluation assignments`,
            assignmentCount: assignments.length,
        });
    } catch (error) {
        console.error('Error creating evaluation assignments:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to create evaluation assignments: ${error.message}` 
        });
    }
};

// Get results for an assignment
exports.getAssignmentResults = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        
        // Validate input
        if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid assignment ID is required' 
            });
        }
        
        // Find the assignment
        const assignment = await EvaluationAssignment.findById(assignmentId);
        
        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignment not found' 
            });
        }
        
        // If there's no result, return early
        if (!assignment.resultId) {
            return res.status(404).json({
                success: false,
                message: 'No results found for this assignment'
            });
        }
        
        // Get the result details
        const result = await AssessmentResult.findById(assignment.resultId);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result record not found'
            });
        }
        
        res.status(200).json({
            success: true,
            result: {
                id: result._id,
                score: result.score,
                maxPossibleScore: result.maxPossibleScore,
                status: result.status,
                submittedAt: result.createdAt,
                evaluatedAt: result.updatedAt,
                feedback: result.feedback,
                timeTaken: result.timeTaken,
                answers: result.answers
            }
        });
    } catch (error) {
        console.error('Error fetching assignment results:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to fetch results: ${error.message}` 
        });
    }
};

// Mark assignment as read/hidden
exports.updateAssignmentStatus = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { hidden } = req.body;
        
        if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid assignment ID is required' 
            });
        }
        
        const assignment = await EvaluationAssignment.findById(assignmentId);
        
        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignment not found' 
            });
        }
        
        // Update only if completed
        if (assignment.status !== 'completed' && hidden) {
            return res.status(400).json({
                success: false,
                message: 'Only completed assignments can be hidden'
            });
        }
        
        assignment.hidden = hidden;
        await assignment.save();
        
        res.status(200).json({
            success: true,
            message: hidden ? 'Assignment hidden' : 'Assignment unhidden'
        });
    } catch (error) {
        console.error('Error updating assignment status:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to update assignment: ${error.message}` 
        });
    }
};

// Get result by ID
exports.getResult = async (req, res) => {
    try {
        const { resultId } = req.params;
        
        // Validate input
        if (!resultId || !mongoose.Types.ObjectId.isValid(resultId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid result ID is required' 
            });
        }
        
        // Find the result
        const result = await AssessmentResult.findById(resultId);
        
        if (!result) {
            return res.status(404).json({ 
                success: false, 
                message: 'Result not found' 
            });
        }
        
        // Return the result
        res.status(200).json({
            success: true,
            result: {
                id: result._id,
                quiz: result.quiz,
                userEmail: result.userEmail,
                score: result.score,
                maxPossibleScore: result.maxPossibleScore,
                answers: result.answers,
                timeTaken: result.timeTaken,
                assessmentType: result.assessmentType,
                status: result.status,
                feedback: result.feedback,
                submittedAt: result.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to fetch result: ${error.message}` 
        });
    }
};
