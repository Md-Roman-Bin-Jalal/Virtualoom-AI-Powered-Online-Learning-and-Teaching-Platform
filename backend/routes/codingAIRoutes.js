const express = require('express');
const codingAIController = require('../controllers/codingAIController');

const router = express.Router();

// Coding AI assessment routes
router.post('/create', codingAIController.createCodingAIAssessment);
router.get('/:id', codingAIController.getCodingAIAssessment);
router.get('/creator/:email', codingAIController.getCreatorCodingAIAssessments);

module.exports = router;
