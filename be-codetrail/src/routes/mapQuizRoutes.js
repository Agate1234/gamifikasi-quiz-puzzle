const express = require("express");
const router = express.Router();

const {
  getAllProgressQuiz,
  getProgressQuizById,
} = require("../controllers/mapQuizController");

router.get("/", getAllProgressQuiz);
router.get("/:id", getProgressQuizById);

module.exports = router;