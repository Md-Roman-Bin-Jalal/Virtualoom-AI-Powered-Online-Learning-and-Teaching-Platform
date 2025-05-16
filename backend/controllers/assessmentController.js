const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizDistribution = require('../models/QuizDistribution');
const AssessmentResult = require('../models/AssessmentResult');
const User = require('../models/User');
const Channel = require('../models/Channel');
const CodingDistribution = require('../models/CodingDistribution');
const WritingDistribution = require('../models/WritingDistribution');
const CodingAIAssessment = require('../models/CodingAIAssessment');
const CodingManualAssessment = require('../models/CodingManualAssessment');
const WritingAIAssessment = require('../models/WritingAIAssessment');
const WritingManualAssessment = require('../models/WritingManualAssessment');

// Helper function to check if an assessment exists in any collection
const verifyAssessmentExists = async (assessmentId) => {
    console.log(`Verifying if assessment exists with ID: ${assessmentId}`);
    
    // Check if ID is valid before trying to query
    if (!assessmentId || !mongoose.Types.ObjectId.isValid(assessmentId)) {
        console.error(`Invalid assessment ID: ${assessmentId}`);
        return {
            exists: false,
            model: null,
            type: null,
            assessment: null,
            error: 'Invalid assessment ID format'
        };
    }
    
    // Check main Quiz collection first
    try {
        let assessment = await Quiz.findById(assessmentId);
        if (assessment) {
            console.log(`Assessment found in Quiz collection with type: ${assessment.assessmentType}`);
            return {
                exists: true,
                model: 'Quiz',
                type: assessment.assessmentType,
                assessment
            };
        }
    } catch (err) {
        console.error(`Error querying Quiz collection:`, err);
    }
    
    // Check QuizAIAssessment
    try {
        const QuizAIAssessment = require('../models/QuizAIAssessment');
        assessment = await QuizAIAssessment.findById(assessmentId);
        if (assessment) {
            return {
                exists: true,
                model: 'QuizAIAssessment',
                type: 'quiz',
                assessment
            };
        }
    } catch (err) {
        console.log('QuizAIAssessment model not available:', err.message);
    }
    
    // Check QuizManualAssessment
    try {
        const QuizManualAssessment = require('../models/QuizManualAssessment');
        assessment = await QuizManualAssessment.findById(assessmentId);
        if (assessment) {
            return {
                exists: true,
                model: 'QuizManualAssessment',
                type: 'quiz',
                assessment
            };
        }
    } catch (err) {
        console.log('QuizManualAssessment model not available:', err.message);
    }
    
    // Check CodingAIAssessment
    assessment = await CodingAIAssessment.findById(assessmentId);
    if (assessment) {
        return {
            exists: true,
            model: 'CodingAIAssessment',
            type: 'coding',
            assessment
        };
    }
    
    // Check CodingManualAssessment
    assessment = await CodingManualAssessment.findById(assessmentId);
    if (assessment) {
        return {
            exists: true,
            model: 'CodingManualAssessment',
            type: 'coding',
            assessment
        };
    }
    
    // Check WritingAIAssessment
    assessment = await WritingAIAssessment.findById(assessmentId);
    if (assessment) {
        return {
            exists: true,
            model: 'WritingAIAssessment',
            type: 'writing',
            assessment
        };
    }
    
    // Check WritingManualAssessment
    assessment = await WritingManualAssessment.findById(assessmentId);
    if (assessment) {
        return {
            exists: true,
            model: 'WritingManualAssessment',
            type: 'writing',
            assessment
        };
    }
    
    // Assessment not found in any collection
    return {
        exists: false,
        model: null,
        type: null,
        assessment: null
    };
};

// Create a new quiz
exports.createQuiz = async (req, res) => {
    try {
        const { title, timeLimit, questions, email, expiresIn, expiryUnit } = req.body;
        
        // Log received data for debugging
        console.log('Received quiz data:', {
            title: title,
            timeLimit: timeLimit,
            questionsCount: questions ? questions.length : 0,
            email: email,
            expiresIn: expiresIn,
            expiryUnit: expiryUnit
        });
        
        // Enhanced validation with detailed error messages
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ success: false, message: 'Quiz title is required and must be a string' });
        }
        
        if (!timeLimit || typeof timeLimit !== 'number' || timeLimit <= 0) {
            return res.status(400).json({ success: false, message: 'Time limit is required and must be a positive number' });
        }
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'Quiz must have at least one question' });
        }
        
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Creator email is required' });
        }
        
        // Validate expiry fields if provided
        if (expiresIn !== undefined) {
            if (typeof expiresIn !== 'number' || expiresIn < 0) {
                return res.status(400).json({ success: false, message: 'Expiry time must be a non-negative number' });
            }
            
            if (!expiryUnit || !['min', 'hour', 'day'].includes(expiryUnit)) {
                return res.status(400).json({ success: false, message: 'Expiry unit must be one of: min, hour, day' });
            }
        }
        
        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} text is required and must be a non-empty string`
                });
            }
            
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must have at least 2 options`
                });
            }
            
            if (!q.correctAnswers || !Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must have at least one correct answer selected`
                });
            }
            
            // Verify correctAnswers point to valid option indexes
            const invalidIndex = q.correctAnswers.find(idx => idx < 0 || idx >= q.options.length);
            if (invalidIndex !== undefined) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} has an invalid correct answer index`
                });
            }
        }
        
        // Get creator's username from the database
        let createdBy = '';
        try {
            const user = await User.findOne({ email });
            if (user && user.name) {
                createdBy = user.name;
                console.log('Found username in database:', createdBy);
            } else {
                // Fallback to email prefix if user not found or name is empty
                createdBy = email.split('@')[0];
                console.log('User not found or name empty, using email prefix:', createdBy);
            }
        } catch (userErr) {
            console.error('Error finding user:', userErr);
            // Fallback to using email prefix if user lookup fails
            createdBy = email.split('@')[0];
        }
        
        // Ensure createdBy is not empty
        if (!createdBy) {
            createdBy = 'anonymous';
        }
        
        console.log('Using createdBy value:', createdBy);
        
        // Create new quiz with expiry settings if provided
        const quizData = {
            title,
            timeLimit,
            questions,
            createdBy,
            creatorEmail: email
        };
        
        // Add expiry fields if provided
        if (expiresIn !== undefined) {
            quizData.expiresIn = expiresIn;
            quizData.expiryUnit = expiryUnit;
        }
        
        const quiz = new Quiz(quizData);
        
        await quiz.save();
        
        console.log('Quiz created successfully with ID:', quiz._id);
        
        res.status(201).json({ 
            success: true, 
            message: 'Quiz created successfully',
            quizId: quiz._id
        });
    } catch (error) {
        // Enhanced error logging
        console.error('Error creating quiz:', error);
        
        // Check for MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Quiz validation failed', 
                errors: validationErrors 
            });
        }
        
        // Return more specific error message if available
        res.status(500).json({ 
            success: false, 
            message: `Failed to create quiz: ${error.message || 'Unknown server error'}`
        });
    }
};

