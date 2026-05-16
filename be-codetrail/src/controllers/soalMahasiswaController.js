const pool = require("../config/db");
const { evaluateAndAwardAchievements } = require("./achievementController");
const { addUserExp } = require("../helper/leveling");

const MAX_SOAL_QUIZ = 10;
const MAX_HEALTH_SCORE = 100;
const DAMAGE_PER_WRONG = 10;

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

const getDifficultyOrder = (targetDifficulty) => {
  if (targetDifficulty === "hard") return ["hard", "medium", "easy"];
  if (targetDifficulty === "medium") return ["medium", "easy", "hard"];
  return ["easy", "medium", "hard"];
};

const getQuizRewardStats = async (client, id_quiz, totalWrong = 0) => {
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
  const expPerWrong =
    MAX_SOAL_QUIZ > 0 ? Math.round(expQuiz / MAX_SOAL_QUIZ) : 0;

  const expEarned = Math.max(0, expQuiz - totalWrong * expPerWrong);

  return {
    expQuiz,
    expPerWrong,
    expEarned,
  };
};

const getQuizStats = async (client, id_user, id_quiz) => {
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
      COUNT(*) FILTER (WHERE is_right = true)::int AS total_correct
    FROM soal_done
    WHERE id_user = $1
      AND id_quiz = $2
    `,
    [id_user, id_quiz],
  );

  const totalAvailable = totalSoalResult.rows[0]?.total_available || 0;
  const totalTarget = Math.min(totalAvailable, MAX_SOAL_QUIZ);
  const totalAnswered = answeredResult.rows[0]?.total_answered || 0;
  const totalCorrect = answeredResult.rows[0]?.total_correct || 0;
  const totalWrong = Math.max(0, totalAnswered - totalCorrect);

  const score = Math.max(0, MAX_HEALTH_SCORE - totalWrong * DAMAGE_PER_WRONG);

  const rewardStats = await getQuizRewardStats(client, id_quiz, totalWrong);

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
  };
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

// DIUBAH: function ini dipakai buat hasil review quiz.
// Jawaban mahasiswa diambil dari soal_done.jawaban_ids.
// Kunci jawaban diambil dari jawaban.is_true = true.
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

const finalizeQuizIfNeeded = async (client, id_user, id_quiz) => {
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

    await client.query(
      `
      UPDATE progress_quiz
      SET
        status = 'done',
        score = $1,
        waktu_penyelesaian = COALESCE(waktu_penyelesaian, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      WHERE id_user = $2
        AND id_quiz = $3
      `,
      [stats.score, id_user, id_quiz],
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

  // DIUBAH: INI YANG SEBELUMNYA HILANG.
  // Kalau quiz belum selesai, function tetap harus return object.
  // Kalau tidak, summary jadi undefined lalu error: reading 'finished'.
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
    const { id_soal, jawaban_ids } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    const idUser = req.user.id_user;

    if (!id_soal) {
      return res.status(400).json({
        success: false,
        message: "id_soal wajib diisi",
      });
    }

    if (!Array.isArray(jawaban_ids) || jawaban_ids.length < 1) {
      return res.status(400).json({
        success: false,
        message: "jawaban_ids wajib berupa array dan minimal 1 item",
      });
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
      const summary = await finalizeQuizIfNeeded(client, idUser, id_quiz);
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

    if (answerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Jawaban untuk soal ini belum tersedia",
      });
    }

    const submittedIds = normalizeIds(jawaban_ids);
    const allAnswerIds = answerResult.rows.map((item) => item.id_jawaban);
    const correctIds = answerResult.rows
      .filter((item) => item.is_true === true)
      .map((item) => item.id_jawaban)
      .sort((a, b) => a - b);

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

    const isCorrect =
      submittedIds.length === correctIds.length &&
      submittedIds.every((value, index) => value === correctIds[index]);

    // DIUBAH: jawaban_ids disimpan ke soal_done.
    // Ini yang bikin hasil quiz bisa menampilkan "Jawaban Mahasiswa".
    await client.query(
      `
      INSERT INTO soal_done (
        is_right,
        id_soal,
        id_user,
        id_quiz,
        jawaban_ids,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [isCorrect, id_soal, idUser, id_quiz, JSON.stringify(submittedIds)],
    );

    const summary = await finalizeQuizIfNeeded(client, idUser, id_quiz);

    const nextDifficulty = summary.finished
      ? null
      : await getAdaptiveDifficulty(client, idUser, id_quiz);

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Jawaban berhasil disimpan",
      data: {
        is_right: isCorrect,
        difficulty_soal_baru_saja: soal.difficulty,
        next_difficulty: nextDifficulty,
        finished: summary.finished,
        score: summary.score,
        exp_earned: summary.expEarned,
        exp_quiz: summary.expQuiz,
        exp_per_wrong: summary.expPerWrong,
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
  getNextSoalMahasiswa,
  submitJawabanMahasiswa,
};
