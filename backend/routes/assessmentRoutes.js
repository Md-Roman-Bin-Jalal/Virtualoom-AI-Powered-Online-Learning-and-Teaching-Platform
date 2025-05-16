const express = require('express');
const assessmentController = require('../controllers/assessmentController');

const router = express.Router();

// Quiz assessment routes
router.post('/create-quiz', assessmentController.createQuiz);
router.post('/quiz/submit', assessmentController.submitQuiz);
router.get('/quiz/:quizId', assessmentController.getQuiz);
router.get('/result/:resultId', assessmentController.getQuizResults);
router.get('/user/:email/results', assessmentController.getUserQuizzes);
router.get('/creator/:email/quizzes', assessmentController.getUserQuizzes);
router.get('/user/:email/assigned-quizzes', assessmentController.getAssignedQuizzes);

// AI quiz generation route
router.post('/generate-quiz', assessmentController.generateQuiz);

// Coding and writing assessment routes
router.post('/coding/create', assessmentController.createCodingAssessment);
router.post('/coding/generate', assessmentController.generateCodingAssessment);
router.post('/writing/create', assessmentController.createWritingAssessment);
router.post('/writing/generate', assessmentController.generateWritingAssessment);

// Combined submission and evaluation endpoints
router.post('/coding-writing/submit', assessmentController.submitCodingWritingAssessment);
router.post('/evaluate/:resultId', assessmentController.evaluateAssessment);

// Distribution routes
router.post('/distribute-quiz', assessmentController.sendQuiz);
router.post('/distribute-coding', assessmentController.sendCodingAssessment);
router.post('/distribute-writing', assessmentController.sendWritingAssessment);
router.get('/distributed-quizzes/:email', assessmentController.getAssignedQuizzes);
router.get('/user/:email/assigned-coding', assessmentController.getUserAssignedCodingAssessments);
router.get('/user/:email/assigned-writing', assessmentController.getUserAssignedWritingAssessments);
router.get('/user/:email/channels', assessmentController.getUserChannels);

module.exports = router;