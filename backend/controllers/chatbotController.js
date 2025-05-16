const Chatbot = require('../models/Chatbot');
const Channel = require('../models/Channel');
const { generateBotResponse } = require('../utils/chatbotClient');

// Process a message and generate a bot response if it starts with "@bot"
const processBotMessage = async (req, res) => {
  try {
    const { channelId, subchannelId, content, senderName } = req.body;

    // Check if message is directed to the bot
    if (!content.trim().toLowerCase().startsWith('@bot')) {
      return res.status(400).json({ 
        success: false, 
        message: "Not a bot message" 
      });
    }

    // Extract the actual message (remove '@bot' part)
    const userMessage = content.trim().substring(4).trim();
    console.log(`Processing bot message: "${userMessage}" from ${senderName}`);
    
    if (!userMessage) {
      return res.status(400).json({ 
        success: false, 
        message: "Empty message to bot" 
      });
    }

    // Generate response from Gemini AI
    let botResponse = await generateBotResponse(userMessage);
    
    // Double check the response length to ensure it meets Channel schema requirements
    if (botResponse.length > 69) {
      console.warn('Bot response exceeded 69 characters, truncating...');
      botResponse = botResponse.substring(0, 66) + "...";
    }
    
    console.log(`Bot response (${botResponse.length} chars): "${botResponse}"`);

    // Save the interaction to database
    const chatbotInteraction = new Chatbot({
      channelId,
      subchannelId: subchannelId || null,
      userMessage,
      botResponse,
      timestamp: new Date()
    });

    await chatbotInteraction.save();    // Create a bot message object
    const botMessageObj = {
      senderName: 'Bot',
      senderRole: 'bot',
      content: botResponse,
      timestamp: new Date()
    };

    try {
      // Find the appropriate channel/subchannel
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        // Channel not found, but still send message via socket
        emitBotResponse();
        return res.status(404).json({ 
          success: false, 
          message: "Channel not found but message sent" 
        });
      }

      // Add message to the appropriate location
      if (subchannelId) {
        // Find the subchannel
        const subchannel = channel.subchannels.id(subchannelId);
        
        if (!subchannel) {
          // Subchannel not found, but still send message via socket
          emitBotResponse();
          return res.status(404).json({ 
            success: false, 
            message: "Subchannel not found but message sent" 
          });
        }
        
        subchannel.messages.push(botMessageObj);
      } else {
        // Add to main channel
        channel.messages.push(botMessageObj);
      }

      await channel.save();
      emitBotResponse();
      
      return res.status(200).json({
        success: true,
        botResponse: botMessageObj
      });
    } catch (error) {
      console.error("Error saving bot message to channel:", error);
      // Still emit the message even if saving to DB fails
      emitBotResponse();
      
      return res.status(200).json({
        success: true,
        warning: "Message sent but not saved to database: " + error.message,
        botResponse: botMessageObj
      });
    }
    
    // Helper function to emit the bot response via socket.io
    function emitBotResponse() {
      // Get the socketIO instance and emit the bot response
      const io = req.app.get('io');
      
      if (subchannelId) {
        const subchannelRoom = `${channelId}-${subchannelId}`;
        io.to(subchannelRoom).emit('subchannelMessage', botMessageObj);
      } else {
        io.to(channelId).emit('message', botMessageObj);
      }
    }
  } catch (error) {
    console.error("Error processing bot message:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + error.message 
    });
  }
};

// Simple test endpoint to verify the controller is working
const testBotResponse = async (req, res) => {
  try {
    const message = req.query.message || "Hello";
    const response = await generateBotResponse(message);
    
    res.status(200).json({
      success: true,
      message,
      response
    });
  } catch (error) {
    console.error("Error testing bot response:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + error.message 
    });
  }
};

module.exports = {
  processBotMessage,
  testBotResponse
};
