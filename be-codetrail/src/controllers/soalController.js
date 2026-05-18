const pool = require("../config/db");

const getAllSoal = async (req, res) => {
  try {
    let { page = 1, limit = 10, q = "" } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;
    const search = `%${q.trim()}%`;

    const countResult = await pool.query(
      `
      SELECT COUNT(DISTINCT sq.id_soal) AS total
      FROM soal_quiz sq
      LEFT JOIN quiz qz ON sq.id_quiz = qz.id_quiz
      LEFT JOIN modul m ON qz.id_modul = m.id_modul
      WHERE sq.soal ILIKE $1
         OR sq.tipe_soal ILIKE $1
         OR sq.difficulty ILIKE $1
         OR qz.judul_quiz ILIKE $1
         OR m.judul ILIKE $1
      `,
      [search],
    );

    const total = parseInt(countResult.rows[0].total, 10);

    const result = await pool.query(
      `
      SELECT
        sq.id_soal AS id,
        sq.soal AS question,
        sq.tipe_soal AS type,
        sq.difficulty,
        sq.id_quiz,
        qz.judul_quiz AS "quizTitle",
        m.judul AS module,
        sq.created_by,
        sq.created_at,
        sq.updated_by,
        sq.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id_jawaban', j.id_jawaban,
              'jawaban_soal', j.jawaban_soal,
              'is_true', j.is_true
            )
          ) FILTER (WHERE j.id_jawaban IS NOT NULL),
          '[]'
        ) AS jawaban
      FROM soal_quiz sq
      LEFT JOIN jawaban j ON sq.id_soal = j.id_soal
      LEFT JOIN quiz qz ON sq.id_quiz = qz.id_quiz
      LEFT JOIN modul m ON qz.id_modul = m.id_modul
      WHERE sq.soal ILIKE $1
         OR sq.tipe_soal ILIKE $1
         OR sq.difficulty ILIKE $1
         OR qz.judul_quiz ILIKE $1
         OR m.judul ILIKE $1
      GROUP BY
        sq.id_soal,
        sq.soal,
        sq.tipe_soal,
        sq.difficulty,
        sq.id_quiz,
        qz.judul_quiz,
        m.judul,
        sq.created_by,
        sq.created_at,
        sq.updated_by,
        sq.updated_at
      ORDER BY sq.id_soal ASC
      LIMIT $2 OFFSET $3
      `,
      [search, limit, offset],
    );

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua data soal",
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

const getSoalById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        sq.id_soal,
        sq.soal,
        sq.tipe_soal,
        sq.difficulty,
        sq.id_quiz,
        sq.created_by,
        sq.created_at,
        sq.updated_by,
        sq.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id_jawaban', j.id_jawaban,
              'jawaban_soal', j.jawaban_soal,
              'is_true', j.is_true,
              'id_soal', j.id_soal,
              'created_by', j.created_by,
              'created_at', j.created_at,
              'updated_by', j.updated_by,
              'updated_at', j.updated_at
            )
          ) FILTER (WHERE j.id_jawaban IS NOT NULL),
          '[]'
        ) AS jawaban
      FROM soal_quiz sq
      LEFT JOIN jawaban j ON sq.id_soal = j.id_soal
      WHERE sq.id_soal = $1
      GROUP BY 
        sq.id_soal,
        sq.soal,
        sq.tipe_soal,
        sq.difficulty,
        sq.id_quiz,
        sq.created_by,
        sq.created_at,
        sq.updated_by,
        sq.updated_at
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil detail soal",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createSoal = async (req, res) => {
  const client = await pool.connect();

  const createOneSoal = async (payload, namaUser) => {
    const { soal, tipe_soal, difficulty, id_quiz, jawaban } = payload;

    if (!soal || !tipe_soal || !difficulty || !id_quiz) {
      throw new Error("soal, tipe_soal, difficulty, dan id_quiz wajib diisi");
    }

    if (!Array.isArray(jawaban) || jawaban.length < 2) {
      throw new Error("Jawaban minimal 2 item");
    }

    const validTipe = ["pilgan", "checkbox", "true_false"];
    if (!validTipe.includes(tipe_soal)) {
      throw new Error("tipe_soal harus pilgan, checkbox, atau true_false");
    }

    const validDifficulty = ["easy", "medium", "hard"];
    if (!validDifficulty.includes(difficulty)) {
      throw new Error("difficulty harus easy, medium, atau hard");
    }

    const quizResult = await client.query(
      "SELECT id_quiz FROM quiz WHERE id_quiz = $1",
      [id_quiz],
    );

    if (quizResult.rows.length === 0) {
      throw new Error(`Quiz dengan id ${id_quiz} tidak ditemukan`);
    }

    for (const item of jawaban) {
      if (!item.jawaban_soal || typeof item.is_true !== "boolean") {
        throw new Error(
          "Setiap jawaban harus punya jawaban_soal dan is_true boolean",
        );
      }
    }

    const jumlahBenar = jawaban.filter((item) => item.is_true === true).length;

    if (
      (tipe_soal === "pilgan" || tipe_soal === "true_false") &&
      jumlahBenar !== 1
    ) {
      throw new Error(`Untuk tipe ${tipe_soal}, harus tepat 1 jawaban benar`);
    }

    if (tipe_soal === "checkbox" && jumlahBenar < 1) {
      throw new Error("Untuk tipe checkbox, minimal 1 jawaban benar");
    }

    const insertSoalQuery = `
      INSERT INTO soal_quiz (
        soal,
        tipe_soal,
        difficulty,
        id_quiz,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const soalResult = await client.query(insertSoalQuery, [
      soal,
      tipe_soal,
      difficulty,
      id_quiz,
      namaUser,
      null,
    ]);

    const soalBaru = soalResult.rows[0];
    const jawabanTersimpan = [];

    for (const item of jawaban) {
      const insertJawabanQuery = `
        INSERT INTO jawaban (
          jawaban_soal,
          is_true,
          id_soal,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const jawabanResult = await client.query(insertJawabanQuery, [
        item.jawaban_soal,
        item.is_true,
        soalBaru.id_soal,
        namaUser,
        null,
      ]);

      jawabanTersimpan.push(jawabanResult.rows[0]);
    }

    return {
      soal: soalBaru,
      jawaban: jawabanTersimpan,
    };
  };

  try {
    const payloads = Array.isArray(req.body) ? req.body : [req.body];

    if (payloads.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Data soal tidak boleh kosong",
      });
    }

    let namaUser = "Admin";

    if (!Array.isArray(req.body)) {
      namaUser = req.body.created_by || "Admin";
    } else {
      namaUser = req.body[0]?.created_by || "Admin";
    }

    if (req.user?.id_user) {
      const userResult = await client.query(
        "SELECT nama_user FROM users WHERE id_user = $1",
        [req.user.id_user],
      );

      if (userResult.rows.length > 0) {
        namaUser = userResult.rows[0].nama_user;
      }
    }

    await client.query("BEGIN");

    const results = [];

    for (const payload of payloads) {
      const result = await createOneSoal(
        payload,
        payload.created_by || namaUser,
      );
      results.push(result);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: Array.isArray(req.body)
        ? "Semua soal dan jawaban berhasil ditambahkan"
        : "Soal dan jawaban berhasil ditambahkan",
      data: Array.isArray(req.body) ? results : results[0],
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

const updateSoal = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { soal, tipe_soal, difficulty, id_quiz, jawaban } = req.body;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    if (!soal || !tipe_soal || !difficulty || !id_quiz) {
      return res.status(400).json({
        success: false,
        message: "soal, tipe_soal, difficulty, dan id_quiz wajib diisi",
      });
    }

    if (!Array.isArray(jawaban) || jawaban.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Jawaban minimal 2 item",
      });
    }

    const userResult = await client.query(
      "SELECT nama_user FROM users WHERE id_user = $1",
      [req.user.id_user],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User login tidak ditemukan",
      });
    }

    const soalResultCheck = await client.query(
      "SELECT * FROM soal_quiz WHERE id_soal = $1",
      [id],
    );

    if (soalResultCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan",
      });
    }

    const quizResult = await client.query(
      "SELECT id_quiz FROM quiz WHERE id_quiz = $1",
      [id_quiz],
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quiz tidak ditemukan",
      });
    }

    for (const item of jawaban) {
      if (!item.jawaban_soal || typeof item.is_true !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "Setiap jawaban harus punya jawaban_soal dan is_true boolean",
        });
      }
    }

    const jumlahBenar = jawaban.filter((item) => item.is_true === true).length;

    if (
      (tipe_soal === "pilgan" || tipe_soal === "true_false") &&
      jumlahBenar !== 1
    ) {
      return res.status(400).json({
        success: false,
        message: `Untuk tipe ${tipe_soal}, harus tepat 1 jawaban benar`,
      });
    }

    if (tipe_soal === "checkbox" && jumlahBenar < 1) {
      return res.status(400).json({
        success: false,
        message: "Untuk tipe checkbox, minimal 1 jawaban benar",
      });
    }

    const namaUser = userResult.rows[0].nama_user;

    await client.query("BEGIN");

    const updateSoalQuery = `
      UPDATE soal_quiz
      SET
        soal = $1,
        tipe_soal = $2,
        difficulty = $3,
        id_quiz = $4,
        updated_by = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_soal = $6
      RETURNING *
    `;

    const updatedSoalResult = await client.query(updateSoalQuery, [
      soal,
      tipe_soal,
      difficulty,
      id_quiz,
      namaUser,
      id,
    ]);

    await client.query("DELETE FROM jawaban WHERE id_soal = $1", [id]);

    const jawabanTersimpan = [];

    for (const item of jawaban) {
      const insertJawabanQuery = `
        INSERT INTO jawaban (
          jawaban_soal,
          is_true,
          id_soal,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const jawabanResult = await client.query(insertJawabanQuery, [
        item.jawaban_soal,
        item.is_true,
        id,
        namaUser,
        null,
      ]);

      jawabanTersimpan.push(jawabanResult.rows[0]);
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Soal dan jawaban berhasil diupdate",
      data: {
        soal: updatedSoalResult.rows[0],
        jawaban: jawabanTersimpan,
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

const deleteSoal = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    const userResult = await client.query(
      "SELECT nama_user FROM users WHERE id_user = $1",
      [req.user.id_user],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User login tidak ditemukan",
      });
    }

    const checkSoal = await client.query(
      "SELECT * FROM soal_quiz WHERE id_soal = $1",
      [id],
    );

    if (checkSoal.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Soal tidak ditemukan",
      });
    }

    await client.query("BEGIN");

    await client.query("DELETE FROM jawaban WHERE id_soal = $1", [id]);
    await client.query("DELETE FROM soal_quiz WHERE id_soal = $1", [id]);

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Soal dan jawaban berhasil dihapus",
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
  createSoal,
  updateSoal,
  getAllSoal,
  getSoalById,
  deleteSoal,
};
