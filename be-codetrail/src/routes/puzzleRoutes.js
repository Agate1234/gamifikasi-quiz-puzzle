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
router.post("/", authMiddleware, createPuzzle);
router.put("/:id", authMiddleware, updatePuzzle);
router.delete("/:id", authMiddleware, deletePuzzle);

module.exports = router;