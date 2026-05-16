// routes/levelRoutes.js
const express = require("express");
const router = express.Router();

const { getUserLevel } = require("../controllers/levelController");

router.get("/:id_user", getUserLevel);

module.exports = router;