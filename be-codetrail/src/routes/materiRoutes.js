const express = require("express");
const router = express.Router();

const {
  getAllMateri,
  getMateriById,
  createMateri,
  updateMateri,
  deleteMateri,
  viewMateriFile,
} = require("../controllers/materiController");

const authMiddleware = require("../middlewares/authMiddleware");
const uploadMateri = require("../middlewares/uploadMateri");

router.get("/", getAllMateri);
router.get("/:id", getMateriById);
router.get("/:id/file", viewMateriFile);

router.post("/", uploadMateri.single("file_materi"), createMateri);
router.put("/:id", uploadMateri.single("file_materi"), updateMateri);
router.delete("/:id", deleteMateri);

module.exports = router;