// Send quiz to channel or subchannel
exports.sendQuiz = async (req, res) => {
    try {
        const { quizId, channelId, subchannelId, email, username } = req.body;
        
        // Validate input
        if (!quizId || !channelId || !email) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }
        
        // Use helper function to check if quiz exists in any collection
        const result = await verifyAssessmentExists(quizId);
        
        if (!result.exists) {
            console.error(`Quiz not found with ID: ${quizId}`);
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        
        // Make sure it's a quiz type assessment
        if (result.type !== 'quiz' && result.model !== 'QuizAIAssessment' && result.model !== 'QuizManualAssessment') {
            console.error(`Assessment found but not a quiz type. Found type: ${result.type}, model: ${result.model}`);
            return res.status(400).json({ success: false, message: 'Not a valid quiz assessment' });
        }
        
        // Access the quiz object from the result
        const quiz = result.assessment;
        
        // Create quiz distribution record
        const distribution = new QuizDistribution({
            quizId,
            channelId,
            subchannelId: subchannelId || null,
            sentBy: username || email
        });
        
        // Log distribution before saving
        console.log("Saving quiz distribution:", {
            quizId: distribution.quizId.toString(),
            channel: distribution.channelId,
            subchannel: distribution.subchannelId
        });
        
        await distribution.save();
        
        // Get socket.io instance
        const io = req.app.get('io');
        
        // Broadcast quiz to channel or subchannel
        if (subchannelId) {
            // For subchannel
            const subchannelRoom = `${channelId}-${subchannelId}`;
            io.to(subchannelRoom).emit('newQuiz', {
                quizId: quizId,
                sender: username || email,
                message: "A new quiz evaluation added. Navigate to evaluation section.",
                timestamp: new Date().toISOString()
            });
        } else {
            // For main channel
            io.to(channelId).emit('newQuiz', {
                quizId: quizId,
                sender: username || email,
                message: "A new quiz evaluation added. Navigate to evaluation section.",
                timestamp: new Date().toISOString()
            });
        }
        
        res.status(200).json({ success: true, message: 'Quiz sent successfully' });
    } catch (error) {
        console.error('Error sending quiz:', error);
        res.status(500).json({ success: false, message: 'Failed to send quiz' });
    }
};

// Send coding assessment to a channel
exports.sendCodingAssessment = async (req, res) => {
    try {
        const { codingAssessmentId, channelId, subchannelId, email, username } = req.body;
        
        // Validate input
        if (!codingAssessmentId || !channelId || !email) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }
        
        // Use helper function to check if coding assessment exists in any collection
        const result = await verifyAssessmentExists(codingAssessmentId);
        
        if (!result.exists) {
            console.error(`Coding assessment not found with ID: ${codingAssessmentId}`);
            return res.status(404).json({ success: false, message: 'Coding Assessment not found' });
        }
        
        // Make sure it's a coding type assessment
        if (result.type !== 'coding' && result.model !== 'CodingAIAssessment' && result.model !== 'CodingManualAssessment') {
            console.error(`Assessment found but not a coding type. Found type: ${result.type}, model: ${result.model}`);
            return res.status(400).json({ success: false, message: 'Not a valid coding assessment' });
        }
        
        // Access the coding assessment object from the result
        const codingAssessment = result.assessment;
        
        // Create coding assessment distribution record
        // Determine the correct model 
        const assessmentModel = codingAssessment instanceof Quiz ? 'Quiz' : 
                              codingAssessment instanceof CodingAIAssessment ? 'CodingAIAssessment' : 
                              'CodingManualAssessment';
                              
        console.log(`Creating coding distribution with model ${assessmentModel} for ID ${codingAssessmentId}`);
        
        const distribution = new CodingDistribution({
            codingAssessmentId,
            channelId,
            subchannelId: subchannelId || null,
            sentBy: username || email,
            assessmentModel
        });
        
        // Log distribution before saving
        console.log("Saving distribution:", {
            codingAssessmentId: distribution.codingAssessmentId.toString(),
            channel: distribution.channelId,
            subchannel: distribution.subchannelId,
            model: distribution.assessmentModel
        });
        
        await distribution.save();
        
        // Get socket.io instance
        const io = req.app.get('io');
        
        // Broadcast coding assessment to channel or subchannel
        if (subchannelId) {
            // For subchannel
            const subchannelRoom = `${channelId}-${subchannelId}`;
            io.to(subchannelRoom).emit('newCodingAssessment', {
                codingAssessmentId: codingAssessmentId,
                sender: username || email,
                message: "A new coding assessment added. Navigate to evaluation section.",
                timestamp: new Date().toISOString()
            });
        } else {
            // For main channel
            io.to(channelId).emit('newCodingAssessment', {
                codingAssessmentId: codingAssessmentId,
                sender: username || email,
                message: "A new coding assessment added. Navigate to evaluation section.",
                timestamp: new Date().toISOString()
            });
        }
        
        res.status(200).json({ success: true, message: 'Coding Assessment sent successfully' });
    } catch (error) {
        console.error('Error sending coding assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to send coding assessment' });
    }
};

// Send writing assessment to a channel
exports.sendWritingAssessment = async (req, res) => {
    try {
        const { writingAssessmentId, channelId, subchannelId, email, username } = req.body;
        
        // Validate input
        if (!writingAssessmentId || !channelId || !email) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }
        
        // Use helper function to check if writing assessment exists in any collection
        const result = await verifyAssessmentExists(writingAssessmentId);
        
        if (!result.exists) {
            console.error(`Writing assessment not found with ID: ${writingAssessmentId}`);
            return res.status(404).json({ success: false, message: 'Writing Assessment not found' });
        }
        
        // Make sure it's a writing type assessment
        if (result.type !== 'writing' && result.model !== 'WritingAIAssessment' && result.model !== 'WritingManualAssessment') {
            console.error(`Assessment found but not a writing type. Found type: ${result.type}, model: ${result.model}`);
            return res.status(400).json({ success: false, message: 'Not a valid writing assessment' });
        }
        
        // Access the writing assessment object from the result
        const writingAssessment = result.assessment;
        
        // Determine the correct model 
        const assessmentModel = writingAssessment instanceof Quiz ? 'Quiz' : 
                              writingAssessment instanceof WritingAIAssessment ? 'WritingAIAssessment' : 
                              'WritingManualAssessment';
                              
        console.log(`Creating writing distribution with model ${assessmentModel} for ID ${writingAssessmentId}`);
        
        // Create writing assessment distribution record
        const distribution = new WritingDistribution({
            writingAssessmentId,
            channelId,
            subchannelId: subchannelId || null,
            sentBy: username || email,
            assessmentModel
        });
        
        // Log distribution before saving
        console.log("Saving distribution:", {
            writingAssessmentId: distribution.writingAssessmentId.toString(),
            channel: distribution.channelId,
            subchannel: distribution.subchannelId,
            model: distribution.assessmentModel
        });
        
        await distribution.save();
        
        // Get socket.io instance
        const io = req.app.get('io');
        
        // Broadcast writing assessment to channel or subchannel
        if (subchannelId) {
            // For subchannel
            const subchannelRoom = `${channelId}-${subchannelId}`;
            io.to(subchannelRoom).emit('newWritingAssessment', {
                writingAssessmentId: writingAssessmentId,
                sender: username || email,
                message: "A new writing assessment added. Navigate to evaluation section.",
                timestamp: new Date().toISOString()
            });
        } else {
            // For main channel
            io.to(channelId).emit('newWritingAssessment', {
                writingAssessmentId: writingAssessmentId,
                sender: username || email,
                message: "A new writing assessment added. Navigate to evaluation section.",
                timestamp: new Date().toISOString()
            });
        }
        
        res.status(200).json({ success: true, message: 'Writing Assessment sent successfully' });
    } catch (error) {
        console.error('Error sending writing assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to send writing assessment' });
    }
};

