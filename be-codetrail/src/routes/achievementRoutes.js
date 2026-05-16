const express = require("express");
const router = express.Router();

const {
  getUserAchievements,
  claimAchievement,
  syncAchievements,
} = require("../controllers/achievementController");

router.get("/:id_user", getUserAchievements);
router.post("/claim", claimAchievement);
router.post("/sync/:id_user", syncAchievements);

module.exports = router;