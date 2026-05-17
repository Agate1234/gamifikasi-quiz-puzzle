const pool = require("../config/db");
const { evaluateAndAwardAchievements } = require("./achievementController");
const { addUserExp } = require("../helper/leveling");

const getAllProgressMateri = async (req, res) => {
  try {
    const { id_user, id_modul } = req.query;

    let query = `
      SELECT
        pm.id_progress,
        pm.id_user,
        pm.id_materi,
        m.id_modul,
        m.judul_materi,
        m.deskripsi_materi,
        m.exp_materi,
        m.link,
        m.file_materi,
        m.tipe_file,
        pm.is_unlock,
        pm.status,
        pm.created_at,
        pm.updated_at
      FROM progress_materi pm
      INNER JOIN materi m ON pm.id_materi = m.id_materi
    `;

    const conditions = [];
    const values = [];

    if (id_user) {
      values.push(id_user);
      conditions.push(`pm.id_user = $${values.length}`);
    }

    if (id_modul) {
      values.push(id_modul);
      conditions.push(`m.id_modul = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY m.id_modul ASC, m.id_materi ASC, pm.id_progress ASC`;

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

const getProgressMateriById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user } = req.query;

    let query = `
      SELECT
        pm.id_progress,
        pm.id_user,
        pm.id_materi,
        m.id_modul,
        m.judul_materi,
        m.deskripsi_materi,
        m.exp_materi,
        m.link,
        m.file_materi,
        m.tipe_file,
        pm.is_unlock,
        pm.status,
        pm.created_at,
        pm.updated_at
      FROM progress_materi pm
      INNER JOIN materi m ON pm.id_materi = m.id_materi
      WHERE pm.id_materi = $1
    `;

    const values = [id];

    if (id_user) {
      query += ` AND pm.id_user = $2`;
      values.push(id_user);
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Progress materi tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProgressMateriDone = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_progress } = req.params;

    await client.query("BEGIN");

    const currentResult = await client.query(
      `
      SELECT
        pm.id_progress,
        pm.id_user,
        pm.id_materi,
        pm.is_unlock,
        pm.status,
        m.id_modul,
        COALESCE(m.exp_materi, 0)::int AS exp_materi
      FROM progress_materi pm
      INNER JOIN materi m ON pm.id_materi = m.id_materi
      WHERE pm.id_progress = $1
      FOR UPDATE
      `,
      [id_progress],
    );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Progress materi tidak ditemukan",
      });
    }

    const current = currentResult.rows[0];

    if (!current.is_unlock) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "Materi masih terkunci",
      });
    }

    const alreadyDone = current.status === "done";

    const updateCurrentResult = await client.query(
      `
      UPDATE progress_materi
      SET
        status = 'done',
        is_unlock = true,
        updated_at = NOW()
      WHERE id_progress = $1
      RETURNING *
      `,
      [id_progress],
    );

    let nextUnlocked = null;

    const nextResult = await client.query(
      `
      SELECT
        pm.id_progress,
        pm.id_user,
        pm.id_materi,
        pm.is_unlock,
        pm.status,
        m.id_modul
      FROM progress_materi pm
      INNER JOIN materi m ON pm.id_materi = m.id_materi
      WHERE
        pm.id_user = $1
        AND (
          m.id_modul > $2
          OR (
            m.id_modul = $2
            AND pm.id_materi > $3
          )
        )
      ORDER BY m.id_modul ASC, pm.id_materi ASC
      LIMIT 1
      `,
      [current.id_user, current.id_modul, current.id_materi],
    );

    if (nextResult.rows.length > 0) {
      const next = nextResult.rows[0];

      const unlockResult = await client.query(
        `
        UPDATE progress_materi
        SET
          is_unlock = true,
          status = CASE
            WHEN status = 'locked' THEN 'not done'
            ELSE status
          END,
          updated_at = NOW()
        WHERE id_progress = $1
        RETURNING *
        `,
        [next.id_progress],
      );

      nextUnlocked = unlockResult.rows[0];
    }

    if (!alreadyDone) {
      await addUserExp(client, current.id_user, current.exp_materi);
      await evaluateAndAwardAchievements(client, current.id_user);
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: alreadyDone
        ? "Materi sudah selesai sebelumnya."
        : "Materi selesai dan materi berikutnya berhasil dibuka.",
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
  getAllProgressMateri,
  getProgressMateriById,
  updateProgressMateriDone,
};