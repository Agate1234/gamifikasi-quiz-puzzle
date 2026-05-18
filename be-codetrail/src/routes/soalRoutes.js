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

router.get("/", getAllSoal);
router.get("/:id", getSoalById);
router.post("/", createSoal);
router.put("/:id", updateSoal);
router.delete("/:id", deleteSoal);

module.exports = router;