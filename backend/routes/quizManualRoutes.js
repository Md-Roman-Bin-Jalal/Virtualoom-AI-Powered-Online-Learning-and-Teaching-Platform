const express = require('express');
const quizManualController = require('../controllers/quizManualController');

const router = express.Router();

// Quiz manual assessment routes
router.post('/create', quizManualController.createQuizManualAssessment);
router.get('/:id', quizManualController.getQuizManualAssessment);
router.get('/creator/:email', quizManualController.getCreatorQuizManualAssessments);
router.get('/', quizManualController.getAllQuizManualAssessments);

module.exports = router;
