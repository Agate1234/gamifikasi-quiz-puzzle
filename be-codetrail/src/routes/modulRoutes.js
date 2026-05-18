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

router.get("/", getAllModul);
router.get("/:id", getModulById);
router.post("/", createModul);
router.put("/:id", updateModul);
router.delete("/:id", deleteModul);

module.exports = router;