// Get user's assigned coding assessments
exports.getUserAssignedCodingAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Find channels user is a member of
        const channels = await Channel.find({ 'members.user': user._id });
        const channelIds = channels.map(channel => channel._id.toString());
        
        // Find subchannels user is a member of
        let subchannelIds = [];
        channels.forEach(channel => {
            channel.subchannels.forEach(subchannel => {
                const isUserMember = subchannel.members.some(member => member.user.toString() === user._id.toString());
                if (isUserMember) {
                    subchannelIds.push(subchannel._id.toString());
                }
            });
        });
        
        // Find coding assessment distributions for user's channels and subchannels
        const distributions = await CodingDistribution.find({
            $or: [
                { channelId: { $in: channelIds }, subchannelId: null },
                { subchannelId: { $in: subchannelIds } }
            ],
            active: true
        }).populate({
            path: 'codingAssessmentId',
            // This will populate the referenced model based on assessmentModel field
            refPath: 'assessmentModel'
        });
        
        // Extract coding assessments from distributions
        const codingAssessments = distributions
            .filter(dist => dist.codingAssessmentId) // Filter out null references
            .map(dist => ({
                _id: dist.codingAssessmentId._id,
                title: dist.codingAssessmentId.title || 'Untitled Assessment',
                sentBy: dist.sentBy,
                sentAt: dist.sentAt,
                assessmentType: 'coding'
            }));
        
        res.status(200).json({ success: true, codingAssessments });
    } catch (error) {
        console.error('Error fetching assigned coding assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assigned coding assessments' });
    }
};

// Get user's assigned writing assessments
exports.getUserAssignedWritingAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Find channels user is a member of
        const channels = await Channel.find({ 'members.user': user._id });
        const channelIds = channels.map(channel => channel._id.toString());
        
        // Find subchannels user is a member of
        let subchannelIds = [];
        channels.forEach(channel => {
            channel.subchannels.forEach(subchannel => {
                const isUserMember = subchannel.members.some(member => member.user.toString() === user._id.toString());
                if (isUserMember) {
                    subchannelIds.push(subchannel._id.toString());
                }
            });
        });
        
        // Find writing assessment distributions for user's channels and subchannels
        const distributions = await WritingDistribution.find({
            $or: [
                { channelId: { $in: channelIds }, subchannelId: null },
                { subchannelId: { $in: subchannelIds } }
            ],
            active: true
        }).populate({
            path: 'writingAssessmentId',
            // This will populate the referenced model based on assessmentModel field
            refPath: 'assessmentModel'
        });
        
        // Extract writing assessments from distributions
        const writingAssessments = distributions
            .filter(dist => dist.writingAssessmentId) // Filter out null references
            .map(dist => ({
                _id: dist.writingAssessmentId._id,
                title: dist.writingAssessmentId.title || 'Untitled Assessment',
                sentBy: dist.sentBy,
                sentAt: dist.sentAt,
                assessmentType: 'writing'
            }));
        
        res.status(200).json({ success: true, writingAssessments });
    } catch (error) {
        console.error('Error fetching assigned writing assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assigned writing assessments' });
    }
};

// Get quiz details
exports.getQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        
        // Create a safe version of quiz without correct answers
        const safeQuiz = {
            _id: quiz._id,
            title: quiz.title,
            timeLimit: quiz.timeLimit,
            questions: quiz.questions.map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options,
                points: q.points
            })),
            createdBy: quiz.createdBy,
            createdAt: quiz.createdAt
        };
        
        res.status(200).json({ success: true, quiz: safeQuiz });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quiz' });
    }
};

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
    try {
        const { quizId, userEmail, answers, timeTaken } = req.body;
        
        // Validate input
        if (!quizId || !userEmail || !answers || answers.length === 0) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        // Get quiz to check answers
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        
        // Calculate score
        let totalScore = 0;
        let maxPossibleScore = 0;
        
        // Map to store correct answers for response
        const correctAnswersMap = {};
        
        // Process each question's answer
        quiz.questions.forEach(question => {
            maxPossibleScore += question.points;
            
            // Find user's answer for this question
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            
            if (userAnswer) {
                const correctAnswers = new Set(question.correctAnswers);
                const userSelectedOptions = new Set(userAnswer.selectedOptions);
                
                // Full points if all correct answers selected and no incorrect ones
                if (correctAnswers.size === userSelectedOptions.size && 
                    [...correctAnswers].every(answer => userSelectedOptions.has(answer))) {
                    totalScore += question.points;
                }
                
                // Store correct answers for this question
                correctAnswersMap[question._id] = question.correctAnswers;
            }
        });
        
        // Save assessment result
        const result = new AssessmentResult({
            quizId,
            userEmail,
            score: totalScore,
            maxPossibleScore,
            answers: answers,
            timeTaken: timeTaken || 0
        });
        
        await result.save();
        
        res.status(200).json({ 
            success: true, 
            score: totalScore,
            maxPossibleScore,
            correctAnswers: correctAnswersMap
        });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ success: false, message: 'Failed to submit quiz' });
    }
};

// Get quizzes created by a user
exports.getUserQuizzes = async (req, res) => {
    try {
        const { email } = req.params;
        
        const quizzes = await Quiz.find({ creatorEmail: email });
        
        res.status(200).json({ success: true, quizzes });
    } catch (error) {
        console.error('Error fetching user quizzes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
    }
};

// Get quiz results for a specific quiz
exports.getQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        const results = await AssessmentResult.find({ quizId })
            .sort({ completedAt: -1 });
        
        res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quiz results' });
    }
};

// Get quizzes assigned to a user in channels/subchannels
exports.getAssignedQuizzes = async (req, res) => {
    try {
        const { email } = req.params;
        
        // Get user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Find channels where the user is a member
        const userChannels = await Channel.find({
            'members.user': user._id
        }, '_id');
        
        // Extract channel IDs
        const channelIds = userChannels.map(channel => channel._id.toString());
        
        console.log(`Found ${channelIds.length} channels for user ${user.email}`);
        
        if (channelIds.length === 0) {
            return res.status(200).json({ success: true, quizzes: [] });
        }
        
        // Find quiz distributions for user's channels
        const distributions = await QuizDistribution.find({
            channelId: { $in: channelIds },
            active: true
        }).populate('quizId');
        
        console.log(`Found ${distributions.length} quiz distributions for user's channels`);
        
        // Extract quiz details directly from populated distributions
        const safeQuizzes = distributions
            .filter(dist => dist.quizId) // Filter out null references
            .map(dist => {
                const quiz = dist.quizId;
                return {
                    _id: quiz._id,
                    title: quiz.title || 'Untitled Quiz',
                    timeLimit: quiz.timeLimit,
                    questionCount: quiz.questions ? quiz.questions.length : 0,
                    totalPoints: quiz.questions ? 
                        quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) : 0,
                    createdBy: quiz.createdBy || 'Unknown',
                    createdAt: quiz.createdAt,
                    assessmentType: quiz.assessmentType || 'quiz',
                    sentBy: dist.sentBy,
                    sentAt: dist.sentAt
                };
            });
        
        res.status(200).json({ success: true, quizzes: safeQuizzes });
    } catch (error) {
        console.error('Error fetching assigned quizzes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assigned quizzes' });
    }
};

