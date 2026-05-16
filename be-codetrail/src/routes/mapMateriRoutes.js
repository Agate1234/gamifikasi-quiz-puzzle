const express = require("express");
const router = express.Router();

const {
  getAllProgressMateri,
  getProgressMateriById,
} = require("../controllers/mapMateriController.js");

router.get("/", getAllProgressMateri);
router.get("/:id", getProgressMateriById);

module.exports = router;