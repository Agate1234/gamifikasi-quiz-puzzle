const pool = require("../config/db");

const ACHIEVEMENTS = [
  {
    id: 1,
    code: "FIRST_STEP",
    title: "First Step",
    desc: "Menyelesaikan aktivitas pertama di roadmap.",
  },
  {
    id: 2,
    code: "QUIZ_STARTER",
    title: "Quiz Starter",
    desc: "Menyelesaikan quiz pertama.",
  },
  {
    id: 3,
    code: "PUZZLE_SOLVER",
    title: "Puzzle Solver",
    desc: "Menyelesaikan puzzle pertama.",
  },
  {
    id: 4,
    code: "MODULE_FINISHER",
    title: "Module Finisher",
    desc: "Menyelesaikan seluruh aktivitas dalam satu modul.",
  },
  {
    id: 5,
    code: "PERFECT_QUIZ",
    title: "Perfect Quiz",
    desc: "Mendapatkan score sempurna pada quiz.",
  },
  {
    id: 6,
    code: "CONSISTENT_LEARNER",
    title: "Consistent Learner",
    desc: "Menyelesaikan minimal 5 aktivitas pembelajaran.",
  },
];

const normalizeBadgeIds = (value) => {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => parseInt(item, 10))
        .filter((item) => !Number.isNaN(item)),
    ),
  ].sort((a, b) => a - b);
};