// Generate a quiz using AI
exports.generateQuiz = async (req, res) => {
    try {
        const { prompt, numQuestions, pointsPerQuestion, timeLimit, title, email, expiresIn, expiryUnit } = req.body;
        
        // Log received data for debugging
        console.log('Received AI quiz generation request:', {
            promptLength: prompt ? prompt.length : 0,
            numQuestions,
            pointsPerQuestion,
            timeLimit,
            title,
            email,
            expiresIn,
            expiryUnit
        });
        
        // Validate input
        if (!prompt || !numQuestions || !pointsPerQuestion || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: prompt, numQuestions, pointsPerQuestion, and email' 
            });
        }
        
        // Validate numeric inputs
        const numQuestionsInt = parseInt(numQuestions);
        const pointsPerQuestionInt = parseInt(pointsPerQuestion);
        const timeLimitInt = parseInt(timeLimit) || 30; // Default to 30 minutes if not provided
        
        if (isNaN(numQuestionsInt) || numQuestionsInt <= 0 || numQuestionsInt > 20) {
            return res.status(400).json({ 
                success: false, 
                message: 'Number of questions must be between 1 and 20' 
            });
        }
        
        if (isNaN(pointsPerQuestionInt) || pointsPerQuestionInt <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Points per question must be a positive number' 
            });
        }
        
        // Validate expiry fields if provided
        if (expiresIn !== undefined) {
            if (typeof expiresIn !== 'number' || expiresIn < 0) {
                return res.status(400).json({ success: false, message: 'Expiry time must be a non-negative number' });
            }
            
            if (!expiryUnit || !['min', 'hour', 'day'].includes(expiryUnit)) {
                return res.status(400).json({ success: false, message: 'Expiry unit must be one of: min, hour, day' });
            }
        }

        // Import OpenAI
        const { OpenAI } = require('openai');
        
        // Use API key from environment variables
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('Missing OpenRouter API key in environment variables');
            return res.status(500).json({ 
                success: false, 
                message: 'Server configuration error: Missing API key'
            });
        }
        
        // Initialize OpenAI client with OpenRouter endpoint
        const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://perform5.com',
                'X-Title': 'Perform5 Quiz Generator'
            }
        });
        
        // Prepare system prompt for quiz generation - explicitly specify not to include comments or markdown in JSON
        const systemPrompt = `You are an expert educational quiz creator. Create a multiple-choice quiz with exactly ${numQuestionsInt} questions based on the topic provided. 
For each question:
1. Provide exactly 4 answer options labeled A, B, C, and D
2. Mark the correct answer(s) (can be one or multiple)
3. The quiz should be challenging but fair
4. Ensure the answers are unambiguous

Return the quiz in a structured JSON format like this example:
{
  "title": "${title || 'Quiz on the provided topic'}",
  "questions": [
    {
      "question": "Question text goes here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswers": [0, 2],
      "points": ${pointsPerQuestionInt}
    }
  ]
}

VERY IMPORTANT: 
1. Your response must be valid JSON with no comments, explanations, or additional text.
2. Do NOT wrap your JSON in markdown code blocks (like \`\`\`json).
3. Just return the raw JSON object directly.
4. Make sure the structure follows exactly the format above with "questions" (not "question"), "options" (not "option"), and "correctAnswers" (not "correctAnswer").`;

        // Call OpenRouter/OpenAI API to generate quiz
        try {
            console.log('Requesting quiz generation from OpenRouter API...');
            
            // List of models to try (in order of preference)
            const models = [
                "deepseek/deepseek-chat:free",
            ];
            
            let completion;
            let modelUsed;
            let apiError;
            
            // Try each model until one works
            for (const model of models) {
                try {
                    console.log(`Attempting to use model: ${model}`);
                    
                    completion = await openai.chat.completions.create({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.7,
                        response_format: { type: 'json_object' },
                        max_tokens: 4000,
                    });
                    
                    modelUsed = model;
                    console.log(`Successfully generated quiz using model: ${modelUsed}`);
                    break; // Exit the loop if successful
                } catch (modelError) {
                    console.error(`Error with model ${model}:`, modelError);
                    apiError = modelError;
                    // Continue to next model
                }
            }
            
            // If no model worked
            if (!completion) {
                console.error('All models failed:', apiError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate quiz with available AI models. Please try again later.',
                    details: apiError.message || 'Unknown API error'
                });
            }
            
            console.log('API Response received successfully');
            
            // Log the raw response for debugging
            console.log('Raw API Response:', completion);
            
            // Parse the response with error handling
            let quizData;
            try {
                let responseContent = completion.choices[0].message.content;
                
                // Log the raw content
                console.log('Raw content to parse:', responseContent);
                
                // Remove markdown code block syntax if present
                responseContent = responseContent
                    .replace(/^```json\s*/gm, '') // Remove opening ```json
                    .replace(/\s*```\s*$/gm, '')  // Remove closing ```
                    .trim();
                
                // Remove any potential comments before parsing
                responseContent = responseContent
                    .replace(/\/\/.*$/gm, '') // Remove single line comments
                    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
                
                console.log('Cleaned content for parsing:', responseContent);
                
                quizData = JSON.parse(responseContent);
                
                // Validate the returned quiz structure
                if (!quizData.title) {
                    quizData.title = title || 'AI Generated Quiz';
                }
                
                // Check and fix quiz structure if needed
                if (!quizData.questions && quizData.question) {
                    // Fix common key name issue - "question" instead of "questions"
                    quizData.questions = quizData.question;
                    delete quizData.question;
                }
                
                if (!quizData.questions || !Array.isArray(quizData.questions)) {
                    throw new Error('Invalid quiz structure returned from AI: missing questions array');
                }
                
                // Fix structure of each question if needed
                quizData.questions = quizData.questions.map((q, idx) => {
                    const fixedQuestion = {
                        question: q.question,
                        options: q.options || q.option || [], // Handle both "options" and "option"
                        correctAnswers: q.correctAnswers || q.correctAnswer || [], // Handle both "correctAnswers" and "correctAnswer"
                        points: pointsPerQuestionInt
                    };
                    
                    // Validate the fixed question
                    if (!fixedQuestion.question || !Array.isArray(fixedQuestion.options) || 
                        !Array.isArray(fixedQuestion.correctAnswers) || fixedQuestion.correctAnswers.length === 0) {
                        console.error(`Question ${idx+1} has an invalid structure:`, fixedQuestion);
                        throw new Error(`Question ${idx+1} has an invalid structure`);
                    }
                    
                    // Ensure we have exactly 4 options
                    if (fixedQuestion.options.length !== 4) {
                        console.error(`Question ${idx+1} does not have exactly 4 options:`, fixedQuestion.options);
                        throw new Error(`Question ${idx+1} does not have exactly 4 options`);
                    }
                    
                    return fixedQuestion;
                });
                
                // Get creator's username
                let createdBy = '';
                try {
                    const user = await User.findOne({ email });
                    if (user && user.name) {
                        createdBy = user.name;
                    } else {
                        createdBy = email.split('@')[0];
                    }
                } catch (userErr) {
                    createdBy = email.split('@')[0];
                }
                
                // Ensure createdBy is not empty
                if (!createdBy) {
                    createdBy = 'anonymous';
                }
                
                // Create quiz data with optional expiry settings
                const quizModelData = {
                    title: quizData.title,
                    timeLimit: timeLimitInt,
                    questions: quizData.questions,
                    createdBy,
                    creatorEmail: email
                };
                
                // Add expiry fields if provided
                if (expiresIn !== undefined) {
                    quizModelData.expiresIn = expiresIn;
                    quizModelData.expiryUnit = expiryUnit;
                }
                
                console.log('Creating quiz in database with title:', quizModelData.title);
                
                // Create the quiz in the database
                const quiz = new Quiz(quizModelData);
                
                await quiz.save();
                
                res.status(201).json({ 
                    success: true, 
                    message: 'AI-generated quiz created successfully',
                    quizId: quiz._id,
                    quiz: {
                        title: quiz.title,
                        questionsCount: quiz.questions.length,
                        timeLimit: quiz.timeLimit
                    }
                });
                
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                console.error('Raw AI response:', completion.choices[0].message.content);
                
                // Return a user-friendly error message
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to generate a valid quiz. Please try again or adjust your prompt.',
                    detail: parseError.message
                });
            }
        } catch (openAIError) {
            console.error('OpenRouter/OpenAI API Error:', openAIError);
            return res.status(500).json({
                success: false,
                message: `AI API Error: ${openAIError.message || 'Unknown error'}`,
                details: openAIError.response ? openAIError.response.data : null
            });
        }
    } catch (error) {
        console.error('Error generating quiz with AI:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to generate quiz: ${error.message || 'Unknown server error'}`
        });
    }
};

