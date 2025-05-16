const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Access the API key from environment only - remove hardcoded fallback
const API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Gemini AI client
const initializeGeminiClient = () => {
  if (!API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables. Chatbot functionality will not work.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    return genAI;
  } catch (error) {
    console.error('Error initializing Gemini AI client:', error);
    return null;
  }
};

// Generate content using Gemini AI
const generateBotResponse = async (message) => {
  try {
    const genAI = initializeGeminiClient();
    
    if (!genAI) {
      return "I'm unable to respond right now. Please contact the administrator.";
    }

    // Initialize the model (gemini-2.0-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Add system prompt to constrain responses
    const systemPrompt = `You are a helpful assistant in a chat. 
    - Your name is Bot
    - Keep your answers extremely brief and under 69 characters total
    - Answer only what is asked directly
    - Do not use markdown or formatting
    - Do not apologize for brevity`;

    const generationConfig = {
      maxOutputTokens: 30,
      temperature: 0.2,
    };

    // Create the chat session with the system prompt
    const chat = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: "Who are you?",
        },
        {
          role: "model",
          parts: "I'm Bot, your assistant. How can I help?",
        },
        {
          role: "user", 
          parts: `${systemPrompt}. Remember to keep responses under 69 characters at all times.`
        },
        {
          role: "model",
          parts: "I understand. My responses will be brief and to the point."
        }
      ]
    });

    // Generate content
    const result = await chat.sendMessage(message);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // Ensure response is within length limit
    if (responseText.length > 69) {
      responseText = responseText.substring(0, 66) + "...";
    }
    
    return responseText;
  } catch (error) {
    console.error('Error generating bot response:', error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

module.exports = {
  initializeGeminiClient,
  generateBotResponse
};
