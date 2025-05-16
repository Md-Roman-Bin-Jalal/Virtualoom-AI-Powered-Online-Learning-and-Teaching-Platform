const express = require('express');
const codingManualController = require('../controllers/codingManualController');

const router = express.Router();

// Coding manual assessment routes
router.post('/create', codingManualController.createCodingManualAssessment);
router.get('/:id', codingManualController.getCodingManualAssessment);
router.get('/creator/:email', codingManualController.getCreatorCodingManualAssessments);

module.exports = router;