// Create a manual coding assessment
exports.createCodingAssessment = async (req, res) => {
    try {
        const { title, timeLimit, questions, email, expiresIn, expiryUnit } = req.body;
        
        // Validate input
        if (!title || !timeLimit || !questions || !email) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        // Validate questions
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one question is required' 
            });
        }
        
        // Check for required fields in questions
        for (const question of questions) {
            if (!question.question || !question.evaluationInstructions) {
                return res.status(400).json({
                    success: false,
                    message: 'Each question must have question text and evaluation instructions'
                });
            }
        }
        
        // Get creator's name from the database
        let createdBy = '';
        try {
            const user = await User.findOne({ email });
            if (user && user.name) {
                createdBy = user.name;
            } else {
                createdBy = email.split('@')[0];
            }
        } catch (userErr) {
            createdBy = email.split('@')[0];
        }
        
        // Ensure createdBy is not empty
        if (!createdBy) {
            createdBy = 'anonymous';
        }
        
        // Create quiz data
        const quizData = {
            title,
            timeLimit,
            questions,
            createdBy,
            creatorEmail: email,
            assessmentType: 'coding',
            isAIGenerated: false
        };
        
        // Add expiry fields if provided
        if (expiresIn !== undefined) {
            quizData.expiresIn = expiresIn;
            quizData.expiryUnit = expiryUnit;
        }
        
        // Create the assessment in the database
        const quiz = new Quiz(quizData);
        await quiz.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Coding assessment created successfully',
            quizId: quiz._id
        });
    } catch (error) {
        console.error('Error creating coding assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to create coding assessment' });
    }
};

// Create a manual writing assessment
exports.createWritingAssessment = async (req, res) => {
    try {        const { title, timeLimit, questions, email, expiresIn, expiryUnit, writingType } = req.body;
        
        // Log received data for debugging
        console.log('Received writing assessment data:', {
            title: title,
            timeLimit: timeLimit,
            questionsCount: questions ? questions.length : 0,
            email: email,
            expiresIn: expiresIn,
            expiryUnit: expiryUnit,
            writingType: writingType
        });
        
        // Log each question for detailed debugging
        if (questions && questions.length > 0) {
            console.log('Question details:');
            questions.forEach((q, i) => {
                console.log(`Question ${i+1}:`, JSON.stringify(q, null, 2));
            });
        }
        
        // Enhanced validation
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ success: false, message: 'Assessment title is required and must be a string' });
        }
        
        if (!timeLimit || typeof timeLimit !== 'number' || timeLimit <= 0) {
            return res.status(400).json({ success: false, message: 'Time limit is required and must be a positive number' });
        }
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'Writing assessment must have at least one question' });
        }
        
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Creator email is required' });
        }
          // Validate questions with detailed debug output
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            console.log(`Validating question ${i+1}:`, JSON.stringify(q, null, 2));
            
            if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim() === '') {
                console.log(`Question ${i+1} failed: missing questionText`);
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} text is required and must be a non-empty string`
                });
            }
            
            if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.trim() === '') {
                console.log(`Question ${i+1} failed: missing prompt field`);
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} prompt is required and must be a non-empty string`
                });
            }
            
            if (!q.wordLimit || typeof q.wordLimit !== 'number' || q.wordLimit <= 0) {
                console.log(`Question ${i+1} failed: invalid wordLimit`);
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must have a valid word limit`
                });
            }
            
            if (!q.points || typeof q.points !== 'number' || q.points <= 0) {
                console.log(`Question ${i+1} failed: invalid points`);
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must have valid points assigned`
                });
            }
            
            console.log(`Question ${i+1} passed validation`);
        }
        
        // Get creator's username from the database
        let createdBy = '';
        try {
            const user = await User.findOne({ email });
            if (user && user.name) {
                createdBy = user.name;
            } else {
                // Fallback to email prefix if user not found or name is empty
                createdBy = email.split('@')[0];
            }
        } catch (userErr) {
            // Fallback to using email prefix if user lookup fails
            createdBy = email.split('@')[0];
        }
        
        // Ensure createdBy is not empty
        if (!createdBy) {
            createdBy = 'anonymous';
        }
          // Create new writing assessment with additional debugging
        const WritingManual = require('../models/WritingManual');
        
        // Print detailed question data for debugging
        console.log('Writing assessment questions data:', JSON.stringify(questions, null, 2));
        
        const writingData = {
            title,
            timeLimit,
            questions,
            createdBy,
            creatorEmail: email
        };
        
        // Add expiry fields if provided
        if (expiresIn !== undefined) {
            writingData.expiresIn = expiresIn;
            writingData.expiryUnit = expiryUnit;
        }
          console.log('Final writing data being saved:', JSON.stringify(writingData, null, 2));
        
        // Create and save the writing assessment
        const writingAssessment = new WritingManual(writingData);
        await writingAssessment.save();
        
        console.log('Writing assessment created successfully with ID:', writingAssessment._id);
        
        // Return success response
        res.status(201).json({ 
            success: true, 
            message: 'Writing assessment created successfully',
            assessmentId: writingAssessment._id
        });    } catch (error) {
        // Enhanced error logging
        console.error('Error creating writing assessment:', error);
        
        try {
            // Check for MongoDB validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ 
                    success: false, 
                    message: 'Writing assessment validation failed', 
                    errors: validationErrors 
                });
            }
            
            // Return more specific error message if available
            res.status(500).json({ 
                success: false, 
                message: `Failed to create writing assessment: ${error.message || 'Unknown server error'}`
            });
        } catch (responseError) {
            console.error('Error sending error response:', responseError);
            // Make one final attempt to send a clean error response
            res.status(500).json({
                success: false,
                message: 'An unexpected error occurred processing the request'
            });
        }
    }
};

