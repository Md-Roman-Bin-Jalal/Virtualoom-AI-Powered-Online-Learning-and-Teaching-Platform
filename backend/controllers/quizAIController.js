// Modified quizAIController with quiz-specific generation enhancements
const User = require('../models/User');
const QuizAIAssessment = require('../models/QuizAIAssessment');
const { genAI, getGenerativeModelWithRetry, getQuizGenerationModel } = require('../utils/geminiClient');

// Create a quiz AI assessment with enhanced error handling and timeout
exports.createQuizAIAssessment = async (req, res) => {
    try {
        console.log('Quiz AI assessment request received at:', new Date().toISOString());
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        
        // Initial validation - make sure we have a request body
        if (!req.body) {
            console.error('Missing request body');
            return res.status(400).json({ success: false, message: 'Missing request body' });
        }
        
        // Extract fields from request body with type safety
        const { 
            title, 
            timeLimit, 
            email, 
            expiresIn, 
            expiryUnit, 
            category,
            difficulty, 
            topic,
            numberOfQuestions,
            pointsPerQuestion
        } = req.body;
        
        // Log received data for debugging
        console.log('Received quiz AI assessment data:', {
            title, 
            timeLimit,
            email,
            expiresIn,
            expiryUnit,
            category,
            difficulty,
            topic,
            numberOfQuestions,
            pointsPerQuestion
        });
        
        // Validation with type conversion to ensure consistent data types
        const validTitle = String(title || '').trim();
        if (!validTitle) {
            console.error('Missing required field: title');
            return res.status(400).json({ success: false, message: 'Assessment title is required' });
        }
        
        const validTimeLimit = Number(timeLimit);
        if (isNaN(validTimeLimit) || validTimeLimit <= 0) {
            return res.status(400).json({ success: false, message: 'Time limit is required and must be a positive number' });
        }
        
        const validEmail = String(email || '').trim();
        if (!validEmail) {
            return res.status(400).json({ success: false, message: 'Creator email is required' });
        }
        
        const validCategory = String(category || '').trim();
        if (!validCategory) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }        const validDifficulty = String(difficulty || '').toLowerCase();
        if (!['easy', 'moderate', 'hard'].includes(validDifficulty)) {
            return res.status(400).json({ success: false, message: 'Valid difficulty level is required (easy, moderate, or hard)' });
        }

        const validTopic = String(topic || '').trim();
        if (!validTopic) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }
        
        const validNumberOfQuestions = Number(numberOfQuestions);
        if (isNaN(validNumberOfQuestions) || validNumberOfQuestions < 1 || validNumberOfQuestions > 20) {
            return res.status(400).json({ success: false, message: 'Number of questions is required and must be between 1 and 20' });
        }
        
        // Validate points per question
        const validPointsPerQuestion = Number(pointsPerQuestion);
        if (isNaN(validPointsPerQuestion) || validPointsPerQuestion < 1) {
            return res.status(400).json({ success: false, message: 'Points per question must be a positive number' });
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
        }        // Limit number of questions to prevent timeouts
        let questionsCount = numberOfQuestions;
        if (!questionsCount || typeof questionsCount !== 'number' || questionsCount < 1) {
            questionsCount = 5; // Default to 5
        } else if (questionsCount > 15) {
            questionsCount = 15; // Cap at 15 questions to avoid timeouts
            console.log(`Limiting questions to ${questionsCount} to prevent timeout`);
        }        // Create AI Prompt with stricter formatting instructions
        const aiPrompt = `Create a quiz with ${questionsCount} multiple-choice questions about "${validTopic}" with ${validDifficulty} difficulty for the category "${validCategory}".
            
            CRITICAL FORMATTING REQUIREMENT:
            For each question, provide EXACTLY 4 options and indicate which option is correct.
            You MUST follow this exact format with NO deviations:
            
            QUESTION 1: [question text]
            OPTION 0: [first option text]
            OPTION 1: [second option text]
            OPTION 2: [third option text]
            OPTION 3: [fourth option text]
            CORRECT: [index of correct option - must be 0, 1, 2, or 3]
            
            QUESTION 2: [question text]
            OPTION 0: [first option text]
            OPTION 1: [second option text]
            OPTION 2: [third option text]
            OPTION 3: [fourth option text]
            CORRECT: [index of correct option - must be 0, 1, 2, or 3]
            
            Continue with this EXACT pattern for all remaining questions.
            
            REQUIREMENTS:
            1. Questions must be clear, concise, and factually accurate
            2. All options should be plausible, but only one must be correct
            3. The correct option MUST be marked with its index number (0, 1, 2, or 3) after "CORRECT:" 
            4. Questions should gradually increase in complexity
            5. ALWAYS include EXACTLY four options (labeled 0-3) for EVERY question
            6. ALWAYS specify the correct option index after all options
            7. DO NOT add any explanations or additional text outside this format`;

        // Implement a timeout mechanism
        const timeout = 60000; // 60 seconds timeout for quiz generation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API request timed out')), timeout);
        });

        try {
            // Use the specialized quiz generation model
            console.log("Calling Gemini API with quiz prompt...");
            const quizModel = getQuizGenerationModel(5, 2000); // 5 retries, 2s delay
            
            // Race between the API call and timeout
            const result = await Promise.race([
                quizModel.generateQuizWithRetry(aiPrompt),
                timeoutPromise
            ]);
            
            const responseText = result.response.text();
            console.log("Received AI response for quiz:", responseText);            // Parse the response to extract questions with robust error handling
            const questions = [];
            
            // Use regex to find all questions with proper formatting
            const questionRegex = /QUESTION\s+(\d+):\s*([\s\S]*?)(?=QUESTION\s+\d+:|$)/gi;
            const questionMatches = [...responseText.matchAll(questionRegex)];
            
            if (questionMatches.length === 0) {
                // Try alternate approach - split by QUESTION marker
                const questionBlocks = responseText.split(/QUESTION\s+\d+:/i).filter(block => block.trim());
                
                if (questionBlocks.length === 0) {
                    console.error("Failed to parse questions from response");
                    return res.status(500).json({ 
                        success: false, 
                        message: 'The AI generated an improperly formatted response. Please try again.'
                    });
                }
                
                // Process each question block
                questionBlocks.forEach((block, index) => {
                    processQuestionBlock(block, index, questions, pointsPerQuestion);
                });
            } else {
                // Process using regex matches
                questionMatches.forEach((match, index) => {
                    const questionContent = match[2];
                    processQuestionBlock(questionContent, index, questions, pointsPerQuestion);
                });
            }
            
            // Helper function to process each question block
            function processQuestionBlock(block, index, questions, pointsPerQuestion) {
                try {
                    // Extract question text
                    let questionText = block.trim().split(/OPTION 0:/i)[0].trim();
                    if (!questionText) {
                        questionText = `Question ${index + 1}`;
                    }
                    
                    // Extract options
                    const options = [];
                    for (let i = 0; i < 4; i++) {
                        const optionRegex = new RegExp(`OPTION ${i}:\\s*(.+?)(?=\\s*OPTION ${i+1}:|\\s*CORRECT:|$)`, 'is');
                        const optionMatch = block.match(optionRegex);
                        if (optionMatch && optionMatch[1]) {
                            options.push(optionMatch[1].trim());
                        } else {
                            options.push(`Option ${String.fromCharCode(65 + i)}`); // Use A, B, C, D as fallback
                        }
                    }
                    
                    // Extract correct option
                    const correctRegex = /CORRECT:\s*(\d+)/i;
                    const correctMatch = block.match(correctRegex);
                    let correctOptions = [0]; // Default to first option
                    
                    if (correctMatch && correctMatch[1]) {
                        const correctIndex = parseInt(correctMatch[1]);
                        if (correctIndex >= 0 && correctIndex <= 3) {
                            correctOptions = [correctIndex];
                        }
                    }
                    
                    // If we have question text and at least some options, add to the array
                    if (questionText && options.length > 0) {
                        questions.push({
                            questionText: questionText,
                            options: options.length === 4 ? options : options.concat(Array(4 - options.length).fill('Option')),
                            correctOptions: correctOptions,
                            points: pointsPerQuestion || 10
                        });
                    }
                } catch (parseError) {
                    console.error(`Error parsing question ${index + 1}:`, parseError);
                }
            }
              // If we couldn't parse any questions, or if we have fewer than expected
            if (questions.length === 0) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to generate and parse quiz questions. Please try again.'
                });
            }
            
            if (questions.length < questionsCount) {
                console.warn(`Generated fewer questions than requested: ${questions.length} out of ${questionsCount}`);
            }
              // Create assessment data object with validated data
            const assessmentData = {
                title: validTitle,
                timeLimit: validTimeLimit,
                questions,
                createdBy,
                creatorEmail: validEmail,
                category: validCategory,
                difficulty: validDifficulty,
                aiPrompt,
                numberOfQuestions: questions.length, // Use actual number of questions generated
                pointsPerQuestion: validPointsPerQuestion
            };
            
            // Add expiry fields if provided
            const validExpiresIn = Number(expiresIn);
            const validExpiryUnit = String(expiryUnit || 'day');
            if (!isNaN(validExpiresIn) && validExpiresIn > 0) {
                assessmentData.expiresIn = validExpiresIn;
                assessmentData.expiryUnit = validExpiryUnit;
            } else {
                // Default expiration if not provided or invalid
                assessmentData.expiresIn = 7;
                assessmentData.expiryUnit = 'day';
            }
              // Create and save the assessment
            const quizAssessment = new QuizAIAssessment(assessmentData);
            await quizAssessment.save();
            
            console.log('Quiz AI assessment created successfully with ID:', quizAssessment._id);            // Return success response with explicit success property
            const responseData = { 
                success: true, 
                message: 'Quiz AI assessment created successfully',
                assessmentId: quizAssessment._id,
                assessment: quizAssessment
            };
            
            // Log the response we're sending
            console.log('Sending successful response with assessment ID:', quizAssessment._id);
            
            // Ensure CORS headers are set
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            res.setHeader('Content-Type', 'application/json');
            
            // Send the response with HTTP 201 Created status
            res.status(201).json(responseData);} catch (aiError) {
            console.error('Error generating quiz content:', aiError);
            
            // Check if it's a timeout error
            if (aiError.message === 'API request timed out') {
                return res.status(504).json({ 
                    success: false, 
                    message: 'Quiz generation timed out. Please try again with fewer questions or a different topic.'
                });
            }
            
            // Check for specific Gemini API errors and provide clear messages
            if (aiError.message && aiError.message.includes('safety')) {
                return res.status(400).json({
                    success: false,
                    message: 'Could not generate quiz due to content policy restrictions. Please try a different topic.'
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                message: `Failed to generate quiz content: ${aiError.message || 'Unknown AI error'}`
            });
        }
        
    } catch (error) {
        // Handle errors
        console.error('Error creating quiz AI assessment:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Quiz AI assessment validation failed', 
                errors: validationErrors 
            });
        }
        
        // Return generic error message
        res.status(500).json({ 
            success: false, 
            message: `Failed to create quiz assessment: ${error.message || 'Unknown server error'}`
        });
    }
};

// The rest of your controller methods remain unchanged
exports.getQuizAIAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await QuizAIAssessment.findById(id);
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Quiz AI assessment not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            assessment 
        });
    } catch (error) {
        console.error('Error fetching quiz AI assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quiz AI assessment' });
    }
};

// Get all quiz AI assessments by a creator
exports.getCreatorQuizAIAssessments = async (req, res) => {
    try {
        const { email } = req.params;
        const assessments = await QuizAIAssessment.find({ creatorEmail: email });
        
        res.status(200).json({ 
            success: true, 
            assessments 
        });
    } catch (error) {
        console.error('Error fetching creator quiz AI assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quiz AI assessments' });
    }
};

// Get all quiz AI assessments
exports.getAllQuizAIAssessments = async (req, res) => {
    try {
        const assessments = await QuizAIAssessment.find();
        
        res.status(200).json({ 
            success: true, 
            assessments 
        });
    } catch (error) {
        console.error('Error fetching all quiz AI assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch quiz AI assessments' });
    }
};
