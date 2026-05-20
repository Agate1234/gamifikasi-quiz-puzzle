const pool = require("../config/db");
const { evaluateAndAwardAchievements } = require("./achievementController");
const { addUserExp } = require("../helper/leveling");

const MAX_SOAL_QUIZ = 20;
const MAX_HEALTH_SCORE = 100;
const DAMAGE_PER_WRONG = 5;

const normalizeSisaWaktuDetik = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.min(parsed, 24 * 60 * 60));
};

const normalizeIds = (value) => {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value.map((item) => parseInt(item, 10)).filter((item) => !isNaN(item)),
    ),
  ].sort((a, b) => a - b);
};

const shuffleArray = (arr = []) => {
  const result = [...arr];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

const getActiveEffects = (skillData) => {
  if (!skillData || typeof skillData !== "object") return [];

  return Array.isArray(skillData.active_effects)
    ? skillData.active_effects
    : [];
};

const ensureSoalDoneSkillColumns = async (client) => {
  await client.query(`
    ALTER TABLE soal_done
    ADD COLUMN IF NOT EXISTS skill_effect_used VARCHAR(100),
    ADD COLUMN IF NOT EXISTS exp_penalty INTEGER DEFAULT 0
  `);
};

const getDifficultyOrder = (targetDifficulty) => {
  if (targetDifficulty === "hard") return ["hard", "medium", "easy"];
  if (targetDifficulty === "medium") return ["medium", "easy", "hard"];
  return ["easy", "medium", "hard"];
};

const getQuizRewardStats = async (
  client,
  id_quiz,
  totalWrong = 0,
  totalExpPenalty = 0,
  deductionUsed = false,
) => {
  const quizResult = await client.query(
    `
    SELECT COALESCE(exp_quiz, 0)::int AS exp_quiz
    FROM quiz
    WHERE id_quiz = $1
    LIMIT 1
    `,
    [id_quiz],
  );

  const expQuiz = quizResult.rows[0]?.exp_quiz || 0;
  const minExp = Math.round(expQuiz * 0.2);
  const expPerWrongRaw =
    MAX_SOAL_QUIZ > 0 ? (expQuiz * 0.8) / MAX_SOAL_QUIZ : 0;
  const expPerWrong = Math.round(expPerWrongRaw);
  const wrongPenaltyTotal = Math.round(totalWrong * expPerWrongRaw);
  const extraPenalty = Math.max(0, Number(totalExpPenalty || 0));

  let expEarned = Math.max(minExp, expQuiz - wrongPenaltyTotal - extraPenalty);

  if (deductionUsed) {
    const deductionCap = Math.round(expQuiz * 0.7);
    expEarned = Math.min(expEarned, deductionCap);
  }

  return {
    expQuiz,
    expPerWrong,
    expEarned,
    minExp,
    totalExpPenalty: extraPenalty,
    deductionUsed,
  };
};

const getQuizStats = async (client, id_user, id_quiz) => {
  await ensureSoalDoneSkillColumns(client);

  const totalSoalResult = await client.query(
    `
    SELECT COUNT(*)::int AS total_available
    FROM soal_quiz
    WHERE id_quiz = $1
    `,
    [id_quiz],
  );

  const answeredResult = await client.query(
    `
    SELECT
      COUNT(*)::int AS total_answered,
      COUNT(*) FILTER (WHERE is_right = true)::int AS total_correct,
      COALESCE(SUM(COALESCE(exp_penalty, 0)), 0)::int AS total_exp_penalty,
      COALESCE(BOOL_OR(skill_effect_used IN ('deduction', 'danger_intuition')), false) AS deduction_used
    FROM soal_done
    WHERE id_user = $1
      AND id_quiz = $2
    `,
    [id_user, id_quiz],
  );

  const progressScoreResult = await client.query(
    `
    SELECT score
    FROM progress_quiz
    WHERE id_user = $1
      AND id_quiz = $2
    LIMIT 1
    `,
    [id_user, id_quiz],
  );

  const totalAvailable = totalSoalResult.rows[0]?.total_available || 0;
  const totalTarget = Math.min(totalAvailable, MAX_SOAL_QUIZ);
  const totalAnswered = answeredResult.rows[0]?.total_answered || 0;
  const totalCorrect = answeredResult.rows[0]?.total_correct || 0;
  const totalWrong = Math.max(0, totalAnswered - totalCorrect);
  const totalExpPenalty = answeredResult.rows[0]?.total_exp_penalty || 0;
  const deductionUsed = answeredResult.rows[0]?.deduction_used === true;

  const scoreByWrongCount = Math.max(
    0,
    MAX_HEALTH_SCORE - totalWrong * DAMAGE_PER_WRONG,
  );

  const rawProgressScore = progressScoreResult.rows[0]?.score;
  const hasSavedScore =
    totalAnswered > 0 &&
    rawProgressScore !== null &&
    rawProgressScore !== undefined &&
    !Number.isNaN(Number(rawProgressScore));

  const score = hasSavedScore
    ? Math.max(0, Math.min(MAX_HEALTH_SCORE, Number(rawProgressScore)))
    : scoreByWrongCount;

  const rewardStats = await getQuizRewardStats(
    client,
    id_quiz,
    totalWrong,
    totalExpPenalty,
    deductionUsed,
  );

  return {
    totalAvailable,
    totalTarget,
    totalAnswered,
    totalCorrect,
    totalWrong,
    score,
    expQuiz: rewardStats.expQuiz,
    expPerWrong: rewardStats.expPerWrong,
    expEarned: rewardStats.expEarned,
    minExp: rewardStats.minExp,
    totalExpPenalty: rewardStats.totalExpPenalty,
    deductionUsed: rewardStats.deductionUsed,
  };
};

const shouldTriggerLearningAdaptation = async (client, id_user, id_quiz) => {
  const historyResult = await client.query(
    `
    SELECT is_right
    FROM soal_done
    WHERE id_user = $1
      AND id_quiz = $2
    ORDER BY created_at ASC, id_soal_done ASC
    `,
    [id_user, id_quiz],
  );

  const history = historyResult.rows;
  const lastAnswer = history[history.length - 1] || null;

  if (!lastAnswer || lastAnswer.is_right !== false) {
    return false;
  }

  const alreadyTriggered = history.some((item, index) => {
    if (index === 0) return false;
    return history[index - 1]?.is_right === false && item.is_right === true;
  });

  return !alreadyTriggered;
};

const shouldTriggerPerfectHunt = async (client, id_user, id_quiz) => {
  const historyResult = await client.query(
    `
    SELECT is_right
    FROM soal_done
    WHERE id_user = $1
      AND id_quiz = $2
    ORDER BY created_at ASC, id_soal_done ASC
    `,
    [id_user, id_quiz],
  );

  const history = historyResult.rows;

  if (history.length < 2) {
    return false;
  }

  const lastTwo = history.slice(-2);

  if (!lastTwo.every((item) => item.is_right === true)) {
    return false;
  }

  const alreadyTriggered = history.some((item, index) => {
    if (index < 2) return false;

    return (
      history[index - 2]?.is_right === true &&
      history[index - 1]?.is_right === true &&
      item.is_right === true
    );
  });

  return !alreadyTriggered;
};

const getAdaptiveDifficulty = async (client, id_user, id_quiz) => {
  const historyResult = await client.query(
    `
    SELECT
      sd.is_right,
      sq.difficulty
    FROM soal_done sd
    JOIN soal_quiz sq ON sq.id_soal = sd.id_soal
    WHERE sd.id_user = $1
      AND sd.id_quiz = $2
    ORDER BY sd.created_at DESC, sd.id_soal_done DESC
    `,
    [id_user, id_quiz],
  );

  const history = historyResult.rows;

  if (history.length === 0) return "easy";

  const lastDifficulty = history[0].difficulty;
  const lastResult = history[0].is_right;

  let streakOnSameDifficulty = 0;

  for (const item of history) {
    if (item.difficulty === lastDifficulty && item.is_right === lastResult) {
      streakOnSameDifficulty += 1;
    } else {
      break;
    }
  }

  let nextDifficulty = lastDifficulty;

  if (lastResult === true && streakOnSameDifficulty >= 2) {
    if (lastDifficulty === "easy") nextDifficulty = "medium";
    else if (lastDifficulty === "medium") nextDifficulty = "hard";
  }

  if (lastResult === false && streakOnSameDifficulty >= 2) {
    if (lastDifficulty === "hard") nextDifficulty = "medium";
    else if (lastDifficulty === "medium") nextDifficulty = "easy";
  }

  return nextDifficulty;
};

const unlockNextQuizForUser = async (client, id_user, id_quiz) => {
  const currentProgressResult = await client.query(
    `
    SELECT id_progress, id_quiz
    FROM progress_quiz
    WHERE id_user = $1
      AND id_quiz = $2
    LIMIT 1
    `,
    [id_user, id_quiz],
  );

  if (currentProgressResult.rows.length === 0) {
    return {
      nextQuizId: null,
      nextQuizUnlocked: false,
    };
  }

  const currentProgress = currentProgressResult.rows[0];

  let nextProgressResult = await client.query(
    `
    SELECT id_progress, id_quiz, status, is_unlock
    FROM progress_quiz
    WHERE id_user = $1
      AND id_progress > $2
    ORDER BY id_progress ASC
    LIMIT 1
    `,
    [id_user, currentProgress.id_progress],
  );

  if (nextProgressResult.rows.length === 0) {
    nextProgressResult = await client.query(
      `
      SELECT id_progress, id_quiz, status, is_unlock
      FROM progress_quiz
      WHERE id_user = $1
        AND id_quiz > $2
      ORDER BY id_quiz ASC
      LIMIT 1
      `,
      [id_user, currentProgress.id_quiz],
    );
  }

  if (nextProgressResult.rows.length === 0) {
    return {
      nextQuizId: null,
      nextQuizUnlocked: false,
    };
  }

  const nextProgress = nextProgressResult.rows[0];

  await client.query(
    `
    UPDATE progress_quiz
    SET
      is_unlock = true,
      status = CASE
        WHEN status = 'done' THEN 'done'
        ELSE 'not done'
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id_progress = $1
    `,
    [nextProgress.id_progress],
  );

  return {
    nextQuizId: nextProgress.id_quiz,
    nextQuizUnlocked: true,
  };
};

const getQuizReview = async (client, id_user, id_quiz) => {
  const result = await client.query(
    `
    SELECT
      sd.id_soal_done,
      sd.id_soal,
      sd.is_right,
      COALESCE(sd.jawaban_ids, '[]'::jsonb) AS jawaban_ids,
      sq.soal,
      sq.tipe_soal,
      sq.difficulty,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id_jawaban', j.id_jawaban,
              'jawaban_soal', j.jawaban_soal,
              'is_true', j.is_true
            )
            ORDER BY j.id_jawaban ASC
          )
          FROM jawaban j
          WHERE j.id_soal = sd.id_soal
        ),
        '[]'::json
      ) AS pilihan,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id_jawaban', j.id_jawaban,
              'jawaban_soal', j.jawaban_soal
            )
            ORDER BY j.id_jawaban ASC
          )
          FROM jawaban j
          WHERE j.id_soal = sd.id_soal
            AND j.id_jawaban IN (
              SELECT jsonb_array_elements_text(
                COALESCE(sd.jawaban_ids, '[]'::jsonb)
              )::int
            )
        ),
        '[]'::json
      ) AS jawaban_user,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id_jawaban', j.id_jawaban,
              'jawaban_soal', j.jawaban_soal
            )
            ORDER BY j.id_jawaban ASC
          )
          FROM jawaban j
          WHERE j.id_soal = sd.id_soal
            AND j.is_true = true
        ),
        '[]'::json
      ) AS jawaban_benar

    FROM soal_done sd
    JOIN soal_quiz sq ON sq.id_soal = sd.id_soal
    WHERE sd.id_user = $1
      AND sd.id_quiz = $2
    ORDER BY sd.created_at ASC, sd.id_soal_done ASC
    `,
    [id_user, id_quiz],
  );

  return result.rows.map((item) => ({
    id_soal: item.id_soal,
    soal: item.soal,
    tipe_soal: item.tipe_soal,
    difficulty: item.difficulty,
    is_correct: item.is_right,
    jawaban_ids: Array.isArray(item.jawaban_ids) ? item.jawaban_ids : [],
    pilihan: item.pilihan || [],
    jawaban_user: item.jawaban_user || [],
    jawaban_benar: item.jawaban_benar || [],
  }));
};

const finalizeQuizByTimeout = async (
  client,
  id_user,
  id_quiz,
  sisa_waktu_detik = 0,
) => {
  const stats = await getQuizStats(client, id_user, id_quiz);

  const totalTarget = Math.max(
    1,
    Number(stats.totalTarget || MAX_SOAL_QUIZ),
  );
  const totalAnswered = Math.min(
    totalTarget,
    Math.max(0, Number(stats.totalAnswered || 0)),
  );
  const totalCorrect = Math.min(
    totalTarget,
    Math.max(0, Number(stats.totalCorrect || 0)),
  );
  const unansweredCount = Math.max(0, totalTarget - totalAnswered);
  const unansweredPenalty = Math.round(
    (unansweredCount / totalTarget) * MAX_HEALTH_SCORE,
  );

  const currentHealth = Math.max(
    0,
    Math.min(MAX_HEALTH_SCORE, Number(stats.score || 0)),
  );
  const finalScore = Math.max(
    0,
    Math.min(MAX_HEALTH_SCORE, currentHealth - unansweredPenalty),
  );

  const totalWrongIncludingTimeout = Math.max(
    0,
    Number(stats.totalWrong || 0) + unansweredCount,
  );

  const rewardStats = await getQuizRewardStats(
    client,
    id_quiz,
    totalWrongIncludingTimeout,
    stats.totalExpPenalty,
    stats.deductionUsed,
  );

  const progressBeforeResult = await client.query(
    `
    SELECT status
    FROM progress_quiz
    WHERE id_user = $1
      AND id_quiz = $2
    LIMIT 1
    `,
    [id_user, id_quiz],
  );

  const statusBefore = progressBeforeResult.rows[0]?.status || null;
  const normalizedSisaWaktu = normalizeSisaWaktuDetik(sisa_waktu_detik) ?? 0;
    await client.query(
    `
    UPDATE progress_quiz
    SET
      status = 'done',
      score = $1,
      waktu_penyelesaian = COALESCE(waktu_penyelesaian, $2),
      updated_at = CURRENT_TIMESTAMP
    WHERE id_user = $3
      AND id_quiz = $4
    `,
    [finalScore, normalizedSisaWaktu, id_user, id_quiz],
  );

  let unlockInfo = {
    nextQuizId: null,
    nextQuizUnlocked: false,
  };

  if (statusBefore !== "done") {
    if (rewardStats.expEarned > 0) {
      await addUserExp(client, id_user, rewardStats.expEarned);
      await evaluateAndAwardAchievements(client, id_user);
    }

    unlockInfo = await unlockNextQuizForUser(client, id_user, id_quiz);
  }

  const progressResult = await client.query(
    `
    SELECT waktu_penyelesaian
    FROM progress_quiz
    WHERE id_user = $1
      AND id_quiz = $2
    LIMIT 1
    `,
    [id_user, id_quiz],
  );

  const review = await getQuizReview(client, id_user, id_quiz);

  return {
    finished: true,
    timeout: true,
    totalAvailable: stats.totalAvailable,
    totalTarget,
    totalAnswered,
    totalCorrect,
    totalWrong: totalWrongIncludingTimeout,
    unansweredCount,
    unansweredPenalty,
    scoreBeforeTimeout: currentHealth,
    score: finalScore,
    expQuiz: rewardStats.expQuiz,
    expPerWrong: rewardStats.expPerWrong,
    expEarned: rewardStats.expEarned,
    minExp: rewardStats.minExp,
    totalExpPenalty: rewardStats.totalExpPenalty,
    deductionUsed: rewardStats.deductionUsed,
    nextQuizId: unlockInfo.nextQuizId,
    nextQuizUnlocked: unlockInfo.nextQuizUnlocked,
    waktu_penyelesaian: progressResult.rows[0]?.waktu_penyelesaian || null,
    review,
  };
};

const finalizeQuizIfNeeded = async (
  client,
  id_user,
  id_quiz,
  sisa_waktu_detik = null,
) => {
  const stats = await getQuizStats(client, id_user, id_quiz);

  const shouldFinish =
    (stats.totalTarget > 0 && stats.totalAnswered >= stats.totalTarget) ||
    stats.score <= 0;

  if (shouldFinish) {
    const progressBeforeResult = await client.query(
      `
      SELECT status
      FROM progress_quiz
      WHERE id_user = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [id_user, id_quiz],
    );

    const statusBefore = progressBeforeResult.rows[0]?.status || null;
    const normalizedSisaWaktu = normalizeSisaWaktuDetik(sisa_waktu_detik);

    await client.query(
      `
      UPDATE progress_quiz
      SET
        status = 'done',
        score = $1,
        waktu_penyelesaian = COALESCE(waktu_penyelesaian, $2),
        updated_at = CURRENT_TIMESTAMP
      WHERE id_user = $3
        AND id_quiz = $4
      `,
      [stats.score, normalizedSisaWaktu, id_user, id_quiz],
    );

    let unlockInfo = {
      nextQuizId: null,
      nextQuizUnlocked: false,
    };

    if (statusBefore !== "done") {
      if (stats.expEarned > 0) {
        await addUserExp(client, id_user, stats.expEarned);
        await evaluateAndAwardAchievements(client, id_user);
      }

      unlockInfo = await unlockNextQuizForUser(client, id_user, id_quiz);
    }

    const progressResult = await client.query(
      `
      SELECT waktu_penyelesaian
      FROM progress_quiz
      WHERE id_user = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [id_user, id_quiz],
    );

    const review = await getQuizReview(client, id_user, id_quiz);

    return {
      finished: true,
      ...stats,
      nextQuizId: unlockInfo.nextQuizId,
      nextQuizUnlocked: unlockInfo.nextQuizUnlocked,
      waktu_penyelesaian: progressResult.rows[0]?.waktu_penyelesaian || null,
      review,
    };
  }

  await client.query(
    `
    UPDATE progress_quiz
    SET
      status = 'not done',
      score = $1,
      waktu_penyelesaian = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id_user = $2
      AND id_quiz = $3
    `,
    [stats.score, id_user, id_quiz],
  );

  return {
    finished: false,
    ...stats,
    nextQuizId: null,
    nextQuizUnlocked: false,
    waktu_penyelesaian: null,
    review: [],
  };
};

const getNextSoalMahasiswa = async (req, res) => {
  try {
    const { id_quiz } = req.params;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    const idUser = req.user.id_user;

    const progressResult = await pool.query(
      `
      SELECT *
      FROM progress_quiz
      WHERE id_user = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [idUser, id_quiz],
    );

    if (progressResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Progress quiz tidak ditemukan",
      });
    }

    const progress = progressResult.rows[0];

    if (progress.is_unlock !== true || progress.status === "locked") {
      return res.status(403).json({
        success: false,
        message: "Quiz masih terkunci",
      });
    }

    if (progress.status === "done") {
      const doneStats = await getQuizStats(pool, idUser, id_quiz);
      const review = await getQuizReview(pool, idUser, id_quiz);

      return res.status(200).json({
        success: true,
        message: "Quiz sudah selesai",
        data: {
          finished: true,
          score: progress.score || 0,
          exp_earned: doneStats.expEarned || 0,
          total_soal: doneStats.totalTarget || 0,
          total_benar: doneStats.totalCorrect || 0,
          waktu_penyelesaian: progress.waktu_penyelesaian || null,
          review,
        },
      });
    }

    const stats = await getQuizStats(pool, idUser, id_quiz);

    if (stats.totalAvailable === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal untuk quiz ini belum tersedia",
      });
    }

    if (stats.totalAnswered >= stats.totalTarget || stats.score <= 0) {
      const summary = await finalizeQuizIfNeeded(pool, idUser, id_quiz);

      return res.status(200).json({
        success: true,
        message: "Quiz selesai",
        data: {
          finished: true,
          score: summary.score,
          exp_earned: summary.expEarned,
          total_soal: summary.totalTarget,
          total_benar: summary.totalCorrect,
          next_quiz_id: summary.nextQuizId,
          next_quiz_unlocked: summary.nextQuizUnlocked,
          waktu_penyelesaian: summary.waktu_penyelesaian,
          review: summary.review || [],
        },
      });
    }

    const targetDifficulty = await getAdaptiveDifficulty(pool, idUser, id_quiz);
    const difficultyOrder = getDifficultyOrder(targetDifficulty);

    const nextSoalResult = await pool.query(
      `
      SELECT
        sq.id_soal AS id,
        sq.soal AS question,
        sq.tipe_soal AS type,
        sq.difficulty,
        sq.id_quiz,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id_jawaban', x.id_jawaban,
                'jawaban_soal', x.jawaban_soal
              )
            )
            FROM (
              SELECT
                j.id_jawaban,
                j.jawaban_soal
              FROM jawaban j
              WHERE j.id_soal = sq.id_soal
              ORDER BY RANDOM()
            ) x
          ),
          '[]'::json
        ) AS jawaban
      FROM soal_quiz sq
      WHERE sq.id_quiz = $2
        AND sq.id_soal NOT IN (
          SELECT sd.id_soal
          FROM soal_done sd
          WHERE sd.id_user = $1
            AND sd.id_quiz = $2
        )
      ORDER BY
        CASE
          WHEN sq.difficulty = $3 THEN 1
          WHEN sq.difficulty = $4 THEN 2
          WHEN sq.difficulty = $5 THEN 3
          ELSE 4
        END,
        RANDOM()
      LIMIT 1
      `,
      [
        idUser,
        id_quiz,
        difficultyOrder[0],
        difficultyOrder[1],
        difficultyOrder[2],
      ],
    );

    if (nextSoalResult.rows.length === 0) {
      const summary = await finalizeQuizIfNeeded(pool, idUser, id_quiz);

      return res.status(200).json({
        success: true,
        message: "Semua soal sudah selesai dikerjakan",
        data: {
          finished: true,
          score: summary.score,
          exp_earned: summary.expEarned,
          total_soal: summary.totalTarget,
          total_benar: summary.totalCorrect,
          next_quiz_id: summary.nextQuizId,
          next_quiz_unlocked: summary.nextQuizUnlocked,
          waktu_penyelesaian: summary.waktu_penyelesaian,
          review: summary.review || [],
        },
      });
    }

    const soal = nextSoalResult.rows[0];
    soal.jawaban = shuffleArray(soal.jawaban || []);

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil soal berikutnya",
      data: {
        ...soal,
        adaptive_target: targetDifficulty,
        health_remaining: stats.score,
        exp_quiz: stats.expQuiz,
        exp_per_wrong: stats.expPerWrong,
        progress: {
          total_soal: stats.totalTarget,
          total_dijawab: stats.totalAnswered,
          total_benar: stats.totalCorrect,
          nomor_soal: stats.totalAnswered + 1,
          sisa_soal: Math.max(0, stats.totalTarget - stats.totalAnswered),
          score_sementara: stats.score,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const submitJawabanMahasiswa = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_quiz } = req.params;
    const {
      id_soal,
      jawaban_ids = [],
      skill_data = {},
      sisa_waktu_detik = null,
    } = req.body;

    const activeEffects = getActiveEffects(skill_data);

    const isTimeUp =
      activeEffects.includes("time_up") ||
      skill_data?.time_up === true ||
      skill_data?.timeout === true;

    const gameRole = String(skill_data?.game_role || "").toLowerCase();

    const isMightyBlow = activeEffects.includes("mighty_blow");
    const isAkashicRecord = activeEffects.includes("akashic_record");
    const isDeduction =
      activeEffects.includes("deduction") ||
      activeEffects.includes("danger_intuition");
    const isFatedRevelation = activeEffects.includes("danger_intuition");
    const isTheft = activeEffects.includes("theft");
    const isAgileHands = activeEffects.includes("agile_hands");

    const isCriminalProficiency = activeEffects.includes(
      "criminal_proficiency",
    );
    const isDirtyTrick = activeEffects.includes("dirty_trick");
    const isEvilImpulse = activeEffects.includes("evil_impulse");

    const isBinding = activeEffects.includes("binding");
    const isCagedEndurance = activeEffects.includes("caged_endurance");
    const isSuppressedDesire = activeEffects.includes("suppressed_desire");

    const isArmorGuard = activeEffects.includes("armor_guard");
    const isMartialCounter = activeEffects.includes("martial_counter");

    const isPreyMark = activeEffects.includes("prey_mark");
    const isTrapSetting = activeEffects.includes("trap_setting");
    const isTerrainAdvantage = activeEffects.includes("terrain_advantage");

    const isWarriorRole = gameRole === "warrior";
    const isReaderRole = gameRole === "reader";
    const isHunterRole = gameRole === "hunter";
    const isMarauderRole = gameRole === "marauder";

    const criminalSkillCount = [
      isCriminalProficiency,
      isDirtyTrick,
      isEvilImpulse,
    ].filter(Boolean).length;

    const prisonerSkillCount = [
      isBinding,
      isCagedEndurance,
      isSuppressedDesire,
    ].filter(Boolean).length;

    const warriorSubmitSkillCount = [isArmorGuard, isMartialCounter].filter(
      Boolean,
    ).length;

    const hunterRiskSkillCount = [isPreyMark, isTrapSetting].filter(
      Boolean,
    ).length;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    const idUser = req.user.id_user;
        if (isTimeUp) {
      await client.query("BEGIN");

      const progressResult = await client.query(
        `
        SELECT *
        FROM progress_quiz
        WHERE id_user = $1
          AND id_quiz = $2
        LIMIT 1
        `,
        [idUser, id_quiz],
      );

      if (progressResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Progress quiz tidak ditemukan",
        });
      }

      const progress = progressResult.rows[0];

      if (progress.is_unlock !== true || progress.status === "locked") {
        await client.query("ROLLBACK");
        return res.status(403).json({
          success: false,
          message: "Quiz masih terkunci",
        });
      }

      if (progress.status === "done") {
        const doneStats = await getQuizStats(client, idUser, id_quiz);
        const review = await getQuizReview(client, idUser, id_quiz);

        await client.query("COMMIT");

        return res.status(200).json({
          success: true,
          message: "Quiz sudah selesai",
          data: {
            finished: true,
            timeout: true,
            score: progress.score || 0,
            exp_earned: doneStats.expEarned || 0,
            health_remaining: progress.score || 0,
            total_soal: doneStats.totalTarget || 0,
            total_benar: doneStats.totalCorrect || 0,
            unanswered_count: 0,
            timeout_penalty: 0,
            next_quiz_id: null,
            next_quiz_unlocked: false,
            waktu_penyelesaian: progress.waktu_penyelesaian || null,
            review,
            progress: {
              total_soal: doneStats.totalTarget,
              total_dijawab: doneStats.totalAnswered,
              total_benar: doneStats.totalCorrect,
              nomor_soal: doneStats.totalTarget,
            },
          },
        });
      }

      const summary = await finalizeQuizByTimeout(
        client,
        idUser,
        id_quiz,
        sisa_waktu_detik,
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: `Waktu habis. ${summary.unansweredCount} soal belum dijawab dihitung salah.`,
        data: {
          finished: true,
          timeout: true,
          is_right: false,
          retry_same_question: false,
          score: summary.score,
          score_before_timeout: summary.scoreBeforeTimeout,
          exp_earned: summary.expEarned,
          exp_quiz: summary.expQuiz,
          exp_per_wrong: summary.expPerWrong,
          min_exp: summary.minExp,
          health_remaining: summary.score,
          unanswered_count: summary.unansweredCount,
          timeout_penalty: summary.unansweredPenalty,
          total_soal: summary.totalTarget,
          total_benar: summary.totalCorrect,
          total_dijawab: summary.totalAnswered,
          next_quiz_id: summary.nextQuizId,
          next_quiz_unlocked: summary.nextQuizUnlocked,
          waktu_penyelesaian: summary.waktu_penyelesaian,
          review: summary.review || [],
          progress: {
            total_soal: summary.totalTarget,
            total_dijawab: summary.totalAnswered,
            total_benar: summary.totalCorrect,
            nomor_soal: summary.totalTarget,
          },
        },
      });
    }

    if (!id_soal) {
      return res.status(400).json({
        success: false,
        message: "id_soal wajib diisi",
      });
    }

    if (criminalSkillCount > 1) {
      return res.status(400).json({
        success: false,
        message: "Hanya bisa memakai 1 skill aktif Criminal pada 1 soal.",
      });
    }

    if (prisonerSkillCount > 1) {
      return res.status(400).json({
        success: false,
        message: "Hanya bisa memakai 1 skill aktif Prisoner pada 1 soal.",
      });
    }

    if (warriorSubmitSkillCount > 1) {
      return res.status(400).json({
        success: false,
        message:
          "Hanya bisa memakai 1 skill aktif Warrior yang berefek saat submit pada 1 soal.",
      });
    }

    if (hunterRiskSkillCount > 1) {
      return res.status(400).json({
        success: false,
        message:
          "Prey Mark tidak bisa digabung dengan Trap Setting pada soal yang sama.",
      });
    }

    if ((isPreyMark || isTrapSetting || isTerrainAdvantage) && !isHunterRole) {
      return res.status(400).json({
        success: false,
        message: "Skill Hunter hanya bisa dipakai oleh role Hunter.",
      });
    }

    if (!isMightyBlow) {
      if (!Array.isArray(jawaban_ids) || jawaban_ids.length < 1) {
        return res.status(400).json({
          success: false,
          message: "jawaban_ids wajib berupa array dan minimal 1 item",
        });
      }
    }

    await client.query("BEGIN");

    const progressResult = await client.query(
      `
      SELECT *
      FROM progress_quiz
      WHERE id_user = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [idUser, id_quiz],
    );

    if (progressResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Progress quiz tidak ditemukan",
      });
    }

    const progress = progressResult.rows[0];

    if (progress.is_unlock !== true || progress.status === "locked") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "Quiz masih terkunci",
      });
    }

    if (progress.status === "done") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Quiz sudah selesai",
      });
    }

    const statsBefore = await getQuizStats(client, idUser, id_quiz);

    if (
      statsBefore.totalTarget > 0 &&
      (statsBefore.totalAnswered >= statsBefore.totalTarget ||
        statsBefore.score <= 0)
    ) {
      const summary = await finalizeQuizIfNeeded(
        client,
        idUser,
        id_quiz,
        sisa_waktu_detik,
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Quiz sudah selesai",
        data: {
          finished: true,
          score: summary.score,
          exp_earned: summary.expEarned,
          health_remaining: summary.score,
          next_quiz_id: summary.nextQuizId,
          next_quiz_unlocked: summary.nextQuizUnlocked,
          waktu_penyelesaian: summary.waktu_penyelesaian,
          review: summary.review || [],
          progress: {
            total_soal: summary.totalTarget,
            total_dijawab: summary.totalAnswered,
            total_benar: summary.totalCorrect,
          },
        },
      });
    }

    const currentNomorSoal = Number(statsBefore.totalAnswered || 0) + 1;
    const totalTargetSoal = Number(statsBefore.totalTarget || 0);
    const isLastQuestion =
      totalTargetSoal > 0 && currentNomorSoal >= totalTargetSoal;

    if (isLastQuestion && isMightyBlow) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Mighty Blow tidak bisa dipakai pada soal terakhir.",
      });
    }

    if (isLastQuestion && isTheft) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Theft tidak bisa dipakai pada soal terakhir.",
      });
    }

    if (isLastQuestion && isMartialCounter) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Martial Counter tidak bisa dipakai pada soal terakhir.",
      });
    }

    if (isLastQuestion && isTrapSetting) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Trap Setting tidak bisa dipakai pada soal terakhir.",
      });
    }

    if (isTerrainAdvantage) {
      const remainingIncludingCurrent = Math.max(
        0,
        totalTargetSoal - currentNomorSoal + 1,
      );

      if (totalTargetSoal > 0 && remainingIncludingCurrent < 2) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Terrain Advantage membutuhkan minimal tersisa 2 soal.",
        });
      }
    }

    if (isArmorGuard && Number(statsBefore.score || 0) < 25) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Health minimal 25 untuk memakai Armor Guard.",
      });
    }

    if (isCagedEndurance && Number(statsBefore.score || 0) > 50) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Caged Endurance hanya bisa dipakai saat health maksimal 50.",
      });
    }

    const soalResult = await client.query(
      `
      SELECT
        id_soal,
        tipe_soal,
        difficulty,
        id_quiz
      FROM soal_quiz
      WHERE id_soal = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [id_soal, id_quiz],
    );

    if (soalResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan pada quiz ini",
      });
    }

    const soal = soalResult.rows[0];

    if (
      isMartialCounter &&
      !["pilgan", "true_false"].includes(String(soal.tipe_soal || ""))
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "Martial Counter hanya bisa dipakai pada soal pilihan ganda atau true/false.",
      });
    }

    if (
      isTrapSetting &&
      !["pilgan", "true_false"].includes(String(soal.tipe_soal || ""))
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "Trap Setting hanya bisa dipakai pada soal pilihan ganda atau true/false.",
      });
    }

    if (isPreyMark && String(soal.tipe_soal || "") !== "pilgan") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Prey Mark hanya bisa dipakai pada soal pilihan ganda.",
      });
    }

    const alreadyAnsweredResult = await client.query(
      `
      SELECT id_soal_done
      FROM soal_done
      WHERE id_user = $1
        AND id_quiz = $2
        AND id_soal = $3
      LIMIT 1
      `,
      [idUser, id_quiz, id_soal],
    );

    if (alreadyAnsweredResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Soal ini sudah dijawab",
      });
    }

    const answerResult = await client.query(
      `
      SELECT
        id_jawaban,
        is_true
      FROM jawaban
      WHERE id_soal = $1
      ORDER BY id_jawaban ASC
      `,
      [id_soal],
    );

    if (answerResult.rows.length === 0 && !isMightyBlow) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Jawaban untuk soal ini belum tersedia",
      });
    }

    const submittedIds = isMightyBlow ? [] : normalizeIds(jawaban_ids);
    const allAnswerIds = answerResult.rows.map((item) => item.id_jawaban);

    const correctIds = answerResult.rows
      .filter((item) => item.is_true === true)
      .map((item) => item.id_jawaban)
      .sort((a, b) => a - b);

    if (!isMightyBlow) {
      const invalidSelected = submittedIds.some(
        (id) => !allAnswerIds.includes(id),
      );

      if (invalidSelected) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Ada jawaban yang tidak valid untuk soal ini",
        });
      }
            if (
        (soal.tipe_soal === "pilgan" || soal.tipe_soal === "true_false") &&
        submittedIds.length !== 1
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Untuk tipe ${soal.tipe_soal}, jawaban harus tepat 1 pilihan`,
        });
      }

      if (isPreyMark) {
        const preyTargetIds = normalizeIds(skill_data?.target_option_ids || []);

        if (preyTargetIds.length < 2) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "Prey Mark membutuhkan 2 opsi target.",
          });
        }

        if (!preyTargetIds.includes(submittedIds[0])) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "Pilih salah satu opsi target Prey Mark sebelum submit.",
          });
        }
      }
    }

    const naturallyCorrect =
      submittedIds.length === correctIds.length &&
      submittedIds.every((value, index) => value === correctIds[index]);

    const isCorrect = isMightyBlow || isAkashicRecord ? true : naturallyCorrect;

    const akashicRecordExpPenalty =
      isAkashicRecord && !naturallyCorrect
        ? Math.max(0, Math.round(Number(statsBefore.expQuiz || 0) / 5))
        : 0;

    const currentHealthBeforeAnswer = Math.max(
      0,
      Math.min(MAX_HEALTH_SCORE, Number(statsBefore.score || MAX_HEALTH_SCORE)),
    );

    let damageTaken = isCorrect ? 0 : DAMAGE_PER_WRONG;

    if (!isCorrect && (isDirtyTrick || isArmorGuard)) {
      damageTaken = Math.ceil(DAMAGE_PER_WRONG / 2);
    }

    if (!isCorrect && isEvilImpulse) {
      damageTaken = DAMAGE_PER_WRONG * 2;
    }

    if (!isCorrect && isPreyMark) {
      damageTaken = Math.ceil(DAMAGE_PER_WRONG * 1.5);
    }

    if (!isCorrect && isTerrainAdvantage) {
      damageTaken = Math.ceil(damageTaken * 0.7);
    }

    const agileHealthBonus = isAgileHands && isCorrect ? 10 : 0;

    const evilImpulseHealthBonus =
      isEvilImpulse && isCorrect ? Math.floor(MAX_HEALTH_SCORE / 5) : 0;

    const cagedEnduranceHealthBonus =
      isCagedEndurance && isCorrect && currentHealthBeforeAnswer <= 50 ? 35 : 0;

    const battleInstinctHealthBonus =
      isWarriorRole && isCorrect && currentHealthBeforeAnswer <= 40 ? 30 : 0;

    const totalHealthBonus =
      agileHealthBonus +
      evilImpulseHealthBonus +
      cagedEnduranceHealthBonus +
      battleInstinctHealthBonus;

    const isMediumOrHardQuestion = ["medium", "hard"].includes(
      String(soal.difficulty || "").toLowerCase(),
    );

    const criminalProficiencyExpBonus =
      isCriminalProficiency && isCorrect
        ? Math.max(0, Math.round(Number(statsBefore.expQuiz || 0) / 10))
        : 0;

    const combatProficiencyExpBonus =
      isMarauderRole && isCorrect && isMediumOrHardQuestion
        ? Math.max(0, Math.round(Number(statsBefore.expQuiz || 0) / 20))
        : 0;

    const suppressedDesireExpBonus =
      isSuppressedDesire && isCorrect
        ? Math.max(0, Math.round((Number(statsBefore.expQuiz || 0) * 3) / 10))
        : 0;

    const learningAdaptationExpBonus =
      isReaderRole &&
      isCorrect &&
      (await shouldTriggerLearningAdaptation(client, idUser, id_quiz))
        ? Math.max(0, Math.round(Number(statsBefore.expQuiz || 0) / 10))
        : 0;

    const preyMarkExpBonus =
      isHunterRole && isPreyMark && isCorrect
        ? Math.max(0, Math.round((Number(statsBefore.expQuiz || 0) * 2) / 10))
        : 0;

    const perfectHuntExpBonus =
      isHunterRole &&
      isCorrect &&
      (await shouldTriggerPerfectHunt(client, idUser, id_quiz))
        ? Math.max(0, Math.round((Number(statsBefore.expQuiz || 0) * 2) / 10))
        : 0;

    const totalExpBonus =
      criminalProficiencyExpBonus +
      combatProficiencyExpBonus +
      suppressedDesireExpBonus +
      learningAdaptationExpBonus +
      preyMarkExpBonus +
      perfectHuntExpBonus;

    const totalExpPenalty = akashicRecordExpPenalty;

    const storedSkillEffectUsed = isMightyBlow
      ? "mighty_blow"
      : isAkashicRecord
        ? "akashic_record"
        : isFatedRevelation
          ? "danger_intuition"
          : isDeduction
            ? "deduction"
            : null;

    const bindingTimeBonus = isBinding && isCorrect ? 60 : 0;

    const healthAfterAnswer = Math.max(
      0,
      Math.min(
        MAX_HEALTH_SCORE,
        currentHealthBeforeAnswer - damageTaken + totalHealthBonus,
      ),
    );

    if (isTheft && !isCorrect) {
      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message:
          "Theft aktif. Jawaban pertama salah, tetapi kamu mendapat 1 kesempatan menjawab ulang.",
        data: {
          is_right: false,
          retry_same_question: true,
          skill_effect_used: "theft",
          finished: false,
          score: statsBefore.score,
          exp_earned: statsBefore.expEarned,
          exp_quiz: statsBefore.expQuiz,
          exp_per_wrong: statsBefore.expPerWrong,
          health_remaining: statsBefore.score,
          damage_taken: 0,
          health_bonus: 0,
          exp_bonus: 0,
          time_bonus: 0,
          progress: {
            total_soal: statsBefore.totalTarget,
            total_dijawab: statsBefore.totalAnswered,
            total_benar: statsBefore.totalCorrect,
            nomor_soal: currentNomorSoal,
          },
        },
      });
    }

    if (isMartialCounter && !isCorrect) {
      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message:
          "Martial Counter aktif. Jawaban salah tadi dikunci, pilih jawaban lain.",
        data: {
          is_right: false,
          retry_same_question: true,
          skill_effect_used: "martial_counter",
          finished: false,
          score: statsBefore.score,
          exp_earned: statsBefore.expEarned,
          exp_quiz: statsBefore.expQuiz,
          exp_per_wrong: statsBefore.expPerWrong,
          health_remaining: statsBefore.score,
          damage_taken: 0,
          health_bonus: 0,
          exp_bonus: 0,
          time_bonus: 0,
          wrong_locked_option_ids: submittedIds,
          progress: {
            total_soal: statsBefore.totalTarget,
            total_dijawab: statsBefore.totalAnswered,
            total_benar: statsBefore.totalCorrect,
            nomor_soal: currentNomorSoal,
          },
        },
      });
    }

    if (isTrapSetting && !isCorrect) {
      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message:
          "Trap Setting aktif. Jawaban salah tadi dikunci, pilih jawaban lain.",
        data: {
          is_right: false,
          retry_same_question: true,
          skill_effect_used: "trap_setting",
          finished: false,
          score: statsBefore.score,
          exp_earned: statsBefore.expEarned,
          exp_quiz: statsBefore.expQuiz,
          exp_per_wrong: statsBefore.expPerWrong,
          health_remaining: statsBefore.score,
          damage_taken: 0,
          health_bonus: 0,
          exp_bonus: 0,
          time_bonus: 0,
          wrong_locked_option_ids: submittedIds,
          progress: {
            total_soal: statsBefore.totalTarget,
            total_dijawab: statsBefore.totalAnswered,
            total_benar: statsBefore.totalCorrect,
            nomor_soal: currentNomorSoal,
          },
        },
      });
    }

    await client.query(
      `
      INSERT INTO soal_done (
        id_user,
        id_quiz,
        id_soal,
        jawaban_ids,
        is_right,
        skill_effect_used,
        exp_penalty,
        created_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, CURRENT_TIMESTAMP)
      `,
      [
        idUser,
        id_quiz,
        id_soal,
        JSON.stringify(submittedIds),
        isCorrect,
        storedSkillEffectUsed,
        totalExpPenalty,
      ],
    );

    await client.query(
      `
      UPDATE progress_quiz
      SET
        score = $1,
        status = 'not done',
        updated_at = CURRENT_TIMESTAMP
      WHERE id_user = $2
        AND id_quiz = $3
      `,
      [healthAfterAnswer, idUser, id_quiz],
    );

    if (totalExpBonus > 0) {
      await addUserExp(client, idUser, totalExpBonus);
      await evaluateAndAwardAchievements(client, idUser);
    }

    const summary = await finalizeQuizIfNeeded(
      client,
      idUser,
      id_quiz,
      sisa_waktu_detik,
    );

    await client.query("COMMIT");

    let skillMessage = null;
    let skillEffectUsed = null;

    if (isMightyBlow) {
      skillEffectUsed = "mighty_blow";
      skillMessage = "Mighty Blow aktif. Soal dihitung benar.";
    }

    if (isAkashicRecord) {
      skillEffectUsed = "akashic_record";
      skillMessage = akashicRecordExpPenalty > 0
        ? `Akashic Record aktif. Jawaban dihitung benar, tetapi karena jawaban asli salah XP quiz dikurangi ${akashicRecordExpPenalty}.`
        : "Akashic Record aktif. Jawaban dihitung benar tanpa penalti XP.";
    }

    if (isDeduction) {
      const capSkillName = isFatedRevelation ? "Fated Revelation" : "Deduction";
      skillEffectUsed = skillEffectUsed || (isFatedRevelation ? "danger_intuition" : "deduction");
      skillMessage = skillMessage
        ? `${skillMessage} ${capSkillName} aktif. Maksimal XP quiz ini menjadi 70%.`
        : `${capSkillName} aktif. Maksimal XP quiz ini menjadi 70%.`;
    }

    if (isAgileHands && agileHealthBonus > 0) {
      skillEffectUsed = "agile_hands";
      skillMessage = `Agile Hands aktif. Health pulih ${agileHealthBonus} poin.`;
    }

    if (isCriminalProficiency && criminalProficiencyExpBonus > 0) {
      skillEffectUsed = "criminal_proficiency";
      skillMessage = `Criminal Proficiency aktif. Bonus XP +${criminalProficiencyExpBonus}.`;
    }

    if (combatProficiencyExpBonus > 0) {
      skillEffectUsed = skillEffectUsed || "combat_proficiency";
      skillMessage = skillMessage
        ? `${skillMessage} Combat Proficiency aktif. Bonus XP +${combatProficiencyExpBonus}.`
        : `Combat Proficiency aktif. Bonus XP +${combatProficiencyExpBonus}.`;
    }

    if (isDirtyTrick && !isCorrect) {
      skillEffectUsed = "dirty_trick";
      skillMessage = `Dirty Trick aktif. Damage dikurangi menjadi ${damageTaken}.`;
    }

    if (isArmorGuard) {
      skillEffectUsed = "armor_guard";
      skillMessage = isCorrect
        ? "Armor Guard aktif. Jawaban benar, tidak ada efek tambahan."
        : `Armor Guard aktif. Damage dikurangi menjadi ${damageTaken}.`;
    }

    if (battleInstinctHealthBonus > 0) {
      skillEffectUsed = skillEffectUsed || "battle_instinct";
      skillMessage = skillMessage
        ? `${skillMessage} Battle Instinct aktif. Health pulih ${battleInstinctHealthBonus} poin.`
        : `Battle Instinct aktif. Health pulih ${battleInstinctHealthBonus} poin.`;
    }

    if (isEvilImpulse) {
      skillEffectUsed = "evil_impulse";
      skillMessage = isCorrect
        ? `Evil Impulse aktif. Health pulih ${evilImpulseHealthBonus} poin.`
        : `Evil Impulse gagal. Damage menjadi ${damageTaken}.`;
    }

    if (isBinding) {
      skillEffectUsed = "binding";
      skillMessage = isCorrect
        ? "Binding aktif. Jawaban benar, waktu bertambah 60 detik."
        : "Binding gagal. Jawaban salah, waktu tidak bertambah.";
    }

    if (isCagedEndurance) {
      skillEffectUsed = "caged_endurance";
      skillMessage = isCorrect
        ? `Caged Endurance aktif. Health pulih ${cagedEnduranceHealthBonus} poin.`
        : "Caged Endurance gagal. Jawaban salah, health tidak bertambah.";
    }

    if (isSuppressedDesire) {
      skillEffectUsed = "suppressed_desire";
      skillMessage = isCorrect
        ? `Suppressed Desire aktif. Bonus XP +${suppressedDesireExpBonus}.`
        : "Suppressed Desire gagal. Jawaban salah, bonus XP tidak didapat.";
    }
        if (learningAdaptationExpBonus > 0) {
      skillEffectUsed = skillEffectUsed || "learning_adaptation";
      skillMessage = skillMessage
        ? `${skillMessage} Learning Adaptation aktif. Bonus XP +${learningAdaptationExpBonus}.`
        : `Learning Adaptation aktif. Bonus XP +${learningAdaptationExpBonus}.`;
    }

    if (isPreyMark) {
      skillEffectUsed = skillEffectUsed || "prey_mark";
      skillMessage = isCorrect
        ? `Prey Mark aktif. Target benar, bonus XP +${preyMarkExpBonus}.`
        : `Prey Mark gagal. Target salah, damage menjadi ${damageTaken}.`;
    }

    if (isTerrainAdvantage && !isCorrect) {
      skillEffectUsed = skillEffectUsed || "terrain_advantage";
      skillMessage = skillMessage
        ? `${skillMessage} Terrain Advantage aktif. Damage dikurangi menjadi ${damageTaken}.`
        : `Terrain Advantage aktif. Damage dikurangi menjadi ${damageTaken}.`;
    }

    if (perfectHuntExpBonus > 0) {
      skillEffectUsed = skillEffectUsed || "perfect_hunt";
      skillMessage = skillMessage
        ? `${skillMessage} Perfect Hunt aktif. Bonus XP +${perfectHuntExpBonus}.`
        : `Perfect Hunt aktif. Bonus XP +${perfectHuntExpBonus}.`;
    }

    return res.status(200).json({
      success: true,
      message:
        skillMessage || (isCorrect ? "Jawaban benar." : "Jawaban salah."),
      data: {
        is_right: isCorrect,
        retry_same_question: false,
        skill_effect_used: skillEffectUsed,
        finished: summary.finished,
        score: summary.score,
        exp_earned: summary.expEarned,
        exp_quiz: summary.expQuiz,
        exp_per_wrong: summary.expPerWrong,
        exp_bonus: totalExpBonus,
        exp_penalty: totalExpPenalty,
        deduction_cap_active: summary.deductionUsed,
        min_exp: summary.minExp,
        health_bonus: totalHealthBonus,
        time_bonus: bindingTimeBonus,
        damage_taken: damageTaken,
        health_remaining: summary.score,
        next_quiz_id: summary.nextQuizId,
        next_quiz_unlocked: summary.nextQuizUnlocked,
        waktu_penyelesaian: summary.waktu_penyelesaian,
        review: summary.review || [],
        progress: {
          total_soal: summary.totalTarget,
          total_dijawab: summary.totalAnswered,
          total_benar: summary.totalCorrect,
          nomor_soal: Math.min(
            summary.totalAnswered + 1,
            summary.totalTarget || summary.totalAnswered + 1,
          ),
        },
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

const enhancedVisionPreview = async (req, res) => {
  try {
    const { id_quiz } = req.params;
    const { id_soal, jawaban_ids = [] } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    if (!id_soal) {
      return res.status(400).json({
        success: false,
        message: "id_soal wajib diisi",
      });
    }

    if (!Array.isArray(jawaban_ids) || jawaban_ids.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "Enhanced Vision membutuhkan tepat 1 jawaban yang dipilih.",
      });
    }

    const soalResult = await pool.query(
      `
      SELECT id_soal, tipe_soal
      FROM soal_quiz
      WHERE id_soal = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [id_soal, id_quiz],
    );

    if (soalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan pada quiz ini",
      });
    }

    const soal = soalResult.rows[0];

    if (!["pilgan", "true_false"].includes(soal.tipe_soal)) {
      return res.status(400).json({
        success: false,
        message:
          "Enhanced Vision hanya bisa dipakai pada pilgan atau true/false.",
      });
    }

    const selectedId = parseInt(jawaban_ids[0], 10);

    if (Number.isNaN(selectedId)) {
      return res.status(400).json({
        success: false,
        message: "Jawaban tidak valid.",
      });
    }

    const answerResult = await pool.query(
      `
      SELECT id_jawaban, jawaban_soal, is_true
      FROM jawaban
      WHERE id_soal = $1
        AND id_jawaban = $2
      LIMIT 1
      `,
      [id_soal, selectedId],
    );

    if (answerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jawaban tidak ditemukan pada soal ini.",
      });
    }

    const answer = answerResult.rows[0];

    return res.status(200).json({
      success: true,
      message: "Enhanced Vision berhasil membaca jawaban.",
      data: {
        id_jawaban: answer.id_jawaban,
        is_right: answer.is_true === true,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deductionReveal = async (req, res) => {
  try {
    const { id_quiz } = req.params;
    const { id_soal } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    if (!id_soal) {
      return res.status(400).json({
        success: false,
        message: "id_soal wajib diisi",
      });
    }

    const idUser = req.user.id_user;

    const stats = await getQuizStats(pool, idUser, id_quiz);
    const currentNomorSoal = Number(stats.totalAnswered || 0) + 1;
    const totalTargetSoal = Number(stats.totalTarget || 0);
    const isLastQuestion =
      totalTargetSoal > 0 && currentNomorSoal >= totalTargetSoal;

    if (isLastQuestion) {
      return res.status(400).json({
        success: false,
        message: "Deduction tidak bisa dipakai pada soal terakhir.",
      });
    }

    const soalResult = await pool.query(
      `
      SELECT id_soal
      FROM soal_quiz
      WHERE id_soal = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [id_soal, id_quiz],
    );

    if (soalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan pada quiz ini",
      });
    }

    const correctResult = await pool.query(
      `
      SELECT id_jawaban, jawaban_soal
      FROM jawaban
      WHERE id_soal = $1
        AND is_true = true
      ORDER BY id_jawaban ASC
      `,
      [id_soal],
    );

    return res.status(200).json({
      success: true,
      message: "Deduction berhasil membaca jawaban benar.",
      data: {
        jawaban_benar: correctResult.rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bodyLanguageAnalysis = async (req, res) => {
  try {
    const { id_quiz } = req.params;
    const { id_soal } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    if (!id_soal) {
      return res.status(400).json({
        success: false,
        message: "id_soal wajib diisi",
      });
    }

    const soalResult = await pool.query(
      `
      SELECT id_soal, tipe_soal
      FROM soal_quiz
      WHERE id_soal = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [id_soal, id_quiz],
    );

    if (soalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan pada quiz ini",
      });
    }

    const soal = soalResult.rows[0];

    if (soal.tipe_soal !== "pilgan") {
      return res.status(400).json({
        success: false,
        message: "Body Language Analysis hanya bisa dipakai pada soal pilgan.",
      });
    }

    const answerResult = await pool.query(
      `
      SELECT id_jawaban, jawaban_soal, is_true
      FROM jawaban
      WHERE id_soal = $1
      ORDER BY RANDOM()
      `,
      [id_soal],
    );

    const correct = answerResult.rows.find((item) => item.is_true === true);
    const wrong = answerResult.rows.find((item) => item.is_true === false);

    if (!correct || !wrong) {
      return res.status(400).json({
        success: false,
        message:
          "Body Language Analysis membutuhkan minimal 1 jawaban benar dan 1 pengecoh.",
      });
    }

    const analysisOptions = shuffleArray([correct, wrong]).map((item) => ({
      id_jawaban: item.id_jawaban,
      jawaban_soal: item.jawaban_soal,
    }));

    return res.status(200).json({
      success: true,
      message: "Body Language Analysis berhasil menandai opsi.",
      data: {
        target_option_ids: analysisOptions.map((item) => item.id_jawaban),
        analysis_options: analysisOptions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const prisonerEscapeMethodPreview = async (req, res) => {
  try {
    const { id_quiz } = req.params;
    const { id_soal } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    if (!id_soal) {
      return res.status(400).json({
        success: false,
        message: "id_soal wajib diisi",
      });
    }

    const soalResult = await pool.query(
      `
      SELECT id_soal, tipe_soal
      FROM soal_quiz
      WHERE id_soal = $1
        AND id_quiz = $2
      LIMIT 1
      `,
      [id_soal, id_quiz],
    );

    if (soalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan pada quiz ini.",
      });
    }

    const soal = soalResult.rows[0];

    if (soal.tipe_soal !== "pilgan") {
      return res.status(400).json({
        success: false,
        message: "Skill ini hanya bisa dipakai pada soal pilihan ganda.",
      });
    }

    const wrongResult = await pool.query(
      `
      SELECT id_jawaban, jawaban_soal
      FROM jawaban
      WHERE id_soal = $1
        AND is_true = false
      ORDER BY RANDOM()
      LIMIT 2
      `,
      [id_soal],
    );

    if (wrongResult.rows.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Skill ini membutuhkan minimal 2 jawaban salah.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dua jawaban salah berhasil ditemukan.",
      data: {
        wrong_option_ids: wrongResult.rows.map((item) => item.id_jawaban),
        wrong_options: wrongResult.rows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNextSoalMahasiswa,
  submitJawabanMahasiswa,
  enhancedVisionPreview,
  deductionReveal,
  bodyLanguageAnalysis,
  prisonerEscapeMethodPreview,
};