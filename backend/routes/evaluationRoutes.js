const express = require('express');
const evaluationController = require('../controllers/evaluationController');

const router = express.Router();

// Get user's evaluation assignments
router.get('/user/:email/assignments', evaluationController.getUserAssignments);
router.get('/user/:email/assignments/:category', evaluationController.getUserAssignments);

// Get specific assignment details
router.get('/assignment/:assignmentId', evaluationController.getAssignmentDetails);

// Submit an assignment
router.post('/assignment/:assignmentId/submit', evaluationController.submitAssignment);

// Get results for a specific assignment
router.get('/assignment/:assignmentId/results', evaluationController.getAssignmentResults);

// Get individual result by ID
router.get('/result/:resultId', evaluationController.getResult);

// Update assignment status (hidden)
router.patch('/assignment/:assignmentId', evaluationController.updateAssignmentStatus);

// Create evaluation assignments for channel members
router.post('/create-assignments', evaluationController.createEvaluationAssignments);

module.exports = router;
