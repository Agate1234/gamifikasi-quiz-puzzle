const pool = require("../config/db");

const getAllProgressQuiz = async (req, res) => {
  try {
    const { id_user, id_modul } = req.query;

    let query = `
      SELECT
        pq.id_progress,
        pq.id_user,
        pq.id_quiz,
        q.id_modul,
        q.judul_quiz,
        q.deskripsi_quiz,
        q.exp_quiz,
        pq.is_unlock,
        pq.status,
        pq.score,
        pq.created_at,
        pq.updated_at
      FROM progress_quiz pq
      INNER JOIN quiz q ON pq.id_quiz = q.id_quiz
    `;

    const conditions = [];
    const values = [];

    if (id_user) {
      values.push(id_user);
      conditions.push(`pq.id_user = $${values.length}`);
    }

    if (id_modul) {
      values.push(id_modul);
      conditions.push(`q.id_modul = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY q.id_modul ASC, pq.id_progress ASC`;

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

const getProgressQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user } = req.query;

    let query = `
      SELECT
        pq.id_progress,
        pq.id_user,
        pq.id_quiz,
        q.id_modul,
        q.judul_quiz,
        q.deskripsi_quiz,
        q.exp_quiz,
        pq.is_unlock,
        pq.status,
        pq.score,
        pq.created_at,
        pq.updated_at
      FROM progress_quiz pq
      INNER JOIN quiz q ON pq.id_quiz = q.id_quiz
      WHERE pq.id_quiz = $1
    `;

    const values = [id];

    if (id_user) {
      query += ` AND pq.id_user = $2`;
      values.push(id_user);
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Progress quiz tidak ditemukan",
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

module.exports = {
  getAllProgressQuiz,
  getProgressQuizById,
};