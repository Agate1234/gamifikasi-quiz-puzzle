const pool = require("../config/db");

const getAllProgressModul = async (req, res) => {
  try {
    const { id_user } = req.query;

    let query = `
      SELECT
        pm.id_progress,
        pm.id_user,
        pm.id_modul,
        m.judul AS judul_modul,
        m.level,
        m.deskripsi AS deskripsi_modul,
        m.exp_modul,
        pm.is_unlock,
        COALESCE(mat.total_materi, 0) AS materi,
        COALESCE(puz.total_puzzle, 0) AS puzzle,
        COALESCE(qz.total_quiz, 0) AS kuis,
        pm.created_at,
        pm.updated_at
      FROM progress_modul pm
      INNER JOIN modul m ON pm.id_modul = m.id_modul
      LEFT JOIN (
        SELECT id_modul, COUNT(*) AS total_materi
        FROM materi
        GROUP BY id_modul
      ) mat ON mat.id_modul = m.id_modul
      LEFT JOIN (
        SELECT id_modul, COUNT(*) AS total_puzzle
        FROM puzzle
        GROUP BY id_modul
      ) puz ON puz.id_modul = m.id_modul
      LEFT JOIN (
        SELECT id_modul, COUNT(*) AS total_quiz
        FROM quiz
        GROUP BY id_modul
      ) qz ON qz.id_modul = m.id_modul
    `;

    const values = [];

    if (id_user) {
      query += ` WHERE pm.id_user = $1`;
      values.push(id_user);
    }

    query += ` ORDER BY m.level ASC, pm.id_progress ASC`;

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

module.exports = {
  getAllProgressModul,
};