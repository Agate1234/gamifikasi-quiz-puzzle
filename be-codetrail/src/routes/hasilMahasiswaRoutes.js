const express = require("express");
const router = express.Router();

const {
  getAllHasilMahasiswa,
  getDetailHasilMahasiswa,
} = require("../controllers/hasilMahasiswaController");

router.get("/", getAllHasilMahasiswa);
router.get("/:id_user", getDetailHasilMahasiswa);

module.exports = router;