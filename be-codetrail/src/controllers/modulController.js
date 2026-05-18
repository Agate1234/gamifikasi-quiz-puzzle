const pool = require("../config/db");

const getAllModul = async (req, res) => {
  try {
    let { page = 1, limit = 10, q = "" } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;
    const search = `%${q.trim()}%`;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM modul
       WHERE judul ILIKE $1
          OR deskripsi ILIKE $1`,
      [search]
    );

    const total = parseInt(countResult.rows[0].total, 10);

    const result = await pool.query(
      `SELECT 
        m.id_modul AS id,
        m.judul AS title,
        m.level,
        m.deskripsi AS desc,
        m.exp_modul,
        m.created_by,
        m.created_at,
        m.updated_by,
        m.updated_at,
        COALESCE(mat.total_materi, 0) AS materi,
        COALESCE(puz.total_puzzle, 0) AS puzzle,
        COALESCE(qz.total_quiz, 0) AS kuis
      FROM modul m
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
      WHERE m.judul ILIKE $1
         OR m.deskripsi ILIKE $1
      ORDER BY m.level ASC
      LIMIT $2 OFFSET $3`,
      [search, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      paging: {
        page,
        limit,
        total,
        page_total: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getModulById = async (req, res) => {
  try {
    const { id } = req.params;

    const modulResult = await pool.query(
      `SELECT 
        m.id_modul AS id,
        m.judul AS title,
        m.level,
        m.deskripsi AS desc,
        m.exp_modul,
        m.created_by,
        m.created_at,
        m.updated_by,
        m.updated_at
      FROM modul m
      WHERE m.id_modul = $1`,
      [id]
    );

    if (modulResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Modul tidak ditemukan",
      });
    }

    const materiResult = await pool.query(
      `SELECT
        m.id_materi AS id,
        m.judul_materi AS title,
        CASE
          WHEN m.tipe_file ILIKE '%pdf%' THEN 'pdf'
          WHEN m.tipe_file ILIKE '%video%' THEN 'video'
          WHEN m.tipe_file ILIKE '%mp4%' THEN 'video'
          ELSE 'file'
        END AS type,
        CASE
          WHEN m.tipe_file ILIKE '%pdf%' THEN 'PDF'
          WHEN m.tipe_file ILIKE '%video%' OR m.tipe_file ILIKE '%mp4%' THEN 'Video'
          ELSE 'File'
        END AS meta,
        m.link,
        m.file_materi,
        m.tipe_file,
        m.exp_materi
      FROM materi m
      WHERE m.id_modul = $1
      ORDER BY m.id_materi ASC`,
      [id]
    );

    const quizResult = await pool.query(
      `SELECT
        q.id_quiz AS id,
        q.judul_quiz AS title,
        CONCAT('Quiz', CASE WHEN q.is_event = true THEN ' • Event' ELSE '' END) AS meta,
        q.exp_quiz AS point,
        q.is_event
      FROM quiz q
      WHERE q.id_modul = $1
      ORDER BY q.id_quiz ASC`,
      [id]
    );

    const puzzleResult = await pool.query(
      `SELECT
        p.id_puzzle AS id,
        p.judul_puzzle AS title,
        CONCAT(
          COALESCE(REPLACE(p.tipe_puzzle, '_', ' '), 'Puzzle'),
          ' • ',
          COALESCE(p.difficulty_puzzle, '-')
        ) AS meta,
        p.exp_puzzle AS point,
        p.tipe_puzzle,
        p.difficulty_puzzle,
        p.is_event
      FROM puzzle p
      WHERE p.id_modul = $1
      ORDER BY p.id_puzzle ASC`,
      [id]
    );

    const materi = materiResult.rows.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      meta: item.meta,
      link: item.link,
      file_materi: item.file_materi,
      tipe_file: item.tipe_file,
      point: item.exp_materi,
    }));

    const quiz = quizResult.rows.map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.meta,
      point: Number(item.point) || 0,
      is_event: item.is_event,
    }));

    const puzzle = puzzleResult.rows.map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.meta,
      point: Number(item.point) || 0,
      tipe_puzzle: item.tipe_puzzle,
      difficulty_puzzle: item.difficulty_puzzle,
      is_event: item.is_event,
    }));

    const modul = modulResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        ...modul,
        stats: {
          materi: materi.length,
          quiz: quiz.length,
          puzzle: puzzle.length,
        },
        materi,
        quiz,
        puzzle,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createModul = async (req, res) => {
  const client = await pool.connect();

  try {
    const { judul, deskripsi, exp_modul, created_by } = req.body;

    if (!judul || exp_modul === undefined) {
      return res.status(400).json({
        success: false,
        message: "judul dan exp_modul wajib diisi",
      });
    }

    await client.query("BEGIN");

    let namaUser = created_by || "Admin";

    if (req.user?.id_user) {
      const userResult = await client.query(
        "SELECT nama_user FROM users WHERE id_user = $1",
        [req.user.id_user]
      );

      if (userResult.rows.length > 0) {
        namaUser = userResult.rows[0].nama_user;
      }
    }

    const lastLevelResult = await client.query(
      "SELECT COALESCE(MAX(level), 0) AS last_level FROM modul"
    );

    const newLevel = Number(lastLevelResult.rows[0].last_level) + 1;

    const result = await client.query(
      `INSERT INTO modul (
        judul,
        level,
        deskripsi,
        exp_modul,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        judul,
        newLevel,
        deskripsi || null,
        exp_modul,
        namaUser,
        null,
      ]
    );

    const newModul = result.rows[0];

    await client.query(
      `INSERT INTO progress_modul (id_user, id_modul, is_unlock)
       SELECT u.id_user, $1, false
       FROM users u
       WHERE u.id_role = 3
         AND NOT EXISTS (
           SELECT 1
           FROM progress_modul pm
           WHERE pm.id_user = u.id_user
             AND pm.id_modul = $1
         )`,
      [newModul.id_modul]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Modul berhasil ditambahkan",
      data: newModul,
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

const updateModul = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, deskripsi, exp_modul } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    const checkModul = await pool.query(
      "SELECT * FROM modul WHERE id_modul = $1",
      [id]
    );

    if (checkModul.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Modul tidak ditemukan",
      });
    }

    const oldModul = checkModul.rows[0];

    const userResult = await pool.query(
      "SELECT nama_user FROM users WHERE id_user = $1",
      [req.user.id_user]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User login tidak ditemukan",
      });
    }

    const namaUser = userResult.rows[0].nama_user;

    const result = await pool.query(
      `UPDATE modul
       SET judul = $1,
           deskripsi = $2,
           exp_modul = $3,
           updated_by = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_modul = $5
       RETURNING *`,
      [
        judul ?? oldModul.judul,
        deskripsi ?? oldModul.deskripsi,
        exp_modul ?? oldModul.exp_modul,
        namaUser,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Modul berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteModul = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM modul WHERE id_modul = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Modul tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Modul berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllModul,
  getModulById,
  createModul,
  updateModul,
  deleteModul,
};