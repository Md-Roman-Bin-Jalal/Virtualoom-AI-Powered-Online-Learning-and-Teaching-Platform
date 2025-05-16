const User = require('../models/User');
const CodingManualAssessment = require('../models/CodingManualAssessment');

// Create a manual coding assessment
exports.createCodingManualAssessment = async (req, res) => {
    try {
        const { title, timeLimit, questions, email, expiresIn, expiryUnit } = req.body;
          // Log received data for debugging
        console.log('Received coding manual assessment data:', {
            title: title,
            timeLimit: timeLimit,
            questionsCount: questions ? questions.length : 0,
            email: email,
            expiresIn: expiresIn,
            expiryUnit: expiryUnit
        });
        console.log('First question:', questions && questions.length > 0 ? {
            questionText: questions[0].questionText,
            programmingLanguage: questions[0].programmingLanguage
        } : 'No questions');
        
        // Validation
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ success: false, message: 'Assessment title is required and must be a string' });
        }
        
        if (!timeLimit || typeof timeLimit !== 'number' || timeLimit <= 0) {
            return res.status(400).json({ success: false, message: 'Time limit is required and must be a positive number' });
        }
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: 'Coding assessment must have at least one question' });
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
            
            if (!q.problemDescription || typeof q.problemDescription !== 'string' || q.problemDescription.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} problem description is required and must be a non-empty string`
                });
            }
            
            if (!q.expectedOutput || typeof q.expectedOutput !== 'string' || q.expectedOutput.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} expected output is required and must be a non-empty string`
                });
            }
            
            if (!q.programmingLanguage || typeof q.programmingLanguage !== 'string' || q.programmingLanguage.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must specify a programming language`
                });
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
        
        // Add expiry fields if provided
        if (expiresIn !== undefined) {
            assessmentData.expiresIn = expiresIn;
            assessmentData.expiryUnit = expiryUnit;
        }
        
        // Create and save the assessment
        const codingAssessment = new CodingManualAssessment(assessmentData);
        await codingAssessment.save();
        
        console.log('Coding manual assessment created successfully with ID:', codingAssessment._id);
        
        // Return success response
        res.status(201).json({ 
            success: true, 
            message: 'Coding assessment created successfully',
            assessmentId: codingAssessment._id
        });
    } catch (error) {
        // Handle errors
        console.error('Error creating coding manual assessment:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Coding assessment validation failed', 
                errors: validationErrors 
            });
        }
        
        // Return generic error message
        res.status(500).json({ 
            success: false, 
            message: `Failed to create coding assessment: ${error.message || 'Unknown server error'}`
        });
    }
};

// Get a coding manual assessment by ID
exports.getCodingManualAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await CodingManualAssessment.findById(id);
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Coding assessment not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            assessment 
        });
    } catch (error) {
        console.error('Error fetching coding assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coding assessment' });
    }
};

// Get all coding manual assessments by a creator
exports.getCreatorCodingManualAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        const assessments = await CodingManualAssessment.find({ creatorEmail: email });
        
        res.status(200).json({ 
            success: true, 
            assessments 
        });
    } catch (error) {
        console.error('Error fetching creator coding assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coding assessments' });
    }
};
