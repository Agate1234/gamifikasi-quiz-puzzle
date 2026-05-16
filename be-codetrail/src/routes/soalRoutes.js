const express = require("express");
const router = express.Router();
const {
  createSoal,
  updateSoal,
  getAllSoal,
  getSoalById,
  deleteSoal,
} = require("../controllers/soalController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, getAllSoal);
router.get("/:id", authMiddleware, getSoalById);
router.post("/", authMiddleware, createSoal);
router.put("/:id", authMiddleware, updateSoal);
router.delete("/:id", authMiddleware, deleteSoal);

module.exports = router;