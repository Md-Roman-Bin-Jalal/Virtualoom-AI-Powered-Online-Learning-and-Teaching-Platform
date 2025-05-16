const express = require('express');
const writingManualController = require('../controllers/writingManualController');

const router = express.Router();

// Writing manual assessment routes
router.post('/create', writingManualController.createWritingManualAssessment);
router.get('/:id', writingManualController.getWritingManualAssessment);
router.get('/creator/:email', writingManualController.getCreatorWritingManualAssessments);

module.exports = router;
