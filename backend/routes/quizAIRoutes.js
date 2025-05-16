const express = require('express');
const quizAIController = require('../controllers/quizAIController');

const router = express.Router();

// Quiz AI assessment routes
router.post('/create', quizAIController.createQuizAIAssessment);
router.get('/:id', quizAIController.getQuizAIAssessment);
router.get('/creator/:email', quizAIController.getCreatorQuizAIAssessments);
router.get('/', quizAIController.getAllQuizAIAssessments);

module.exports = router;
