// Modified writingAIController with improved error handling and timeout
const User = require('../models/User');
const WritingAIAssessment = require('../models/WritingAIAssessment');
const { genAI } = require('../utils/geminiClient');

// Create a writing AI assessment with improved error handling
exports.createWritingAIAssessment = async (req, res) => {
    try {
        console.log('Writing AI assessment request received');
        const { 
            title, 
            timeLimit, 
            email, 
            expiresIn, 
            expiryUnit, 
            difficulty, 
            writingType, 
            topic, 
            wordLimit, 
            points,
            instructions
        } = req.body;
        
        // Log received data for debugging
        console.log('Received writing AI assessment data:', {
            title, 
            timeLimit,
            email,
            expiresIn,
            expiryUnit,
            difficulty,
            writingType,
            topic,
            wordLimit,
            points
        });
        
        // Validation
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ success: false, message: 'Assessment title is required and must be a string' });
        }
        
        if (!timeLimit || typeof timeLimit !== 'number' || timeLimit <= 0) {
            return res.status(400).json({ success: false, message: 'Time limit is required and must be a positive number' });
        }
        
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ success: false, message: 'Creator email is required' });
        }
        
        if (!writingType || !['essay', 'short-answer', 'technical-document', 'creative-writing', 'analysis', 'research-paper'].includes(writingType)) {
            return res.status(400).json({ success: false, message: 'Valid writing type is required' });
        }

        if (!difficulty || !['easy', 'moderate', 'hard'].includes(difficulty)) {
            return res.status(400).json({ success: false, message: 'Valid difficulty level is required' });
        }

        if (!topic || typeof topic !== 'string' || topic.trim() === '') {
            return res.status(400).json({ success: false, message: 'Topic is required and must be a non-empty string' });
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

        // Create AI Prompt with timeout
        const aiPrompt = `Create a ${difficulty} level ${writingType} writing prompt about "${topic}". 
            The response should include:
            1. A clear title/question
            2. A detailed prompt that explains what to write about
            3. Any specific instructions or requirements
            The word limit for the response should be ${wordLimit} words. 
            Return just the writing prompt without any additional explanations or comments.`;

        // Implement a timeout mechanism
        const timeout = 30000; // 30 seconds timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API request timed out')), timeout);
        });

        try {
            // Generate the prompt using Gemini API with timeout
            console.log("Calling Gemini API with prompt:", aiPrompt);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            // Race between the API call and timeout
            const result = await Promise.race([
                model.generateContent(aiPrompt),
                timeoutPromise
            ]);
            
            const responseText = result.response.text();
            console.log("Received AI response:", responseText);
            
            // Parse the response to create a question
            const question = {
                questionText: title,
                prompt: responseText,
                instructions: instructions || '',
                wordLimit: wordLimit,
                difficulty: difficulty,
                writingType: writingType,
                points: points || 10
            };
            
            // Create assessment data object
            const assessmentData = {
                title,
                timeLimit,
                questions: [question],
                createdBy,
                creatorEmail: email,
                aiPrompt
            };
            
            // Add expiry fields if provided
            if (expiresIn !== undefined) {
                assessmentData.expiresIn = expiresIn;
                assessmentData.expiryUnit = expiryUnit;
            }
            
            // Create and save the assessment
            const writingAssessment = new WritingAIAssessment(assessmentData);
            await writingAssessment.save();
            
            console.log('Writing AI assessment created successfully with ID:', writingAssessment._id);
            
            // Return success response
            res.status(201).json({ 
                success: true, 
                message: 'Writing AI assessment created successfully',
                assessmentId: writingAssessment._id,
                assessment: writingAssessment
            });
        } catch (aiError) {
            console.error('Error generating content with Gemini API:', aiError);
            
            // Check if it's a timeout error
            if (aiError.message === 'API request timed out') {
                return res.status(504).json({ 
                    success: false, 
                    message: 'The AI content generation timed out. Please try again.'
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                message: `Failed to generate AI content: ${aiError.message || 'Unknown AI error'}`
            });
        }
        
    } catch (error) {
        // Handle errors
        console.error('Error creating writing AI assessment:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Writing AI assessment validation failed', 
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

// The rest of your controller methods remain unchanged
exports.getWritingAIAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await WritingAIAssessment.findById(id);
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Writing AI assessment not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            assessment 
        });
    } catch (error) {
        console.error('Error fetching writing AI assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch writing AI assessment' });
    }
};

// Get all writing AI assessments by a creator
exports.getCreatorWritingAIAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        const assessments = await WritingAIAssessment.find({ creatorEmail: email });
        
        res.status(200).json({ 
            success: true, 
            assessments 
        });
    } catch (error) {
        console.error('Error fetching creator writing AI assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch writing AI assessments' });
    }
};
