const express = require("express");
const router = express.Router();

const {
  getAllPuzzle,
  getPuzzleById,
  createPuzzle,
  updatePuzzle,
  deletePuzzle
} = require("../controllers/puzzleController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", getAllPuzzle);
router.get("/:id", getPuzzleById);
router.post("/", createPuzzle);
router.put("/:id", updatePuzzle);
router.delete("/:id", deletePuzzle);

module.exports = router;