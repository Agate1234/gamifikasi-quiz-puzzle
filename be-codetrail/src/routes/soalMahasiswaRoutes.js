const express = require("express");
const router = express.Router();

const {
  getNextSoalMahasiswa,
  submitJawabanMahasiswa,
} = require("../controllers/soalMahasiswaController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/:id_quiz/next", authMiddleware, getNextSoalMahasiswa);
router.post("/:id_quiz/submit", authMiddleware, submitJawabanMahasiswa);

module.exports = router;