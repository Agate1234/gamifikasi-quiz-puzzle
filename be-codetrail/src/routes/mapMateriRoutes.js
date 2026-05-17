const express = require("express");
const router = express.Router();

const {
  getAllProgressMateri,
  getProgressMateriById,
  updateProgressMateriDone
} = require("../controllers/mapMateriController.js");

router.get("/", getAllProgressMateri);
router.get("/:id", getProgressMateriById);
router.patch("/:id_progress/done", updateProgressMateriDone);

module.exports = router;