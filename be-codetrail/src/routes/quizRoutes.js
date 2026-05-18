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
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);

module.exports = router;