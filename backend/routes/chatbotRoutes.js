const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Route to process bot messages
router.post('/process', chatbotController.processBotMessage);

// Simple test endpoint
router.get('/test', chatbotController.testBotResponse);

module.exports = router;
