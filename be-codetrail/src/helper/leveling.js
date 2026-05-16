const LEVEL_REQUIREMENTS = [
  0,    // level 1 mulai dari total exp 0
  100,  // level 2 butuh total exp 100
  260,  // level 3 butuh total exp 260
  500,  // level 4 butuh total exp 500
  850,  // level 5
  1300, // level 6
  1850, // level 7
  2500, // level 8
  3250, // level 9
  4100, // level 10
];

function getLevelInfo(totalExp = 0) {
  const exp = Math.max(0, Number(totalExp || 0));

  let level = 1;

  for (let i = 0; i < LEVEL_REQUIREMENTS.length; i += 1) {
    if (exp >= LEVEL_REQUIREMENTS[i]) {
      level = i + 1;
    }
  }

  const currentLevelMinExp = LEVEL_REQUIREMENTS[level - 1] || 0;
  const nextLevelMinExp =
    LEVEL_REQUIREMENTS[level] ||
    currentLevelMinExp + level * 1000;

  const currentLevelExp = exp - currentLevelMinExp;
  const requiredExp = nextLevelMinExp - currentLevelMinExp;
  const remainingExp = Math.max(0, requiredExp - currentLevelExp);

  return {
    level,
    total_exp: exp,
    current_level_exp: currentLevelExp,
    required_exp: requiredExp,
    remaining_exp: remainingExp,
    next_level: level + 1,
    progress_percent:
      requiredExp > 0
        ? Math.min(100, Math.round((currentLevelExp / requiredExp) * 100))
        : 100,
  };
}

async function syncUserLevel(client, id_user) {
  const userResult = await client.query(
    `
    SELECT id_user, COALESCE(exp, 0)::int AS exp
    FROM users
    WHERE id_user = $1
    LIMIT 1
    `,
    [id_user],
  );

  if (userResult.rows.length === 0) return null;

  const totalExp = userResult.rows[0].exp;
  const levelInfo = getLevelInfo(totalExp);

  const updateResult = await client.query(
    `
    UPDATE users
    SET level = $1
    WHERE id_user = $2
    RETURNING id_user, nama_user, email, level, exp, total_score, no_badge
    `,
    [levelInfo.level, id_user],
  );

  return {
    user: updateResult.rows[0],
    level_info: levelInfo,
  };
}

async function addUserExp(client, id_user, expToAdd = 0) {
  const rewardExp = Math.max(0, Number(expToAdd || 0));

  const result = await client.query(
    `
    UPDATE users
    SET exp = COALESCE(exp, 0) + $1
    WHERE id_user = $2
    RETURNING id_user, nama_user, email, level, exp, total_score, no_badge
    `,
    [rewardExp, id_user],
  );

  if (result.rows.length === 0) return null;

  return syncUserLevel(client, id_user);
}

module.exports = {
  LEVEL_REQUIREMENTS,
  getLevelInfo,
  syncUserLevel,
  addUserExp,
};