const User = require('../models/User');
const WritingManualAssessment = require('../models/WritingManualAssessment');

// Create a manual writing assessment
exports.createWritingManualAssessment = async (req, res) => {
    try {
        const { title, timeLimit, questions, email, expiresIn, expiryUnit, writingType } = req.body;
        
        // Log received data for debugging
        console.log('Received writing manual assessment data:', {
            title: title,
            timeLimit: timeLimit,
            questionsCount: questions ? questions.length : 0,
            email: email,
            expiresIn: expiresIn,
            expiryUnit: expiryUnit,
            writingType: writingType
        });
        
        // Validation
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
        
        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} text is required and must be a non-empty string`
                });
            }
            
            if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} prompt is required and must be a non-empty string`
                });
            }
            
            if (!q.wordLimit || typeof q.wordLimit !== 'number' || q.wordLimit <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Question ${i+1} must have a valid word limit`
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
        const writingAssessment = new WritingManualAssessment(assessmentData);
        await writingAssessment.save();
        
        console.log('Writing manual assessment created successfully with ID:', writingAssessment._id);
        
        // Return success response
        res.status(201).json({ 
            success: true, 
            message: 'Writing assessment created successfully',
            assessmentId: writingAssessment._id
        });
    } catch (error) {
        // Handle errors
        console.error('Error creating writing manual assessment:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Writing assessment validation failed', 
                errors: validationErrors 
            });
        }
        
        // Return generic error message
        res.status(500).json({ 
            success: false, 
            message: `Failed to create writing assessment: ${error.message || 'Unknown server error'}`
        });
    }
};

// Get a writing manual assessment by ID
exports.getWritingManualAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await WritingManualAssessment.findById(id);
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Writing assessment not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            assessment 
        });
    } catch (error) {
        console.error('Error fetching writing assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch writing assessment' });
    }
};

// Get all writing manual assessments by a creator
exports.getCreatorWritingManualAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        const assessments = await WritingManualAssessment.find({ creatorEmail: email });
        
        res.status(200).json({ 
            success: true, 
            assessments 
        });
    } catch (error) {
        console.error('Error fetching creator writing assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch writing assessments' });
    }
};
