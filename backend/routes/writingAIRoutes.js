const express = require('express');
const writingAIController = require('../controllers/writingAIController');

const router = express.Router();

// Writing AI assessment routes
router.post('/create', writingAIController.createWritingAIAssessment);
router.get('/:id', writingAIController.getWritingAIAssessment);
router.get('/creator/:email', writingAIController.getCreatorWritingAIAssessments);

module.exports = router;
