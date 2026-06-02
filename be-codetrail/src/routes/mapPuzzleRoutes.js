const express = require("express");
const router = express.Router();

const {
  getAllProgressPuzzle,
  getProgressPuzzleById,
  updateProgressPuzzleAttempt,
  saveProgressPuzzle,
} = require("../controllers/mapPuzzleController");

router.get("/", getAllProgressPuzzle);
router.get("/:id", getProgressPuzzleById);
router.patch("/:id_progress_puzzle/attempt", updateProgressPuzzleAttempt);
router.patch("/:id_progress_puzzle/save-progress", saveProgressPuzzle);

module.exports = router;
