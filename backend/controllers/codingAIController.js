// Modified codingAIController with improved error handling and timeout
const User = require('../models/User');
const CodingAIAssessment = require('../models/CodingAIAssessment');
const { genAI } = require('../utils/geminiClient');

// Create a coding AI assessment
exports.createCodingAIAssessment = async (req, res) => {
    try {
        console.log('Coding AI assessment request received');
        const { 
            title, 
            timeLimit, 
            email, 
            expiresIn, 
            expiryUnit, 
            difficulty, 
            programmingLanguage, 
            topic, 
            points 
        } = req.body;
        
        // Log received data for debugging
        console.log('Received coding AI assessment data:', {
            title, 
            timeLimit,
            email,
            expiresIn,
            expiryUnit,
            difficulty,
            programmingLanguage,
            topic,
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
        
        if (!programmingLanguage || typeof programmingLanguage !== 'string' || programmingLanguage.trim() === '') {
            return res.status(400).json({ success: false, message: 'Programming language is required' });
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

        // Create AI Prompt
        const aiPrompt = `Create a ${difficulty} level coding problem about "${topic}" in ${programmingLanguage}.
            The response should include:
            1. A clear title/question
            2. A detailed problem description that explains what needs to be coded
            3. Starter code (if applicable)
            4. Expected output or test cases
            Return the response in the following format:
            
            TITLE: [title of the problem]
            
            DESCRIPTION: [detailed description of the problem]
            
            STARTER CODE:
            [starter code here]
            
            EXPECTED OUTPUT:
            [expected output or test cases here]`;

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
            
            // Parse the response to extract components
            let questionText = title;
            let problemDescription = '';
            let starterCode = '';
            let expectedOutput = '';
            
            // Extract title
            const titleMatch = responseText.match(/TITLE:\s*(.*?)(?=\n\s*\n|\nDESCRIPTION)/s);
            if (titleMatch && titleMatch[1]) {
                questionText = titleMatch[1].trim();
            }
            
            // Extract description
            const descriptionMatch = responseText.match(/DESCRIPTION:\s*(.*?)(?=\n\s*\n|\nSTARTER CODE)/s);
            if (descriptionMatch && descriptionMatch[1]) {
                problemDescription = descriptionMatch[1].trim();
            }
            
            // Extract starter code
            const starterCodeMatch = responseText.match(/STARTER CODE:\s*(.*?)(?=\n\s*\n|\nEXPECTED OUTPUT)/s);
            if (starterCodeMatch && starterCodeMatch[1]) {
                starterCode = starterCodeMatch[1].trim();
            }
            
            // Extract expected output
            const expectedOutputMatch = responseText.match(/EXPECTED OUTPUT:\s*(.*?)(?=$)/s);
            if (expectedOutputMatch && expectedOutputMatch[1]) {
                expectedOutput = expectedOutputMatch[1].trim();
            }
            
            // If we couldn't parse properly, use the full response as the problem description
            if (!problemDescription) {
                problemDescription = responseText;
                expectedOutput = "See problem description";
            }
            
            // Create the question object
            const question = {
                questionText,
                problemDescription,
                starterCode,
                expectedOutput,
                difficulty,
                programmingLanguage,
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
            const codingAssessment = new CodingAIAssessment(assessmentData);
            await codingAssessment.save();
            
            console.log('Coding AI assessment created successfully with ID:', codingAssessment._id);
            
            // Return success response
            res.status(201).json({ 
                success: true, 
                message: 'Coding AI assessment created successfully',
                assessmentId: codingAssessment._id,
                assessment: codingAssessment
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
        console.error('Error creating coding AI assessment:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Coding AI assessment validation failed', 
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

// The rest of your controller methods remain unchanged
exports.getCodingAIAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await CodingAIAssessment.findById(id);
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Coding AI assessment not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            assessment 
        });
    } catch (error) {
        console.error('Error fetching coding AI assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coding AI assessment' });
    }
};

// Get all coding AI assessments by a creator
exports.getCreatorCodingAIAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        const assessments = await CodingAIAssessment.find({ creatorEmail: email });
        
        res.status(200).json({ 
            success: true, 
            assessments 
        });
    } catch (error) {
        console.error('Error fetching creator coding AI assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coding AI assessments' });
    }
};
