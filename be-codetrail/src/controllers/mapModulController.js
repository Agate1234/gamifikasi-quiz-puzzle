const pool = require("../config/db");

const DONE_STATUSES = ["done", "selesai"];

const ensureProgressModulExists = async (client, id_user, modules = []) => {
  if (!id_user) return;

  for (let i = 0; i < modules.length; i++) {
    const currentModule = modules[i];

    const existingProgress = await client.query(
      `
      SELECT id_progress
      FROM progress_modul
      WHERE id_user = $1
        AND id_modul = $2
      LIMIT 1
      `,
      [id_user, currentModule.id_modul],
    );

    if (existingProgress.rowCount === 0) {
      await client.query(
        `
        INSERT INTO progress_modul (id_user, id_modul, is_unlock)
        VALUES ($1, $2, $3)
        `,
        [id_user, currentModule.id_modul, i === 0],
      );
    }
  }
};

const getModuleCompletion = async (client, id_user, id_modul) => {
  const result = await client.query(
    `
    SELECT
      COALESCE(mat.total_materi, 0)::int AS total_materi,
      COALESCE(mat.done_materi, 0)::int AS done_materi,

      COALESCE(qz.total_quiz, 0)::int AS total_quiz,
      COALESCE(qz.done_quiz, 0)::int AS done_quiz,

      COALESCE(puz.total_puzzle, 0)::int AS total_puzzle,
      COALESCE(puz.done_puzzle, 0)::int AS done_puzzle

    FROM modul m

    LEFT JOIN (
      SELECT
        mt.id_modul,
        COUNT(mt.id_materi) AS total_materi,
        COUNT(pm.id_progress) FILTER (
          WHERE pm.status = ANY($3::text[])
        ) AS done_materi
      FROM materi mt
      LEFT JOIN progress_materi pm
        ON pm.id_materi = mt.id_materi
       AND pm.id_user = $1
      WHERE mt.id_modul = $2
      GROUP BY mt.id_modul
    ) mat ON mat.id_modul = m.id_modul

    LEFT JOIN (
      SELECT
        q.id_modul,
        COUNT(q.id_quiz) AS total_quiz,
        COUNT(pq.id_progress) FILTER (
          WHERE pq.status = ANY($3::text[])
        ) AS done_quiz
      FROM quiz q
      LEFT JOIN progress_quiz pq
        ON pq.id_quiz = q.id_quiz
       AND pq.id_user = $1
      WHERE q.id_modul = $2
      GROUP BY q.id_modul
    ) qz ON qz.id_modul = m.id_modul

    LEFT JOIN (
      SELECT
        p.id_modul,
        COUNT(p.id_puzzle) AS total_puzzle,
        COUNT(pp.id_progress_puzzle) FILTER (
          WHERE pp.status = ANY($3::text[])
        ) AS done_puzzle
      FROM puzzle p
      LEFT JOIN progress_puzzle pp
        ON pp.id_puzzle = p.id_puzzle
       AND pp.id_user = $1
      WHERE p.id_modul = $2
      GROUP BY p.id_modul
    ) puz ON puz.id_modul = m.id_modul

    WHERE m.id_modul = $2
    `,
    [id_user, id_modul, DONE_STATUSES],
  );

  const row = result.rows[0] || {};

  const totalActivities =
    Number(row.total_materi || 0) +
    Number(row.total_quiz || 0) +
    Number(row.total_puzzle || 0);

  const doneActivities =
    Number(row.done_materi || 0) +
    Number(row.done_quiz || 0) +
    Number(row.done_puzzle || 0);

  return {
    totalActivities,
    doneActivities,
    completed: totalActivities > 0 && doneActivities >= totalActivities,
  };
};

const unlockNextModulesIfPreviousCompleted = async (client, id_user) => {
  if (!id_user) return;

  const modulesResult = await client.query(`
    SELECT id_modul, level
    FROM modul
    ORDER BY level ASC, id_modul ASC
  `);

  const modules = modulesResult.rows || [];

  if (modules.length === 0) return;

  await ensureProgressModulExists(client, id_user, modules);

  await client.query(
    `
    UPDATE progress_modul
    SET is_unlock = true,
        updated_at = NOW()
    WHERE id_user = $1
      AND id_modul = $2
    `,
    [id_user, modules[0].id_modul],
  );

  for (let i = 0; i < modules.length - 1; i++) {
    const currentModule = modules[i];
    const nextModule = modules[i + 1];

    const completion = await getModuleCompletion(
      client,
      id_user,
      currentModule.id_modul,
    );

    if (completion.completed) {
      await client.query(
        `
        UPDATE progress_modul
        SET is_unlock = true,
            updated_at = NOW()
        WHERE id_user = $1
          AND id_modul = $2
        `,
        [id_user, nextModule.id_modul],
      );
    }
  }
};

const getAllProgressModul = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_user } = req.query;

    await client.query("BEGIN");

    if (id_user) {
      await unlockNextModulesIfPreviousCompleted(client, id_user);
    }

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
      values.push(id_user);
      query += ` WHERE pm.id_user = $${values.length}`;
    }

    query += ` ORDER BY m.level ASC, pm.id_progress ASC`;

    const result = await client.query(query, values);

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      data: result.rows,
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
  getAllProgressModul,
};