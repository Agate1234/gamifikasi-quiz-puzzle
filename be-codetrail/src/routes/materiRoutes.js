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

router.post("/", authMiddleware, uploadMateri.single("file_materi"), createMateri);
router.put("/:id", authMiddleware, uploadMateri.single("file_materi"), updateMateri);
router.delete("/:id", authMiddleware, deleteMateri);

module.exports = router;