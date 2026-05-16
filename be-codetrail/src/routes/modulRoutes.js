const express = require("express");
const router = express.Router();

const {
  getAllModul,
  getModulById,
  createModul,
  updateModul,
  deleteModul,
} = require("../controllers/modulController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, getAllModul);
router.get("/:id", getModulById);
router.post("/", authMiddleware, createModul);
router.put("/:id", authMiddleware, updateModul);
router.delete("/:id", deleteModul);

module.exports = router;