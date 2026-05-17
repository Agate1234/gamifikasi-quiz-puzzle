const express = require("express");
const router = express.Router();

const {
  getNextSoalMahasiswa,
  submitJawabanMahasiswa,
  enhancedVisionPreview,
  deductionReveal,
  bodyLanguageAnalysis,
  prisonerEscapeMethodPreview
} = require("../controllers/soalMahasiswaController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/:id_quiz/next", authMiddleware, getNextSoalMahasiswa);
router.post("/:id_quiz/submit", authMiddleware, submitJawabanMahasiswa);
router.post("/:id_quiz/enhanced-vision", authMiddleware, enhancedVisionPreview);
router.post("/:id_quiz/deduction", authMiddleware, deductionReveal);
router.post("/:id_quiz/body-language-analysis", authMiddleware, bodyLanguageAnalysis);
router.post("/:id_quiz/prisoner-escape-method", authMiddleware, prisonerEscapeMethodPreview);

module.exports = router;