const getUserBadgeIds = async (client, id_user) => {
  const result = await client.query(
    `
    SELECT COALESCE(no_badge, '{}'::integer[]) AS no_badge
    FROM users
    WHERE id_user = $1
    LIMIT 1
    `,
    [id_user],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return normalizeBadgeIds(result.rows[0].no_badge);
};

const awardBadgeToUser = async (client, id_user, badge_id) => {
  const badgeId = parseInt(badge_id, 10);

  if (Number.isNaN(badgeId)) {
    return null;
  }

  const badgeExists = ACHIEVEMENTS.some((item) => item.id === badgeId);

  if (!badgeExists) {
    return null;
  }

  const result = await client.query(
    `
    UPDATE users
    SET
      no_badge = CASE
        WHEN $2 = ANY(COALESCE(no_badge, '{}'::integer[]))
          THEN COALESCE(no_badge, '{}'::integer[])
        ELSE array_append(COALESCE(no_badge, '{}'::integer[]), $2)
      END
    WHERE id_user = $1
    RETURNING id_user, nama_user, email, no_badge, level, exp, total_score
    `,
    [id_user, badgeId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

const evaluateAchievementRules = async (client, id_user) => {
  const result = await client.query(
    `
    WITH stats AS (
      SELECT
        $1::int AS id_user,

        (
          SELECT COUNT(*)::int
          FROM progress_materi
          WHERE id_user = $1
            AND status IN ('done', 'selesai')
        ) AS done_materi,

        (
          SELECT COUNT(*)::int
          FROM progress_quiz
          WHERE id_user = $1
            AND status = 'done'
        ) AS done_quiz,

        (
          SELECT COUNT(*)::int
          FROM progress_puzzle
          WHERE id_user = $1
            AND status = 'done'
        ) AS done_puzzle,

        (
          SELECT COUNT(*)::int
          FROM progress_quiz
          WHERE id_user = $1
            AND status = 'done'
            AND COALESCE(score, 0) >= 100
        ) AS perfect_quiz,

        (
          SELECT COUNT(*)::int
          FROM modul m
          WHERE
            NOT EXISTS (
              SELECT 1
              FROM materi mt
              JOIN progress_materi pm ON pm.id_materi = mt.id_materi
              WHERE mt.id_modul = m.id_modul
                AND pm.id_user = $1
                AND COALESCE(pm.status, 'not done') NOT IN ('done', 'selesai')
            )
            AND NOT EXISTS (
              SELECT 1
              FROM quiz q
              JOIN progress_quiz pq ON pq.id_quiz = q.id_quiz
              WHERE q.id_modul = m.id_modul
                AND pq.id_user = $1
                AND COALESCE(pq.status, 'not done') <> 'done'
            )
            AND NOT EXISTS (
              SELECT 1
              FROM puzzle p
              JOIN progress_puzzle pp ON pp.id_puzzle = p.id_puzzle
              WHERE p.id_modul = m.id_modul
                AND pp.id_user = $1
                AND COALESCE(pp.status, 'not done') <> 'done'
            )
            AND (
              EXISTS (SELECT 1 FROM materi mt WHERE mt.id_modul = m.id_modul)
              OR EXISTS (SELECT 1 FROM quiz q WHERE q.id_modul = m.id_modul)
              OR EXISTS (SELECT 1 FROM puzzle p WHERE p.id_modul = m.id_modul)
            )
        ) AS done_module
    )
    SELECT *
    FROM stats
    `,
    [id_user],
  );

  const stats = result.rows[0];

  const totalDoneActivities =
    Number(stats.done_materi || 0) +
    Number(stats.done_quiz || 0) +
    Number(stats.done_puzzle || 0);

  const earnedBadgeIds = [];

  if (totalDoneActivities >= 1) earnedBadgeIds.push(1);
  if (Number(stats.done_quiz || 0) >= 1) earnedBadgeIds.push(2);
  if (Number(stats.done_puzzle || 0) >= 1) earnedBadgeIds.push(3);
  if (Number(stats.done_module || 0) >= 1) earnedBadgeIds.push(4);
  if (Number(stats.perfect_quiz || 0) >= 1) earnedBadgeIds.push(5);
  if (totalDoneActivities >= 5) earnedBadgeIds.push(6);

  return {
    stats: {
      ...stats,
      total_done_activities: totalDoneActivities,
    },
    earnedBadgeIds,
  };
};

const evaluateAndAwardAchievements = async (client, id_user) => {
  const currentBadgeIds = await getUserBadgeIds(client, id_user);

  if (currentBadgeIds === null) {
    return {
      success: false,
      message: "User tidak ditemukan",
      current_badges: [],
      new_badges: [],
    };
  }

  const evaluation = await evaluateAchievementRules(client, id_user);

  const newBadgeIds = evaluation.earnedBadgeIds.filter(
    (badgeId) => !currentBadgeIds.includes(badgeId),
  );

  for (const badgeId of newBadgeIds) {
    await awardBadgeToUser(client, id_user, badgeId);
  }

  const finalBadgeIds = await getUserBadgeIds(client, id_user);

  return {
    success: true,
    stats: evaluation.stats,
    current_badges: finalBadgeIds || [],
    new_badges: newBadgeIds,
  };
};

const getUserAchievements = async (req, res) => {
  try {
    const idUser = req.params.id_user || req.query.id_user;

    if (!idUser) {
      return res.status(400).json({
        success: false,
        message: "id_user wajib diisi",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id_user,
        nama_user,
        email,
        COALESCE(no_badge, '{}'::integer[]) AS no_badge,
        level,
        exp,
        total_score
      FROM users
      WHERE id_user = $1
      LIMIT 1
      `,
      [idUser],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        user,
        no_badge: normalizeBadgeIds(user.no_badge),
        achievements: ACHIEVEMENTS,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const claimAchievement = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_user, badge_id } = req.body;

    if (!id_user || !badge_id) {
      return res.status(400).json({
        success: false,
        message: "id_user dan badge_id wajib diisi",
      });
    }

    await client.query("BEGIN");

    const updatedUser = await awardBadgeToUser(client, id_user, badge_id);

    if (!updatedUser) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "User atau badge tidak ditemukan",
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Badge berhasil ditambahkan",
      data: {
        user: updatedUser,
        no_badge: normalizeBadgeIds(updatedUser.no_badge),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

const syncAchievements = async (req, res) => {
  const client = await pool.connect();

  try {
    const idUser = req.params.id_user || req.body.id_user || req.query.id_user;

    if (!idUser) {
      return res.status(400).json({
        success: false,
        message: "id_user wajib diisi",
      });
    }

    await client.query("BEGIN");

    const result = await evaluateAndAwardAchievements(client, idUser);

    if (!result.success) {
      await client.query("ROLLBACK");

      return res.status(404).json(result);
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        result.new_badges.length > 0
          ? "Achievement baru berhasil didapatkan"
          : "Achievement sudah sinkron",
      data: result,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getUserAchievements,
  claimAchievement,
  syncAchievements,

  // helper ini bisa dipakai controller lain setelah quiz/puzzle selesai
  evaluateAndAwardAchievements,
};