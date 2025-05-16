const User = require('../models/User');
const QuizManualAssessment = require('../models/QuizManualAssessment');

// Create a manual quiz assessment
exports.createQuizManualAssessment = async (req, res) => {
    try {
        const { title, timeLimit, questions, email, expiresIn, expiryUnit, category, difficulty } = req.body;
          // Log received data for debugging
        console.log('Received quiz manual assessment data:', {
            title: title,
            timeLimit: timeLimit,
            questionsCount: questions ? questions.length : 0,
            email: email,
            expiresIn: expiresIn,
            expiryUnit: expiryUnit,
            category: category || 'General',
            difficulty: difficulty || 'moderate'
        });
        
        // Log first question for debugging
        if (questions && questions.length > 0) {
            console.log('First question:', {
                questionText: questions[0].questionText,
                optionsCount: questions[0].options.length,
                correctOptions: questions[0].correctOptions
            });
        }
        
        // Validation
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
        
        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim() === '') {
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
            
            // Validate each option is not empty
            for (let j = 0; j < q.options.length; j++) {
                if (!q.options[j] || typeof q.options[j] !== 'string' || q.options[j].trim() === '') {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Option ${j+1} in question ${i+1} cannot be empty`
                    });
                }
            }
            
            if (!q.correctOptions || !Array.isArray(q.correctOptions) || q.correctOptions.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must have at least one correct option`
                });
            }
            
            // Ensure all correctOptions are valid indexes within options array
            for (const correctOption of q.correctOptions) {
                if (correctOption < 0 || correctOption >= q.options.length) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i+1} has an invalid correct option index`
                    });
                }
            }
            
            if (!q.points || typeof q.points !== 'number' || q.points <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must have valid points assigned`
                });
            }
        }
        
        // Get creator's username from the database
        let createdBy = '';
        try {
            const user = await User.findOne({ email });
            if (user && user.name) {
                createdBy = user.name;
            } else {
                // Fallback to email prefix
                createdBy = email.split('@')[0];
            }
        } catch (userErr) {
            // Fallback if user lookup fails
            createdBy = email.split('@')[0];
            console.error('Error finding user:', userErr);
        }
        
        // Ensure createdBy is not empty
        if (!createdBy) {
            createdBy = 'anonymous';
        }
        
        // Create assessment data object
        const assessmentData = {
            title,
            timeLimit,
            questions,
            createdBy,
            creatorEmail: email
        };
        
        // Add optional fields if provided
        if (expiresIn !== undefined) {
            assessmentData.expiresIn = expiresIn;
            assessmentData.expiryUnit = expiryUnit;
        }
        if (category) {
            assessmentData.category = category;
        }
        if (difficulty) {
            assessmentData.difficulty = difficulty;
        }
        
        // Create and save the assessment
        const quizAssessment = new QuizManualAssessment(assessmentData);
        await quizAssessment.save();
        
        console.log('Quiz manual assessment created successfully with ID:', quizAssessment._id);
        
        // Return success response
        res.status(201).json({ 
            success: true, 
            message: 'Quiz created successfully',
            assessmentId: quizAssessment._id
        });
    } catch (error) {
        // Handle errors
        console.error('Error creating quiz manual assessment:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Quiz validation failed', 
                errors: validationErrors 
            });
        }
        
        // Return generic error message
        res.status(500).json({ 
            success: false, 
            message: `Failed to create quiz: ${error.message || 'Unknown server error'}`
        });
    }
};

// Get a quiz manual assessment by ID
exports.getQuizManualAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await QuizManualAssessment.findById(id);
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            assessment 
        });
    } catch (error) {
        console.error('Error fetching quiz assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quiz' });
    }
};

// Get all quiz manual assessments by a creator
exports.getCreatorQuizManualAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        const assessments = await QuizManualAssessment.find({ creatorEmail: email });
        
        res.status(200).json({ 
            success: true, 
            assessments 
        });
    } catch (error) {
        console.error('Error fetching creator quiz assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
    }
};

// Get all quizzes (for browsing/discovery)
exports.getAllQuizManualAssessments = async (req, res) => {
    try {
        // Add pagination if needed
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;
        
        const quizzes = await QuizManualAssessment.find({}, {
            title: 1,
            createdBy: 1,
            createdAt: 1,
            timeLimit: 1,
            category: 1,
            difficulty: 1
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
        
        const total = await QuizManualAssessment.countDocuments();
        
        res.status(200).json({
            success: true,
            quizzes,
            pagination: {
                total,
                limit,
                skip
            }
        });
    } catch (error) {
        console.error('Error fetching all quizzes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
    }
};
