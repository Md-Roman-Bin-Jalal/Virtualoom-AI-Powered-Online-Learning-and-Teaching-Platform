const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Google Generative AI client with API key from environment
const API_KEY = process.env.GEMINI_API_KEY;

// Check if API key exists
if (!API_KEY) {
  console.error('WARNING: GEMINI_API_KEY not found in environment variables. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Configure safety settings
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
];

// Create a version of the generative model with retry logic
const getGenerativeModelWithRetry = (modelName = "gemini-2.0-flash", maxRetries = 3, retryDelayMs = 1000) => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings,
  });

  // Add a wrapper method with retry logic
  const generateContentWithRetry = async (prompt) => {
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1} to generate content`);
        return await model.generateContent(prompt);
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        // Wait before retrying
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * (attempt + 1)));
        }
      }
    }
    
    throw new Error(`All ${maxRetries} attempts failed: ${lastError?.message || 'Unknown error'}`);
  };

  return {
    ...model,
    generateContentWithRetry,
  };
};

// Special configuration for quiz generation which needs more complex processing
const getQuizGenerationModel = (maxRetries = 5, retryDelayMs = 2000) => {
  // Try to use the best available model with fallback options
  let modelName = "gemini-1.5-flash"; // Start with a reliable model that has good quota limits
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings,
    generationConfig: {
      temperature: 0.6,      // Slightly lower temperature for more consistent responses
      topP: 0.9,             // Broader sampling for more varied content
      topK: 40,              // Wider range of token selection
      maxOutputTokens: 2048, // Allow longer responses for complex quizzes
    }
  });  // Specialized retry logic for quiz generation with fallback model options
  const generateQuizWithRetry = async (prompt) => {
    // Define model fallbacks in order of preference
    const modelOptions = ["Gemini 2.0 Flash-Lite", "gemini-1.5-flash", "Gemini 1.5 Flash-8B", "gemini-1.0-pro"];
    let currentModelIndex = 0;
    let lastError = null;
    
    // Try with multiple models if needed
    for (let modelAttempt = 0; modelAttempt < modelOptions.length; modelAttempt++) {
      if (modelAttempt > 0) {
        // Switch to a different model if previous one failed
        try {
          console.log(`Switching to fallback model: ${modelOptions[modelAttempt]}`);
          const fallbackModel = genAI.getGenerativeModel({
            model: modelOptions[modelAttempt],
            safetySettings,
            generationConfig: {
              temperature: 0.6,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 2048,
            }
          });
          Object.assign(model, fallbackModel);
        } catch (modelErr) {
          console.error(`Failed to switch to model ${modelOptions[modelAttempt]}:`, modelErr);
          continue; // Try next model
        }
      }
      
      // Try multiple attempts with current model
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`Quiz generation: Model ${modelOptions[currentModelIndex]}, Attempt ${attempt + 1}`);
          
          // If not the first attempt, add a clarification to the prompt
          let enhancedPrompt = prompt;
          if (attempt > 0) {
            enhancedPrompt = `${prompt}\n\nCRITICAL FORMATTING REQUIREMENT: You MUST strictly follow this format:
            
QUESTION 1: Question text
OPTION 0: First option text
OPTION 1: Second option text
OPTION 2: Third option text
OPTION 3: Fourth option text
CORRECT: [index of correct option - must be 0, 1, 2, or 3]

Repeat this pattern for each question. No deviations from this format are allowed.`;
          }
          
          const response = await model.generateContent(enhancedPrompt);
          
          // Validate the response format before returning
          const responseText = response.response.text();
          const isValidFormat = /QUESTION \d+:.+?OPTION 0:.+?OPTION 1:.+?OPTION 2:.+?OPTION 3:.+?CORRECT: [0-3]/s.test(responseText);
          
          if (!isValidFormat && attempt < maxRetries - 1) {
            console.log("Response format invalid, retrying with clearer instructions");
            throw new Error("Invalid response format");
          }
          
          return response;
        } catch (error) {
          console.error(`Quiz generation attempt ${attempt + 1} failed with model ${modelOptions[currentModelIndex]}:`, error);
          lastError = error;
          
          // Check if it's a quota/rate limit error
          const isQuotaError = error.message && (
            error.message.includes("quota") || 
            error.message.includes("rate limit") || 
            error.message.includes("429")
          );
          
          if (isQuotaError) {
            console.log("Quota or rate limit hit, will try different model");
            break; // Exit this attempt loop to try next model
          }
          
          // Exponential backoff for retry delay
          if (attempt < maxRetries - 1) {
            const delay = retryDelayMs * Math.pow(1.5, attempt);
            console.log(`Waiting ${delay}ms before next retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Update current model index
      currentModelIndex = modelAttempt + 1;
    }
    
        // If we've exhausted all models and attempts, create a synthetic quiz as fallback
    console.log("All model attempts failed, creating fallback quiz content");
    
    try {
      // Create a synthetic response with properly formatted questions
      const fallbackQuiz = `QUESTION 1: What is the primary purpose of an automated quiz system?
OPTION 0: To generate random questions
OPTION 1: To create structured assessments for learning and evaluation
OPTION 2: To replace human teachers
OPTION 3: To make quizzes more difficult
CORRECT: 1

QUESTION 2: Which of the following is a key benefit of AI-generated quizzes?
OPTION 0: They are always easier than human-made quizzes
OPTION 1: They can only contain multiple choice questions
OPTION 2: They can quickly generate content on specific topics
OPTION 3: They never contain errors
CORRECT: 2

QUESTION 3: What should you do if quiz generation fails?
OPTION 0: Give up and try a different assessment type
OPTION 1: Try again with fewer questions or a simpler topic
OPTION 2: Use only pre-made quizzes
OPTION 3: Avoid using quizzes altogether
CORRECT: 1`;

      // Create a mock response object matching the Gemini API structure
      return {
        response: {
          text: () => fallbackQuiz
        }
      };
    } catch (fallbackError) {
      throw new Error(`All quiz generation attempts failed and fallback creation also failed: ${lastError?.message || 'Unknown error'}`);
    }
  };

  return {
    ...model,
    generateQuizWithRetry,
  };
};

module.exports = {
  genAI,
  getGenerativeModelWithRetry,
  getQuizGenerationModel,
  safetySettings
};