// Submit coding or writing assessment answers
exports.submitCodingWritingAssessment = async (req, res) => {
    try {
        const { quizId, answers, candidateName, candidateEmail } = req.body;
        
        // Enhanced validation
        if (!quizId) {
            return res.status(400).json({ success: false, message: 'Assessment ID is required' });
        }
        
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: 'Answers must be provided as an array' });
        }
        
        if (!candidateName || typeof candidateName !== 'string') {
            return res.status(400).json({ success: false, message: 'Candidate name is required' });
        }
        
        if (!candidateEmail || typeof candidateEmail !== 'string') {
            return res.status(400).json({ success: false, message: 'Candidate email is required' });
        }
        
        // Find the assessment
        const quiz = await Quiz.findById(quizId);
        
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        
        // Verify assessment type is coding or writing
        if (quiz.assessmentType !== 'coding' && quiz.assessmentType !== 'writing') {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid operation: This endpoint is for coding or writing assessments only, but got ${quiz.assessmentType}`
            });
        }
        
        // Validate answers format
        if (answers.length !== quiz.questions.length) {
            return res.status(400).json({ 
                success: false, 
                message: `Expected ${quiz.questions.length} answers, but received ${answers.length}`
            });
        }
        
        for (let i = 0; i < answers.length; i++) {
            if (!answers[i].hasOwnProperty('answer') || typeof answers[i].answer !== 'string') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Answer at position ${i} must have a valid 'answer' property of type string`
                });
            }
            
            if (!answers[i].hasOwnProperty('questionId') || typeof answers[i].questionId !== 'string') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Answer at position ${i} must have a valid 'questionId' property`
                });
            }
        }
        
        // Create a new result - pending evaluation
        const result = new AssessmentResult({
            quiz: quizId,
            candidateName,
            candidateEmail,
            answers: answers.map(ans => ({
                questionId: ans.questionId,
                answer: ans.answer,
                status: 'pending', // Answers need manual evaluation
                points: 0 // Initial points, to be updated during evaluation
            })),
            status: 'pending', // Overall status pending until evaluated
            totalPoints: 0, // Initial total, to be updated
            assessmentType: quiz.assessmentType
        });
        
        await result.save();
        
        // Send notification email to the assessment creator
        try {
            // Code to send email notification would go here
            console.log(`Notification email would be sent to ${quiz.creatorEmail} for assessment result ${result._id}`);
        } catch (emailErr) {
            console.error('Failed to send notification email:', emailErr);
            // Continue with the response even if email fails
        }
        
        res.status(201).json({
            success: true,
            message: `${quiz.assessmentType.charAt(0).toUpperCase() + quiz.assessmentType.slice(1)} assessment submitted successfully and is pending evaluation`,
            resultId: result._id
        });
    } catch (error) {
        console.error(`Error submitting ${req.body.assessmentType || 'coding/writing'} assessment:`, error);
        
        res.status(500).json({
            success: false,
            message: `Failed to submit assessment: ${error.message || 'Unknown server error'}`
        });
    }
};

// Evaluate a coding or writing assessment submission
exports.evaluateAssessment = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { evaluatedAnswers, feedback } = req.body;
        
        // Validate input
        if (!resultId) {
            return res.status(400).json({ success: false, message: 'Result ID is required' });
        }
        
        if (!evaluatedAnswers || !Array.isArray(evaluatedAnswers)) {
            return res.status(400).json({ success: false, message: 'Evaluated answers must be provided as an array' });
        }
        
        // Find the assessment result
        const result = await AssessmentResult.findById(resultId).populate('quiz');
        
        if (!result) {
            return res.status(404).json({ success: false, message: 'Assessment result not found' });
        }
        
        // Verify result is for a coding or writing assessment
        if (result.assessmentType !== 'coding' && result.assessmentType !== 'writing') {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid operation: This endpoint is for coding or writing assessments only, but got ${result.assessmentType}`
            });
        }
        
        // Verify result is in pending status
        if (result.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: `This assessment result has already been evaluated and is in '${result.status}' status`
            });
        }
        
        // Validate each evaluated answer
        for (let i = 0; i < evaluatedAnswers.length; i++) {
            const eval = evaluatedAnswers[i];
            
            if (!eval.questionId) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Evaluated answer at position ${i} must have a questionId`
                });
            }
            
            if (typeof eval.points !== 'number' || eval.points < 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Evaluated answer at position ${i} must have a valid points value (non-negative number)`
                });
            }
            
            if (!eval.feedback || typeof eval.feedback !== 'string') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Evaluated answer at position ${i} must have feedback`
                });
            }
        }
        
        // Update each answer with evaluation
        let totalPoints = 0;
        let totalPossible = 0;
        
        // Get max points possible from the quiz
        if (result.quiz && result.quiz.questions) {
            for (const q of result.quiz.questions) {
                totalPossible += q.points || 0;
            }
        }
        
        // Update answers with evaluation
        for (const answerIndex in result.answers) {
            const answer = result.answers[answerIndex];
            const evaluation = evaluatedAnswers.find(e => e.questionId === answer.questionId);
            
            if (evaluation) {
                answer.points = evaluation.points;
                answer.feedback = evaluation.feedback;
                answer.status = 'evaluated';
                totalPoints += evaluation.points;
            }
        }
        
        // Calculate percentage score
        const percentageScore = totalPossible > 0 ? Math.round((totalPoints / totalPossible) * 100) : 0;
        
        // Update overall result status
        result.status = 'completed';
        result.totalPoints = totalPoints;
        result.percentageScore = percentageScore;
        result.overallFeedback = feedback || '';
        result.evaluatedAt = new Date();
        
        await result.save();
        
        // Send notification email to the candidate
        try {
            // Code to send email notification would go here
            console.log(`Evaluation notification email would be sent to ${result.candidateEmail}`);
        } catch (emailErr) {
            console.error('Failed to send evaluation notification email:', emailErr);
            // Continue with the response even if email fails
        }
        
        res.status(200).json({
            success: true,
            message: `${result.assessmentType.charAt(0).toUpperCase() + result.assessmentType.slice(1)} assessment evaluated successfully`,
            result: {
                id: result._id,
                candidateName: result.candidateName,
                totalPoints,
                percentageScore,
                status: result.status
            }
        });
    } catch (error) {
        console.error('Error evaluating assessment:', error);
        
        res.status(500).json({
            success: false,
            message: `Failed to evaluate assessment: ${error.message || 'Unknown server error'}`
        });
    }
};

// Generate a coding assessment using AI
exports.generateCodingAssessment = async (req, res) => {
    try {
        const { topic, programmingLanguage, difficulty, numQuestions, timeLimit, email, expiresIn, expiryUnit } = req.body;
        
        // Log received data for debugging
        console.log('Received AI coding assessment generation request:', {
            topic,
            programmingLanguage,
            difficulty,
            numQuestions,
            timeLimit,
            email,
            expiresIn,
            expiryUnit
        });
        
        // Validate input
        if (!topic || !programmingLanguage || !difficulty || !numQuestions || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: topic, programmingLanguage, difficulty, numQuestions, and email' 
            });
        }
        
        // Validate numeric inputs
        const numQuestionsInt = parseInt(numQuestions);
        const timeLimitInt = parseInt(timeLimit) || 60; // Default to 60 minutes if not provided
        
        if (isNaN(numQuestionsInt) || numQuestionsInt <= 0 || numQuestionsInt > 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Number of questions must be between 1 and 10' 
            });
        }
        
        // Validate expiry fields if provided
        if (expiresIn !== undefined) {
            if (typeof expiresIn !== 'number' || expiresIn < 0) {
                return res.status(400).json({ success: false, message: 'Expiry time must be a non-negative number' });
            }
            
            if (!expiryUnit || !['min', 'hour', 'day'].includes(expiryUnit)) {
                return res.status(400).json({ success: false, message: 'Expiry unit must be one of: min, hour, day' });
            }
        }

        // Import OpenAI
        const { OpenAI } = require('openai');
        
        // Use API key from environment variables
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('Missing OpenRouter API key in environment variables');
            return res.status(500).json({ 
                success: false, 
                message: 'Server configuration error: Missing API key'
            });
        }
        
        // Initialize OpenAI client with OpenRouter endpoint
        const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://perform5.com',
                'X-Title': 'Perform5 Coding Assessment Generator'
            }
        });
        
        // Prepare system prompt for coding assessment generation
        const systemPrompt = `You are an expert technical interviewer creating a coding assessment for ${programmingLanguage} developers.
Create a coding assessment with exactly ${numQuestionsInt} problems of ${difficulty} difficulty level focused on ${topic}.

For each problem:
1. Provide a clear problem statement
2. Include any necessary context, constraints, or examples
3. Provide clear evaluation instructions for the assessor

Return the assessment in a structured JSON format like this:
{
  "title": "Coding Assessment: ${topic} in ${programmingLanguage}",
  "questions": [
    {
      "question": "Detailed problem statement goes here",
      "evaluationInstructions": "Instructions for evaluating the solution, including test cases, expected outputs, and evaluation criteria",
      "points": 100
    }
  ]
}

