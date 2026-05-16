const express = require('express');
const router = express.Router();
const {
    getAllQuiz,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz
} = require('../controllers/quizController');
const authMiddleware = require("../middlewares/authMiddleware");

router.get('/', getAllQuiz);
router.get('/:id', getQuizById);
router.post('/', authMiddleware, createQuiz);
router.put('/:id', authMiddleware, updateQuiz);
router.delete('/:id', deleteQuiz);

module.exports = router;