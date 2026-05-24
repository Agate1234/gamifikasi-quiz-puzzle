const pool = require("../config/db");

const DONE_STATUSES = ["done", "selesai"];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeSort = (value) => {
  const sort = String(value || "desc").toLowerCase();
  return sort === "asc" ? "ASC" : "DESC";
};

const getAllProgressMahasiswa = async (req, res) => {
  try {
    const {
      q = "",
      sort = "desc",
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
    } = req.query;

    const pageNumber = toPositiveInt(page, DEFAULT_PAGE);
    const limitNumber = toPositiveInt(limit, DEFAULT_LIMIT);
    const offset = (pageNumber - 1) * limitNumber;
    const sortDirection = normalizeSort(sort);

    const values = [DONE_STATUSES];
    const conditions = [];

    if (q) {
      values.push(`%${String(q).toLowerCase()}%`);
      conditions.push(`(
        LOWER(COALESCE(u.email, '')) LIKE $${values.length}
        OR CAST(u.id_user AS TEXT) LIKE $${values.length}
      )`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const baseQuery = `
      WITH user_progress AS (
        SELECT
          pm.id_user,

          COUNT(DISTINCT pm.id_modul)::int AS total_modul,

          COUNT(DISTINCT pm.id_modul) FILTER (
            WHERE COALESCE(activity.done_aktivitas, 0) >= COALESCE(activity.total_aktivitas, 0)
              AND COALESCE(activity.total_aktivitas, 0) > 0
          )::int AS done_modul,

          COALESCE(SUM(activity.total_aktivitas), 0)::int AS total_aktivitas,
          COALESCE(SUM(activity.done_aktivitas), 0)::int AS done_aktivitas,
          MAX(pm.updated_at) AS last_activity_at

        FROM progress_modul pm

        LEFT JOIN LATERAL (
          SELECT
            (
              COALESCE(mat.total_materi, 0) +
              COALESCE(qz.total_quiz, 0) +
              COALESCE(puz.total_puzzle, 0)
            )::int AS total_aktivitas,

            (
              COALESCE(mat.done_materi, 0) +
              COALESCE(qz.done_quiz, 0) +
              COALESCE(puz.done_puzzle, 0)
            )::int AS done_aktivitas

          FROM (
            SELECT
              COUNT(mt.id_materi)::int AS total_materi,
              COUNT(prm.id_progress) FILTER (
                WHERE prm.status = ANY($1::text[])
              )::int AS done_materi
            FROM materi mt
            LEFT JOIN progress_materi prm
              ON prm.id_materi = mt.id_materi
             AND prm.id_user = pm.id_user
            WHERE mt.id_modul = pm.id_modul
          ) mat,

          (
            SELECT
              COUNT(q.id_quiz)::int AS total_quiz,
              COUNT(prq.id_progress) FILTER (
                WHERE prq.status = ANY($1::text[])
              )::int AS done_quiz
            FROM quiz q
            LEFT JOIN progress_quiz prq
              ON prq.id_quiz = q.id_quiz
             AND prq.id_user = pm.id_user
            WHERE q.id_modul = pm.id_modul
          ) qz,

          (
            SELECT
              COUNT(p.id_puzzle)::int AS total_puzzle,
              COUNT(prp.id_progress_puzzle) FILTER (
                WHERE prp.status = ANY($1::text[])
              )::int AS done_puzzle
            FROM puzzle p
            LEFT JOIN progress_puzzle prp
              ON prp.id_puzzle = p.id_puzzle
             AND prp.id_user = pm.id_user
            WHERE p.id_modul = pm.id_modul
          ) puz
        ) activity ON true

        GROUP BY pm.id_user
      ),

      final_data AS (
        SELECT
          u.id_user AS id,
          u.id_user,

          COALESCE(u.email, CONCAT('User ', u.id_user)) AS name,
          COALESCE(SPLIT_PART(u.email, '@', 1), CAST(u.id_user AS TEXT)) AS nim,
          '-' AS kelas,

          COALESCE(up.done_modul, 0)::int AS done,
          COALESCE(up.total_modul, 0)::int AS total,

          COALESCE(up.done_aktivitas, 0)::int AS done_aktivitas,
          COALESCE(up.total_aktivitas, 0)::int AS total_aktivitas,

          CASE
            WHEN COALESCE(up.total_aktivitas, 0) <= 0 THEN 0
            ELSE ROUND(
              (
                COALESCE(up.done_aktivitas, 0)::numeric /
                NULLIF(up.total_aktivitas, 0)
              ) * 100
            )::int
          END AS percent,

          up.last_activity_at

        FROM users u
        INNER JOIN user_progress up ON up.id_user = u.id_user
        ${whereClause}
      )
    `;

    const totalResult = await pool.query(
      `${baseQuery}
       SELECT COUNT(*)::int AS total
       FROM final_data`,
      values,
    );

    const dataValues = [...values, limitNumber, offset];

    const dataResult = await pool.query(
      `${baseQuery}
       SELECT *
       FROM final_data
       ORDER BY percent ${sortDirection}, name ASC
       LIMIT $${dataValues.length - 1}
       OFFSET $${dataValues.length}`,
      dataValues,
    );

    const total = totalResult.rows[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: dataResult.rows,
      total,
      paging: {
        page: pageNumber,
        limit: limitNumber,
        total,
        page_total: Math.max(1, Math.ceil(total / limitNumber)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDetailProgressMahasiswa = async (req, res) => {
  try {
    const { id_user } = req.params;

    const studentResult = await pool.query(
      `
      SELECT
        u.id_user,
        COALESCE(u.email, CONCAT('User ', u.id_user)) AS name,
        COALESCE(u.email, '-') AS email,
        COALESCE(SPLIT_PART(u.email, '@', 1), CAST(u.id_user AS TEXT)) AS nim,
        '-' AS kelas
      FROM users u
      WHERE u.id_user = $1
      LIMIT 1
      `,
      [id_user],
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mahasiswa tidak ditemukan",
      });
    }

    const modulesResult = await pool.query(
      `
      SELECT
        m.id_modul AS id,
        m.id_modul,
        m.level,
        m.judul AS title,
        m.deskripsi AS deskripsi_modul,

        COALESCE(pm.is_unlock, false) AS is_unlock,
        pm.created_at,
        pm.updated_at,

        COALESCE(items.items, '[]'::json) AS items,
        COALESCE(items.total_items, 0)::int AS total_items,
        COALESCE(items.done_items, 0)::int AS done_items,

        CASE
          WHEN COALESCE(items.total_items, 0) <= 0 THEN 0
          ELSE ROUND(
            (
              COALESCE(items.done_items, 0)::numeric /
              NULLIF(items.total_items, 0)
            ) * 100
          )::int
        END AS percent

      FROM modul m

      LEFT JOIN progress_modul pm
        ON pm.id_modul = m.id_modul
       AND pm.id_user = $1

      LEFT JOIN LATERAL (
        SELECT
          json_agg(x ORDER BY x.order_index ASC, x.id ASC) AS items,
          COUNT(*)::int AS total_items,
          COUNT(*) FILTER (
            WHERE x.status = ANY($2::text[])
          )::int AS done_items

        FROM (
          SELECT
            mt.id_materi AS id,
            'materi' AS type,
            1 AS order_index,
            mt.judul_materi AS title,
            COALESCE(prm.status, 'not done') AS status,
            COALESCE(prm.is_unlock, false) AS is_unlock,
            NULL::int AS score,
            NULL::int AS waktu,
            prm.updated_at
          FROM materi mt
          LEFT JOIN progress_materi prm
            ON prm.id_materi = mt.id_materi
           AND prm.id_user = $1
          WHERE mt.id_modul = m.id_modul

          UNION ALL

          SELECT
            q.id_quiz AS id,
            'quiz' AS type,
            2 AS order_index,
            q.judul_quiz AS title,
            COALESCE(prq.status, 'not done') AS status,
            COALESCE(prq.is_unlock, false) AS is_unlock,
            prq.score,
            prq.waktu_penyelesaian AS waktu,
            prq.updated_at
          FROM quiz q
          LEFT JOIN progress_quiz prq
            ON prq.id_quiz = q.id_quiz
           AND prq.id_user = $1
          WHERE q.id_modul = m.id_modul

          UNION ALL

          SELECT
            p.id_puzzle AS id,
            'puzzle' AS type,
            3 AS order_index,
            p.judul_puzzle AS title,
            COALESCE(prp.status, 'not done') AS status,
            COALESCE(prp.is_unlock, false) AS is_unlock,
            NULL::int AS score,
            prp.waktu,
            prp.updated_at
          FROM puzzle p
          LEFT JOIN progress_puzzle prp
            ON prp.id_puzzle = p.id_puzzle
           AND prp.id_user = $1
          WHERE p.id_modul = m.id_modul
        ) x
      ) items ON true

      ORDER BY m.level ASC, m.id_modul ASC
      `,
      [id_user, DONE_STATUSES],
    );

    const modules = modulesResult.rows.map((module) => ({
      ...module,
      locked: module.is_unlock !== true,
      subtitle:
        module.is_unlock !== true
          ? "Terkunci"
          : Number(module.percent || 0) >= 100
            ? "Selesai"
            : Number(module.done_items || 0) > 0
              ? "Sedang berjalan"
              : "Belum mulai",
      items: Array.isArray(module.items) ? module.items : [],
    }));

    const doneModules = modules.filter(
      (module) => Number(module.percent || 0) >= 100,
    ).length;

    const totalModules = modules.length;

    const totalItems = modules.reduce(
      (sum, module) => sum + Number(module.total_items || 0),
      0,
    );

    const doneItems = modules.reduce(
      (sum, module) => sum + Number(module.done_items || 0),
      0,
    );

    const overallPercent =
      totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        student: studentResult.rows[0],
        modules,
        summary: {
          done_modules: doneModules,
          total_modules: totalModules,
          done_items: doneItems,
          total_items: totalItems,
          overall_percent: overallPercent,
          done_text: `${doneModules}/${totalModules} Selesai`,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllProgressMahasiswa,
  getDetailProgressMahasiswa,
};