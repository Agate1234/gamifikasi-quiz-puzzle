const pool = require("../config/db");

const getAllProgressMateri = async (req, res) => {
  try {
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
    `;

    const values = [];

    if (id_user) {
      query += ` WHERE pm.id_user = $1`;
      values.push(id_user);
    }

    query += ` ORDER BY m.id_modul ASC, pm.id_progress ASC`;

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

module.exports = {
  getAllProgressMateri,
  getProgressMateriById,
};