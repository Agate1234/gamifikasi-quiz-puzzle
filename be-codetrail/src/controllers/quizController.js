const pool = require('../config/db');

// GET all quiz
const getAllQuiz = async (req, res) => {
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
       FROM quiz q
       LEFT JOIN modul m ON m.id_modul = q.id_modul
       WHERE q.judul_quiz ILIKE $1
          OR q.deskripsi_quiz ILIKE $1
          OR m.judul ILIKE $1`,
      [search]
    );

    const total = parseInt(countResult.rows[0].total, 10);

    const result = await pool.query(
      `SELECT
        q.id_quiz AS id,
        q.judul_quiz AS title,
        q.deskripsi_quiz AS desc,
        q.is_event,
        q.exp_quiz AS exp,
        q.id_modul,
        m.judul AS module,
        q.created_by,
        q.created_at,
        q.updated_by,
        q.updated_at,
        COALESCE(sq.total_question, 0) AS "totalQuestion"
      FROM quiz q
      LEFT JOIN modul m ON m.id_modul = q.id_modul
      LEFT JOIN (
        SELECT id_quiz, COUNT(*) AS total_question
        FROM soal_quiz
        GROUP BY id_quiz
      ) sq ON sq.id_quiz = q.id_quiz
      WHERE q.judul_quiz ILIKE $1
         OR q.deskripsi_quiz ILIKE $1
         OR m.judul ILIKE $1
      ORDER BY q.id_quiz ASC
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
    console.error("getAllQuiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data quiz",
      error: error.message,
    });
  }
};

// GET quiz by id
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quizResult = await pool.query(
      `SELECT
        q.id_quiz AS id,
        q.judul_quiz AS title,
        q.deskripsi_quiz AS desc,
        q.is_event,
        q.exp_quiz AS exp,
        q.id_modul,
        m.judul AS module,
        q.created_by,
        q.created_at,
        q.updated_by,
        q.updated_at
      FROM quiz q
      LEFT JOIN modul m ON m.id_modul = q.id_modul
      WHERE q.id_quiz = $1`,
      [id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quiz tidak ditemukan",
      });
    }

    const soalResult = await pool.query(
      `SELECT
        sq.id_soal AS id,
        sq.soal AS question,
        sq.tipe_soal AS type,
        sq.difficulty,
        COALESCE(
          json_agg(
            json_build_object(
              'id', j.id_jawaban,
              'text', j.jawaban_soal,
              'correct', j.is_true
            )
            ORDER BY j.id_jawaban ASC
          ) FILTER (WHERE j.id_jawaban IS NOT NULL),
          '[]'
        ) AS options
      FROM soal_quiz sq
      LEFT JOIN jawaban j ON j.id_soal = sq.id_soal
      WHERE sq.id_quiz = $1
      GROUP BY
        sq.id_soal,
        sq.soal,
        sq.tipe_soal,
        sq.difficulty
      ORDER BY sq.id_soal ASC`,
      [id]
    );

    const mappedQuestions = soalResult.rows.map((item) => ({
      id: item.id,
      question: item.question,
      type:
        item.type === "pilgan"
          ? "mcq"
          : item.type === "true_false"
            ? "tf"
            : item.type,
      difficulty: item.difficulty,
      options: (item.options || []).map((opt, index) => ({
        ...opt,
        label: String.fromCharCode(65 + index),
      })),
    }));

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil data quiz",
      data: {
        ...quizResult.rows[0],
        totalQuestion: mappedQuestions.length,
        questions: mappedQuestions,
      },
    });
  } catch (error) {
    console.error("getQuizById error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data quiz",
      error: error.message,
    });
  }
};

// CREATE quiz
const createQuiz = async (req, res) => {
  try {
    const {
      judul_quiz,
      deskripsi_quiz,
      is_event,
      exp_quiz,
      id_modul,
    } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    if (!judul_quiz || exp_quiz === undefined) {
      return res.status(400).json({
        success: false,
        message: "judul_quiz, dan exp_quiz wajib diisi",
      });
    }

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
      `INSERT INTO quiz (
          judul_quiz,
          deskripsi_quiz,
          is_event,
          exp_quiz,
          id_modul,
          created_by,
          updated_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        judul_quiz,
        deskripsi_quiz || null,
        is_event ?? false,
        exp_quiz,
        id_modul,
        namaUser,
        null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Quiz berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE quiz
const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      judul_quiz,
      deskripsi_quiz,
      is_event,
      exp_quiz,
      id_modul,
    } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    const quizResult = await pool.query(
      "SELECT * FROM quiz WHERE id_quiz = $1",
      [id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quiz tidak ditemukan",
      });
    }

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

    const modulResult = await pool.query(
      "SELECT id_modul FROM modul WHERE id_modul = $1",
      [id_modul]
    );

    const namaUser = userResult.rows[0].nama_user;

    const result = await pool.query(
      `UPDATE quiz
       SET judul_quiz = $1,
           deskripsi_quiz = $2,
           is_event = $3,
           exp_quiz = $4,
           id_modul = $5,
           updated_by = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_quiz = $7
       RETURNING *`,
      [
        judul_quiz,
        deskripsi_quiz || null,
        is_event,
        exp_quiz,
        id_modul,
        namaUser,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Quiz berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE quiz
const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuiz = await pool.query(
            `SELECT * FROM quiz WHERE id_quiz = $1`,
            [id]
        );

        if (checkQuiz.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Quiz tidak ditemukan'
            });
        }

        await pool.query(
            `DELETE FROM quiz WHERE id_quiz = $1`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Quiz berhasil dihapus'
        });
    } catch (error) {
        console.error('deleteQuiz error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus quiz',
            error: error.message
        });
    }
};

module.exports = {
    getAllQuiz,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz
};