VERY IMPORTANT: 
1. Your response must be valid JSON with no comments, explanations, or additional text.
2. Do NOT wrap your JSON in markdown code blocks (like \`\`\`json).
3. Just return the raw JSON object directly.
4. Make sure the problems are clearly stated and unambiguous.
5. Make sure the evaluation instructions are detailed enough for a human evaluator to assess solutions fairly.`;

        // Call OpenRouter/OpenAI API to generate assessment
        try {
            console.log('Requesting coding assessment generation from OpenRouter API...');
            
            // List of models to try (in order of preference)
            const models = [
                "deepseek/deepseek-chat:free",
            ];
            
            let completion;
            let modelUsed;
            let apiError;
            
            // Try each model until one works
            for (const model of models) {
                try {
                    console.log(`Attempting to use model: ${model}`);
                    
                    completion = await openai.chat.completions.create({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Create a coding assessment about ${topic} in ${programmingLanguage} with ${numQuestionsInt} ${difficulty} difficulty problems.` }
                        ],
                        temperature: 0.7,
                        response_format: { type: 'json_object' },
                        max_tokens: 4000,
                    });
                    
                    modelUsed = model;
                    console.log(`Successfully generated coding assessment using model: ${modelUsed}`);
                    break; // Exit the loop if successful
                } catch (modelError) {
                    console.error(`Error with model ${model}:`, modelError);
                    apiError = modelError;
                    // Continue to next model
                }
            }
            
            // If no model worked
            if (!completion) {
                console.error('All models failed:', apiError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate coding assessment with available AI models. Please try again later.',
                    details: apiError.message || 'Unknown API error'
                });
            }
            
            // Parse the response with error handling
            let assessmentData;
            try {
                let responseContent = completion.choices[0].message.content;
                
                // Clean up response content
                responseContent = responseContent
                    .replace(/^```json\s*/gm, '') // Remove opening ```json
                    .replace(/\s*```\s*$/gm, '')  // Remove closing ```
                    .replace(/\/\/.*$/gm, '') // Remove single line comments
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                    .trim();
                
                assessmentData = JSON.parse(responseContent);
                
                // Validate the returned assessment structure
                if (!assessmentData.title) {
                    assessmentData.title = `Coding Assessment: ${topic} in ${programmingLanguage}`;
                }
                
                // Check and fix assessment structure if needed
                if (!assessmentData.questions && assessmentData.question) {
                    assessmentData.questions = assessmentData.question;
                    delete assessmentData.question;
                }
                
                if (!assessmentData.questions || !Array.isArray(assessmentData.questions)) {
                    throw new Error('Invalid assessment structure returned from AI: missing questions array');
                }
                
                // Fix structure of each question if needed
                assessmentData.questions = assessmentData.questions.map((q, idx) => {
                    const fixedQuestion = {
                        question: q.question,
                        evaluationInstructions: q.evaluationInstructions,
                        points: q.points || 100
                    };
                    
                    // Validate the fixed question
                    if (!fixedQuestion.question || !fixedQuestion.evaluationInstructions) {
                        console.error(`Question ${idx+1} has an invalid structure:`, fixedQuestion);
                        throw new Error(`Question ${idx+1} has an invalid structure`);
                    }
                    
                    return fixedQuestion;
                });
                
                // Get creator's username
                let createdBy = '';
                try {
                    const user = await User.findOne({ email });
                    if (user && user.name) {
                        createdBy = user.name;
                    } else {
                        createdBy = email.split('@')[0];
                    }
                } catch (userErr) {
                    createdBy = email.split('@')[0];
                }
                
                // Ensure createdBy is not empty
                if (!createdBy) {
                    createdBy = 'anonymous';
                }
                
                // Create assessment data with optional expiry settings
                const quizModelData = {
                    title: assessmentData.title,
                    timeLimit: timeLimitInt,
                    questions: assessmentData.questions,
                    createdBy,
                    creatorEmail: email,
                    assessmentType: 'coding',
                    isAIGenerated: true,
                    metadata: {
                        programmingLanguage,
                        difficulty,
                        topic
                    }
                };
                
                // Add expiry fields if provided
                if (expiresIn !== undefined) {
                    quizModelData.expiresIn = expiresIn;
                    quizModelData.expiryUnit = expiryUnit;
                }
                
                // Create the assessment in the database
                const quiz = new Quiz(quizModelData);
                await quiz.save();
                
                res.status(201).json({ 
                    success: true, 
                    message: 'AI-generated coding assessment created successfully',
                    quizId: quiz._id,
                    quiz: {
                        title: quiz.title,
                        questionsCount: quiz.questions.length,
                        timeLimit: quiz.timeLimit,
                        assessmentType: quiz.assessmentType
                    }
                });
                
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                console.error('Raw AI response:', completion.choices[0].message.content);
                
                // Return a user-friendly error message
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to generate a valid coding assessment. Please try again or adjust your prompt.',
                    detail: parseError.message
                });
            }
        } catch (openAIError) {
            console.error('OpenRouter/OpenAI API Error:', openAIError);
            return res.status(500).json({
                success: false,
                message: `AI API Error: ${openAIError.message || 'Unknown error'}`,
                details: openAIError.response ? openAIError.response.data : null
            });
        }
    } catch (error) {
        console.error('Error generating coding assessment with AI:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to generate coding assessment: ${error.message || 'Unknown server error'}`
        });
    }
};

