const pool = require("../config/db");
const { evaluateAndAwardAchievements } = require("./achievementController");
const { addUserExp } = require("../helper/leveling");

const getAllProgressPuzzle = async (req, res) => {
  try {
    const { id_user, id_modul } = req.query;

    let query = `
      SELECT
        pp.id_progress_puzzle,
        pp.id_user,
        pp.id_puzzle,
        p.id_modul,
        p.judul_puzzle,
        p.deskripsi_puzzle,
        p.tipe_puzzle,
        p.difficulty_puzzle,
        p.exp_puzzle,
        pp.is_unlock,
        pp.status,
        pp.attempt,
        pp.waktu,
        pp.jawaban,
        pp.hasil,
        pp.created_at,
        pp.updated_at
      FROM progress_puzzle pp
      INNER JOIN puzzle p ON pp.id_puzzle = p.id_puzzle
    `;

    const conditions = [];
    const values = [];

    if (id_user) {
      values.push(id_user);
      conditions.push(`pp.id_user = $${values.length}`);
    }

    if (id_modul) {
      values.push(id_modul);
      conditions.push(`p.id_modul = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY p.id_modul ASC, pp.id_progress_puzzle ASC`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProgressPuzzleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user } = req.query;

    let query = `
      SELECT
        pp.id_progress_puzzle,
        pp.id_user,
        pp.id_puzzle,
        p.id_modul,
        p.judul_puzzle,
        p.deskripsi_puzzle,
        p.tipe_puzzle,
        p.difficulty_puzzle,
        p.exp_puzzle,
        pp.is_unlock,
        pp.status,
        pp.attempt,
        pp.waktu,
        pp.jawaban,
        pp.hasil,
        pp.created_at,
        pp.updated_at,

        dd.id_drag_drop,
        dd.instruksi AS drag_instruksi,
        dd.items AS drag_items,
        dd.expected_order AS drag_expected_order,

        fb.id_fill_blank,
        fb.instruksi AS blank_instruksi,
        fb.template_text AS blank_template_text,
        fb.expected_answers AS blank_expected_answers,

        pc.id_code,
        pc.instruksi AS code_instruksi,
        pc.starter_code,
        pc.reference_solution,
        pc.function_name,
        pc.language,
        pc.testcases,
        pc.time_limit_ms,
        pc.memory_limit_mb

      FROM progress_puzzle pp
      INNER JOIN puzzle p ON pp.id_puzzle = p.id_puzzle
      LEFT JOIN puzzle_drag_drop dd ON p.id_puzzle = dd.id_puzzle
      LEFT JOIN puzzle_fill_blank fb ON p.id_puzzle = fb.id_puzzle
      LEFT JOIN puzzle_code pc ON p.id_puzzle = pc.id_puzzle
      WHERE pp.id_puzzle = $1
    `;

    const values = [id];

    if (id_user) {
      query += ` AND pp.id_user = $2`;
      values.push(id_user);
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Progress puzzle tidak ditemukan",
      });
    }

    const row = result.rows[0];

    let detail = null;

    if (row.tipe_puzzle === "drag_drop") {
      detail = {
        id_drag_drop: row.id_drag_drop,
        instruksi: row.drag_instruksi,
        items: row.drag_items || [],
        expected_order: row.drag_expected_order || [],
      };
    }

    if (row.tipe_puzzle === "fill_blank") {
      detail = {
        id_fill_blank: row.id_fill_blank,
        instruksi: row.blank_instruksi,
        template_text: row.blank_template_text,
        expected_answers: row.blank_expected_answers || {},
      };
    }

    if (row.tipe_puzzle === "code") {
      detail = {
        id_code: row.id_code,
        instruksi: row.code_instruksi,
        starter_code: row.starter_code,
        reference_solution: row.reference_solution,
        function_name: row.function_name,
        language: row.language,
        testcases: row.testcases || [],
        time_limit_ms: row.time_limit_ms,
        memory_limit_mb: row.memory_limit_mb,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        id_progress_puzzle: row.id_progress_puzzle,
        id_user: row.id_user,
        id_puzzle: row.id_puzzle,
        id_modul: row.id_modul,
        judul_puzzle: row.judul_puzzle,
        deskripsi_puzzle: row.deskripsi_puzzle,
        tipe_puzzle: row.tipe_puzzle,
        difficulty_puzzle: row.difficulty_puzzle,
        exp_puzzle: row.exp_puzzle,
        is_unlock: row.is_unlock,
        status: row.status,
        jawaban: row.jawaban,
        hasil: row.hasil,
        attempt: row.attempt,
        waktu: row.waktu,
        created_at: row.created_at,
        updated_at: row.updated_at,
        detail,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const saveProgressPuzzle = async (req, res) => {
  try {
    const { id_progress_puzzle } = req.params;
    const { waktu = 0, jawaban = null, hasil = null } = req.body;

    const normalizedWaktu = Math.max(0, parseInt(waktu, 10) || 0);

    const currentResult = await pool.query(
      `
      SELECT
        id_progress_puzzle,
        status,
        waktu,
        jawaban,
        hasil
      FROM progress_puzzle
      WHERE id_progress_puzzle = $1
      LIMIT 1
      `,
      [id_progress_puzzle],
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Progress puzzle tidak ditemukan",
      });
    }

    const current = currentResult.rows[0];

    if (current.status === "done") {
      return res.status(200).json({
        success: true,
        message: "Puzzle sudah selesai, progress tidak diubah.",
        data: current,
      });
    }

    const updateResult = await pool.query(
      `
      UPDATE progress_puzzle
      SET
        status = CASE
          WHEN status = 'done' THEN 'done'
          ELSE 'progress'
        END,
        waktu = GREATEST(COALESCE(waktu, 0), $1),
        jawaban = CASE
          WHEN $2::jsonb IS NOT NULL THEN $2::jsonb
          ELSE jawaban
        END,
        hasil = CASE
          WHEN $3::jsonb IS NOT NULL THEN $3::jsonb
          ELSE hasil
        END,
        updated_at = NOW()
      WHERE id_progress_puzzle = $4
      RETURNING *
      `,
      [
        normalizedWaktu,
        jawaban ? JSON.stringify(jawaban) : null,
        hasil ? JSON.stringify(hasil) : null,
        id_progress_puzzle,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Progress puzzle berhasil disimpan.",
      data: updateResult.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProgressPuzzleAttempt = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_progress_puzzle } = req.params;
    const {
      is_done = false,
      waktu = null,
      jawaban = null,
      hasil = null,
    } = req.body;

    await client.query("BEGIN");

    const currentResult = await client.query(
      `
      SELECT
        pp.id_progress_puzzle,
        pp.id_user,
        pp.id_puzzle,
        pp.status,
        p.id_modul,
        COALESCE(p.exp_puzzle, 0)::int AS exp_puzzle
      FROM progress_puzzle pp
      INNER JOIN puzzle p ON pp.id_puzzle = p.id_puzzle
      WHERE pp.id_progress_puzzle = $1
      `,
      [id_progress_puzzle],
    );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Progress puzzle tidak ditemukan",
      });
    }

    const current = currentResult.rows[0];

    const updateCurrentResult = await client.query(
      `
      UPDATE progress_puzzle
      SET
        attempt = attempt + 1,
        status = CASE
          WHEN $2 = true THEN 'done'
          ELSE 'progress'
        END,
        waktu = CASE
          WHEN $3::int IS NOT NULL THEN $3::int
          ELSE waktu
        END,
        jawaban = CASE
          WHEN $4::jsonb IS NOT NULL THEN $4::jsonb
          ELSE jawaban
        END,
        hasil = CASE
          WHEN $5::jsonb IS NOT NULL THEN $5::jsonb
          ELSE hasil
        END,
        updated_at = NOW()
      WHERE id_progress_puzzle = $1
      RETURNING *
      `,
      [
        id_progress_puzzle,
        is_done,
        waktu,
        jawaban ? JSON.stringify(jawaban) : null,
        hasil ? JSON.stringify(hasil) : null,
      ],
    );

    let nextUnlocked = null;

    if (is_done === true) {
      const nextResult = await client.query(
        `
        SELECT
          pp.id_progress_puzzle,
          pp.id_user,
          pp.id_puzzle,
          pp.is_unlock,
          pp.status,
          p.id_modul
        FROM progress_puzzle pp
        INNER JOIN puzzle p ON pp.id_puzzle = p.id_puzzle
        WHERE
          pp.id_user = $1
          AND (
            p.id_modul > $2
            OR (
              p.id_modul = $2
              AND pp.id_puzzle > $3
            )
          )
        ORDER BY p.id_modul ASC, pp.id_puzzle ASC
        LIMIT 1
        `,
        [current.id_user, current.id_modul, current.id_puzzle],
      );

      if (nextResult.rows.length > 0) {
        const next = nextResult.rows[0];

        const unlockResult = await client.query(
          `
          UPDATE progress_puzzle
          SET
            is_unlock = true,
            status = CASE
              WHEN status = 'locked' THEN 'not done'
              ELSE status
            END,
            updated_at = NOW()
          WHERE id_progress_puzzle = $1
          RETURNING *
          `,
          [next.id_progress_puzzle],
        );

        nextUnlocked = unlockResult.rows[0];
      }
    }

    if (is_done === true && current.status !== "done") {
      await addUserExp(client, current.id_user, current.exp_puzzle);
      await evaluateAndAwardAchievements(client, current.id_user);
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: is_done
        ? "Jawaban benar. Puzzle selesai dan puzzle berikutnya berhasil dibuka."
        : "Jawaban salah. Attempt berhasil ditambah.",
      data: {
        current: updateCurrentResult.rows[0],
        next_unlocked: nextUnlocked,
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
  getAllProgressPuzzle,
  getProgressPuzzleById,
  saveProgressPuzzle,
  updateProgressPuzzleAttempt,
};