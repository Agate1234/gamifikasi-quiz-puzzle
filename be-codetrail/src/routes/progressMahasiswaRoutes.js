const express = require("express");
const router = express.Router();

const {
  getAllProgressMahasiswa,
  getDetailProgressMahasiswa,
} = require("../controllers/progressMahasiswaController");

router.get("/", getAllProgressMahasiswa);
router.get("/:id_user", getDetailProgressMahasiswa);

module.exports = router;