// Generate a writing assessment using AI
exports.generateWritingAssessment = async (req, res) => {
    try {
        const { topic, writingType, difficulty, numQuestions, timeLimit, email, expiresIn, expiryUnit } = req.body;
        
        // Log received data for debugging
        console.log('Received AI writing assessment generation request:', {
            topic,
            writingType,
            difficulty,
            numQuestions,
            timeLimit,
            email,
            expiresIn,
            expiryUnit
        });
        
        // Validate input
        if (!topic || !writingType || !difficulty || !numQuestions || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: topic, writingType, difficulty, numQuestions, and email' 
            });
        }
        
        // Validate numeric inputs
        const numQuestionsInt = parseInt(numQuestions);
        const timeLimitInt = parseInt(timeLimit) || 60; // Default to 60 minutes if not provided
        
        if (isNaN(numQuestionsInt) || numQuestionsInt <= 0 || numQuestionsInt > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Number of questions must be between 1 and 5' 
            });
        }
        
        // Validate expiry fields if provided
        if (expiresIn !== undefined) {
            if (typeof expiresIn !== 'number' || expiresIn < 0) {
                return res.status(400).json({ success: false, message: 'Expiry time must be a non-negative number' });
            }
            
            if (!expiryUnit || !['min', 'hour', 'day'].includes(expiryUnit)) {
                return res.status(400).json({ success: false, message: 'Expiry unit must be one of: min, hour, day' });
            }
        }

        // Import OpenAI
        const { OpenAI } = require('openai');
        
        // Use API key from environment variables
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('Missing OpenRouter API key in environment variables');
            return res.status(500).json({ 
                success: false, 
                message: 'Server configuration error: Missing API key'
            });
        }
        
        // Initialize OpenAI client with OpenRouter endpoint
        const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://perform5.com',
                'X-Title': 'Perform5 Writing Assessment Generator'
            }
        });
        
        // Prepare system prompt for writing assessment generation
        const systemPrompt = `You are an expert writing instructor creating a ${writingType} writing assessment.
Create a writing assessment with exactly ${numQuestionsInt} prompts of ${difficulty} difficulty level focused on ${topic}.

For each prompt:
1. Provide a clear writing prompt that requires detailed written responses
2. Include any necessary context, guidelines, or requirements
3. Provide clear evaluation instructions for the assessor including rubrics for scoring

Return the assessment in a structured JSON format like this:
{
  "title": "Writing Assessment: ${topic} - ${writingType}",
  "questions": [
    {
      "question": "Detailed writing prompt goes here",
      "evaluationInstructions": "Instructions for evaluating the writing, including specific criteria, scoring guidelines, and what to look for in strong responses",
      "points": 100
    }
  ]
}

VERY IMPORTANT: 
1. Your response must be valid JSON with no comments, explanations, or additional text.
2. Do NOT wrap your JSON in markdown code blocks (like \`\`\`json).
3. Just return the raw JSON object directly.
4. Make sure the prompts are clearly stated and unambiguous.
5. Make sure the evaluation instructions are detailed enough for a human evaluator to assess written responses fairly.`;

        // Call OpenRouter/OpenAI API to generate assessment
        try {
            console.log('Requesting writing assessment generation from OpenRouter API...');
            
            // List of models to try (in order of preference)
            const models = [
                "deepseek/deepseek-chat:free",
            ];
            
            let completion;
            let modelUsed;
            let apiError;
            
            // Try each model until one works
            for (const model of models) {
                try {
                    console.log(`Attempting to use model: ${model}`);
                    
                    completion = await openai.chat.completions.create({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Create a ${writingType} writing assessment about ${topic} with ${numQuestionsInt} ${difficulty} difficulty prompts.` }
                        ],
                        temperature: 0.7,
                        response_format: { type: 'json_object' },
                        max_tokens: 4000,
                    });
                    
                    modelUsed = model;
                    console.log(`Successfully generated writing assessment using model: ${modelUsed}`);
                    break; // Exit the loop if successful
                } catch (modelError) {
                    console.error(`Error with model ${model}:`, modelError);
                    apiError = modelError;
                    // Continue to next model
                }
            }
            
            // If no model worked
            if (!completion) {
                console.error('All models failed:', apiError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate writing assessment with available AI models. Please try again later.',
                    details: apiError.message || 'Unknown API error'
                });
            }
            
            // Parse the response with error handling
            let assessmentData;
            try {
                let responseContent = completion.choices[0].message.content;
                
                // Clean up response content
                responseContent = responseContent
                    .replace(/^```json\s*/gm, '') // Remove opening ```json
                    .replace(/\s*```\s*$/gm, '')  // Remove closing ```
                    .replace(/\/\/.*$/gm, '') // Remove single line comments
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                    .trim();
                
                assessmentData = JSON.parse(responseContent);
                
                // Validate the returned assessment structure
                if (!assessmentData.title) {
                    assessmentData.title = `Writing Assessment: ${topic} - ${writingType}`;
                }
                
                // Check and fix assessment structure if needed
                if (!assessmentData.questions && assessmentData.question) {
                    assessmentData.questions = assessmentData.question;
                    delete assessmentData.question;
                }
                
                if (!assessmentData.questions || !Array.isArray(assessmentData.questions)) {
                    throw new Error('Invalid assessment structure returned from AI: missing questions array');
                }
                
                // Fix structure of each question if needed
                assessmentData.questions = assessmentData.questions.map((q, idx) => {
                    const fixedQuestion = {
                        question: q.question,
                        evaluationInstructions: q.evaluationInstructions,
                        points: q.points || 100
                    };
                    
                    // Validate the fixed question
                    if (!fixedQuestion.question || !fixedQuestion.evaluationInstructions) {
                        console.error(`Question ${idx+1} has an invalid structure:`, fixedQuestion);
                        throw new Error(`Question ${idx+1} has an invalid structure`);
                    }
                    
                    return fixedQuestion;
                });
                
                // Get creator's username
                let createdBy = '';
                try {
                    const user = await User.findOne({ email });
                    if (user && user.name) {
                        createdBy = user.name;
                    } else {
                        createdBy = email.split('@')[0];
                    }
                } catch (userErr) {
                    createdBy = email.split('@')[0];
                }
                
                // Ensure createdBy is not empty
                if (!createdBy) {
                    createdBy = 'anonymous';
                }
                
                // Create assessment data with optional expiry settings
                const quizModelData = {
                    title: assessmentData.title,
                    timeLimit: timeLimitInt,
                    questions: assessmentData.questions,
                    createdBy,
                    creatorEmail: email,
                    assessmentType: 'writing',
                    isAIGenerated: true,
                    metadata: {
                        writingType,
                        difficulty,
                        topic
                    }
                };
                
                // Add expiry fields if provided
                if (expiresIn !== undefined) {
                    quizModelData.expiresIn = expiresIn;
                    quizModelData.expiryUnit = expiryUnit;
                }
                
                // Create the assessment in the database
                const quiz = new Quiz(quizModelData);
                await quiz.save();
                
                res.status(201).json({ 
                    success: true, 
                    message: 'AI-generated writing assessment created successfully',
                    quizId: quiz._id,
                    quiz: {
                        title: quiz.title,
                        questionsCount: quiz.questions.length,
                        timeLimit: quiz.timeLimit,
                        assessmentType: quiz.assessmentType
                    }
                });
                
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                console.error('Raw AI response:', completion.choices[0].message.content);
                
                // Return a user-friendly error message
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to generate a valid writing assessment. Please try again or adjust your prompt.',
                    detail: parseError.message
                });
            }
        } catch (openAIError) {
            console.error('OpenRouter/OpenAI API Error:', openAIError);
            return res.status(500).json({
                success: false,
                message: `AI API Error: ${openAIError.message || 'Unknown error'}`,
                details: openAIError.response ? openAIError.response.data : null
            });
        }
    } catch (error) {
        console.error('Error generating writing assessment with AI:', error);
        res.status(500).json({ 
            success: false, 
            message: `Failed to generate writing assessment: ${error.message || 'Unknown server error'}`
        });
    }
};

// Get user's channels for assessment assignment
exports.getUserChannels = async (req, res) => {
    try {
        // Channel model is already imported at the top of the file
        const { email } = req.params;
        
        console.log(`Fetching channels for user with email: ${email}`);
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User not found with email: ${email}`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        console.log(`Found user: ${user._id}, now fetching their channels`);
        
        // Directly query channels where user is a member
        const userChannels = await Channel.find({ 'members.user': user._id });
        
        console.log(`Found ${userChannels.length} channels for user ${email}`);
        
        // Format channels data for frontend - simpler approach
        const formattedChannels = userChannels.map(channel => {
            // Get user's role in this channel
            const member = channel.members.find(m => m.user.toString() === user._id.toString());
            const userRole = member ? member.role : 'newbie';
            
            // Process subchannels based on user role
            let availableSubchannels;
            
            if (['creator', 'admin', 'moderator'].includes(userRole)) {
                // User has special role, include all subchannels
                availableSubchannels = channel.subchannels;
                console.log(`User ${email} has role ${userRole} in channel ${channel.name}, showing all ${channel.subchannels.length} subchannels`);
            } else {
                // Only include subchannels where user is explicitly a member
                availableSubchannels = channel.subchannels.filter(subchannel => 
                    subchannel.members.some(m => m.user.toString() === user._id.toString())
                );
                console.log(`User ${email} has role ${userRole} in channel ${channel.name}, showing ${availableSubchannels.length} of ${channel.subchannels.length} subchannels`);
            }
            
            // Map subchannels to the required format
            const subchannels = availableSubchannels.map(subchannel => ({
                id: subchannel._id,
                name: subchannel.name,
                memberCount: subchannel.members.length
            }));
            
            return {
                id: channel._id,
                name: channel.name,
                memberCount: channel.members.length,
                subchannels: subchannels
            };
        });
        
        console.log(`Returning ${formattedChannels.length} formatted channels to the client`);
        res.status(200).json({ success: true, channels: formattedChannels });
    } catch (error) {
        console.error('Error fetching user channels:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: `Failed to fetch user channels: ${error.message}` });
    }
};