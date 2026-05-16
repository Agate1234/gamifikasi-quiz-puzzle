const express = require("express");
const router = express.Router();

const { getAllProgressModul } = require("../controllers/mapModulController.js");

router.get("/", getAllProgressModul);

module.exports = router;