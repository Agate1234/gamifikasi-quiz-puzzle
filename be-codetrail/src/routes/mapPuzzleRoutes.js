const express = require("express");
const router = express.Router();

const {
  getAllProgressPuzzle,
  getProgressPuzzleById,
  updateProgressPuzzleAttempt
} = require("../controllers/mapPuzzleController");

router.get("/", getAllProgressPuzzle);
router.get("/:id", getProgressPuzzleById);
router.patch("/:id_progress_puzzle/attempt", updateProgressPuzzleAttempt);

module.exports = router;