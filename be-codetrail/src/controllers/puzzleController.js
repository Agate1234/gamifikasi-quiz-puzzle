const pool = require("../config/db");

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item !== "");
};

const getAllPuzzle = async (req, res) => {
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
       FROM puzzle p
       JOIN modul mo ON p.id_modul = mo.id_modul
       WHERE p.judul_puzzle ILIKE $1
          OR p.deskripsi_puzzle ILIKE $1
          OR mo.judul ILIKE $1
          OR p.tipe_puzzle ILIKE $1
          OR p.difficulty_puzzle ILIKE $1`,
      [search]
    );

    const total = parseInt(countResult.rows[0].total, 10);

    const result = await pool.query(
      `SELECT 
          p.id_puzzle AS id,
          p.judul_puzzle AS title,
          p.deskripsi_puzzle AS desc,
          p.tipe_puzzle,
          p.difficulty_puzzle AS level,
          p.is_event,
          p.exp_puzzle AS xp,
          p.id_modul,
          mo.judul AS module,
          p.created_by,
          p.created_at,
          p.updated_by,
          p.updated_at
       FROM puzzle p
       JOIN modul mo ON p.id_modul = mo.id_modul
       WHERE p.judul_puzzle ILIKE $1
          OR p.deskripsi_puzzle ILIKE $1
          OR mo.judul ILIKE $1
          OR p.tipe_puzzle ILIKE $1
          OR p.difficulty_puzzle ILIKE $1
       ORDER BY p.id_puzzle ASC
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

const getPuzzleById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
          p.id_puzzle,
          p.judul_puzzle,
          p.deskripsi_puzzle,
          p.tipe_puzzle,
          p.difficulty_puzzle,
          p.is_event,
          p.exp_puzzle,
          p.id_modul,
          mo.judul AS judul_modul,
          p.created_by,
          p.created_at,
          p.updated_by,
          p.updated_at,

          d.instruksi AS drag_drop_instruksi,
          d.items,
          d.expected_order,

          f.instruksi AS fill_blank_instruksi,
          f.template_text,
          f.expected_answers,

          c.instruksi AS code_instruksi,
          c.starter_code,
          c.reference_solution,
          c.function_name,
          c.language,
          c.testcases,
          c.time_limit_ms,
          c.memory_limit_mb
       FROM puzzle p
       JOIN modul mo ON p.id_modul = mo.id_modul
       LEFT JOIN puzzle_drag_drop d ON p.id_puzzle = d.id_puzzle
       LEFT JOIN puzzle_fill_blank f ON p.id_puzzle = f.id_puzzle
       LEFT JOIN puzzle_code c ON p.id_puzzle = c.id_puzzle
       WHERE p.id_puzzle = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Puzzle tidak ditemukan",
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

const createPuzzle = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      judul_puzzle,
      deskripsi_puzzle,
      tipe_puzzle,
      difficulty_puzzle,
      is_event,
      exp_puzzle,
      id_modul,
      instruksi,
      items,
      template_text,
      expected_answers,
      starter_code,
      reference_solution,
      function_name,
      language,
      testcases,
      time_limit_ms,
      memory_limit_mb,
      created_by,
    } = req.body;

    if (!judul_puzzle || !id_modul || exp_puzzle === undefined || !tipe_puzzle) {
      return res.status(400).json({
        success: false,
        message:
          "judul_puzzle, tipe_puzzle, id_modul, dan exp_puzzle wajib diisi",
      });
    }

    if (!["drag_drop", "fill_blank", "code"].includes(tipe_puzzle)) {
      return res.status(400).json({
        success: false,
        message: "tipe_puzzle harus drag_drop, fill_blank, atau code",
      });
    }

    if (!difficulty_puzzle) {
      return res.status(400).json({
        success: false,
        message: "difficulty_puzzle wajib diisi",
      });
    }

    if (!["easy", "medium", "hard"].includes(difficulty_puzzle)) {
      return res.status(400).json({
        success: false,
        message: "difficulty_puzzle harus easy, medium, atau hard",
      });
    }

    if (!instruksi) {
      return res.status(400).json({
        success: false,
        message: "instruksi wajib diisi",
      });
    }

    const modulResult = await client.query(
      "SELECT id_modul FROM modul WHERE id_modul = $1",
      [id_modul]
    );

    if (modulResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Modul tidak ditemukan",
      });
    }

    const namaUser = created_by || "Admin";

    await client.query("BEGIN");

    const puzzleResult = await client.query(
      `INSERT INTO puzzle (
          judul_puzzle,
          deskripsi_puzzle,
          tipe_puzzle,
          difficulty_puzzle,
          is_event,
          exp_puzzle,
          id_modul,
          created_by,
          updated_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        judul_puzzle,
        deskripsi_puzzle || null,
        tipe_puzzle,
        difficulty_puzzle,
        is_event ?? false,
        exp_puzzle,
        id_modul,
        namaUser,
        null,
      ]
    );

    const puzzle = puzzleResult.rows[0];
    let detail = null;

    if (tipe_puzzle === "drag_drop") {
      const normalizedItems = normalizeItems(items);

      if (normalizedItems.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "items tidak boleh kosong",
        });
      }

      const expectedOrder = normalizedItems;

      const dragDropResult = await client.query(
        `INSERT INTO puzzle_drag_drop (
            id_puzzle,
            instruksi,
            items,
            expected_order
         )
         VALUES ($1, $2, $3::jsonb, $4::jsonb)
         RETURNING *`,
        [
          puzzle.id_puzzle,
          instruksi,
          JSON.stringify(normalizedItems),
          JSON.stringify(expectedOrder),
        ]
      );

      detail = {
        tipe_detail: "drag_drop",
        detail: dragDropResult.rows[0],
      };
    }

    if (tipe_puzzle === "fill_blank") {
      if (!template_text) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "template_text wajib diisi untuk fill_blank",
        });
      }

      if (
        !expected_answers ||
        typeof expected_answers !== "object" ||
        Array.isArray(expected_answers) ||
        Object.keys(expected_answers).length === 0
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "expected_answers wajib diisi dalam format object JSON",
        });
      }

      const fillBlankResult = await client.query(
        `INSERT INTO puzzle_fill_blank (
            id_puzzle,
            instruksi,
            template_text,
            expected_answers
         )
         VALUES ($1, $2, $3, $4::jsonb)
         RETURNING *`,
        [
          puzzle.id_puzzle,
          instruksi,
          template_text,
          JSON.stringify(expected_answers),
        ]
      );

      detail = {
        tipe_detail: "fill_blank",
        detail: fillBlankResult.rows[0],
      };
    }

    if (tipe_puzzle === "code") {
      if (!language) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "language wajib diisi untuk code",
        });
      }

      if (!testcases || !Array.isArray(testcases) || testcases.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "testcases wajib diisi dalam format array JSON",
        });
      }

      const codeResult = await client.query(
        `INSERT INTO puzzle_code (
            id_puzzle,
            instruksi,
            starter_code,
            reference_solution,
            function_name,
            language,
            testcases,
            time_limit_ms,
            memory_limit_mb
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
         RETURNING *`,
        [
          puzzle.id_puzzle,
          instruksi,
          starter_code || null,
          reference_solution || null,
          function_name || null,
          language,
          JSON.stringify(testcases),
          time_limit_ms || 1000,
          memory_limit_mb || 128,
        ]
      );

      detail = {
        tipe_detail: "code",
        detail: codeResult.rows[0],
      };
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Puzzle berhasil ditambahkan",
      data: {
        ...puzzle,
        ...detail,
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

const updatePuzzle = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      judul_puzzle,
      deskripsi_puzzle,
      difficulty_puzzle,
      is_event,
      exp_puzzle,
      id_modul,
      instruksi,
      items,
      template_text,
      expected_answers,
      starter_code,
      reference_solution,
      function_name,
      language,
      testcases,
      time_limit_ms,
      memory_limit_mb,
      updated_by,
      created_by,
    } = req.body;

    const checkPuzzle = await client.query(
      "SELECT * FROM puzzle WHERE id_puzzle = $1",
      [id]
    );

    if (checkPuzzle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Puzzle tidak ditemukan",
      });
    }

    const oldPuzzle = checkPuzzle.rows[0];
    const tipePuzzle = oldPuzzle.tipe_puzzle;

    if (!["drag_drop", "fill_blank", "code"].includes(tipePuzzle)) {
      return res.status(400).json({
        success: false,
        message: "Tipe puzzle belum didukung untuk update",
      });
    }

    const namaUser =
      updated_by ||
      created_by ||
      oldPuzzle.updated_by ||
      oldPuzzle.created_by ||
      "Admin";

    const finalIdModul = id_modul ?? oldPuzzle.id_modul;

    const modulResult = await client.query(
      "SELECT id_modul FROM modul WHERE id_modul = $1",
      [finalIdModul]
    );

    if (modulResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Modul tidak ditemukan",
      });
    }

    await client.query("BEGIN");

    const puzzleResult = await client.query(
      `UPDATE puzzle
       SET judul_puzzle = $1,
           deskripsi_puzzle = $2,
           difficulty_puzzle = $3,
           is_event = $4,
           exp_puzzle = $5,
           id_modul = $6,
           updated_by = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_puzzle = $8
       RETURNING *`,
      [
        judul_puzzle ?? oldPuzzle.judul_puzzle,
        deskripsi_puzzle ?? oldPuzzle.deskripsi_puzzle,
        difficulty_puzzle ?? oldPuzzle.difficulty_puzzle,
        is_event ?? oldPuzzle.is_event,
        exp_puzzle ?? oldPuzzle.exp_puzzle,
        finalIdModul,
        namaUser,
        id,
      ]
    );

    let detail = null;

    if (tipePuzzle === "drag_drop") {
      const oldDragDropResult = await client.query(
        "SELECT * FROM puzzle_drag_drop WHERE id_puzzle = $1",
        [id]
      );

      if (oldDragDropResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Detail drag drop tidak ditemukan",
        });
      }

      const oldDragDrop = oldDragDropResult.rows[0];

      const normalizedItems =
        items !== undefined ? normalizeItems(items) : oldDragDrop.items;

      if (!normalizedItems || normalizedItems.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "items tidak boleh kosong",
        });
      }

      const expectedOrder = normalizedItems;

      const dragDropResult = await client.query(
        `UPDATE puzzle_drag_drop
         SET instruksi = $1,
             items = $2::jsonb,
             expected_order = $3::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_puzzle = $4
         RETURNING *`,
        [
          instruksi ?? oldDragDrop.instruksi,
          JSON.stringify(normalizedItems),
          JSON.stringify(expectedOrder),
          id,
        ]
      );

      detail = {
        tipe_detail: "drag_drop",
        detail: dragDropResult.rows[0],
      };
    }

    if (tipePuzzle === "fill_blank") {
      const oldFillBlankResult = await client.query(
        "SELECT * FROM puzzle_fill_blank WHERE id_puzzle = $1",
        [id]
      );

      if (oldFillBlankResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Detail fill blank tidak ditemukan",
        });
      }

      const oldFillBlank = oldFillBlankResult.rows[0];

      const finalTemplateText = template_text ?? oldFillBlank.template_text;
      const finalExpectedAnswers =
        expected_answers ?? oldFillBlank.expected_answers;

      if (!finalTemplateText) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "template_text tidak boleh kosong",
        });
      }

      if (
        !finalExpectedAnswers ||
        typeof finalExpectedAnswers !== "object" ||
        Array.isArray(finalExpectedAnswers) ||
        Object.keys(finalExpectedAnswers).length === 0
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "expected_answers wajib dalam format object JSON",
        });
      }

      const fillBlankResult = await client.query(
        `UPDATE puzzle_fill_blank
         SET instruksi = $1,
             template_text = $2,
             expected_answers = $3::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_puzzle = $4
         RETURNING *`,
        [
          instruksi ?? oldFillBlank.instruksi,
          finalTemplateText,
          JSON.stringify(finalExpectedAnswers),
          id,
        ]
      );

      detail = {
        tipe_detail: "fill_blank",
        detail: fillBlankResult.rows[0],
      };
    }

    if (tipePuzzle === "code") {
      const oldCodeResult = await client.query(
        "SELECT * FROM puzzle_code WHERE id_puzzle = $1",
        [id]
      );

      if (oldCodeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Detail code tidak ditemukan",
        });
      }

      const oldCode = oldCodeResult.rows[0];

      const finalLanguage = language ?? oldCode.language;
      const finalTestcases = testcases ?? oldCode.testcases;

      if (!finalLanguage) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "language tidak boleh kosong",
        });
      }

      if (
        !finalTestcases ||
        !Array.isArray(finalTestcases) ||
        finalTestcases.length === 0
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "testcases wajib dalam format array JSON",
        });
      }

      const codeResult = await client.query(
        `UPDATE puzzle_code
         SET instruksi = $1,
             starter_code = $2,
             reference_solution = $3,
             function_name = $4,
             language = $5,
             testcases = $6::jsonb,
             time_limit_ms = $7,
             memory_limit_mb = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_puzzle = $9
         RETURNING *`,
        [
          instruksi ?? oldCode.instruksi,
          starter_code ?? oldCode.starter_code,
          reference_solution ?? oldCode.reference_solution,
          function_name ?? oldCode.function_name,
          finalLanguage,
          JSON.stringify(finalTestcases),
          time_limit_ms ?? oldCode.time_limit_ms,
          memory_limit_mb ?? oldCode.memory_limit_mb,
          id,
        ]
      );

      detail = {
        tipe_detail: "code",
        detail: codeResult.rows[0],
      };
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Puzzle berhasil diupdate",
      data: {
        ...puzzleResult.rows[0],
        ...detail,
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

const deletePuzzle = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const checkPuzzle = await client.query(
      "SELECT * FROM puzzle WHERE id_puzzle = $1",
      [id]
    );

    if (checkPuzzle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Puzzle tidak ditemukan",
      });
    }

    await client.query("BEGIN");

    await client.query("DELETE FROM puzzle_drag_drop WHERE id_puzzle = $1", [
      id,
    ]);

    await client.query("DELETE FROM puzzle_fill_blank WHERE id_puzzle = $1", [
      id,
    ]);

    await client.query("DELETE FROM puzzle_code WHERE id_puzzle = $1", [id]);

    await client.query("DELETE FROM puzzle WHERE id_puzzle = $1", [id]);

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Puzzle berhasil dihapus",
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
  getAllPuzzle,
  getPuzzleById,
  createPuzzle,
  updatePuzzle,
  deletePuzzle,
};