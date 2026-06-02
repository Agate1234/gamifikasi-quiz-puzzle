const pool = require("../config/db");

const DONE_STATUSES = ["done", "selesai"];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAHASISWA_ROLE_ID = 3;

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeSort = (value) => {
  const sort = String(value || "desc").toLowerCase();
  return sort === "asc" ? "ASC" : "DESC";
};

const getAllHasilMahasiswa = async (req, res) => {
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
    const conditions = [`u.id_role = ${MAHASISWA_ROLE_ID}`];

    if (q) {
      values.push(`%${String(q).toLowerCase()}%`);
      conditions.push(`(
        LOWER(COALESCE(u.nama_user, '')) LIKE $${values.length}
        OR LOWER(COALESCE(u.email, '')) LIKE $${values.length}
        OR CAST(u.id_user AS TEXT) LIKE $${values.length}
      )`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const baseQuery = `
      WITH calculated_score AS (
        SELECT
          u.id_user,

          COALESCE(materi_score.total_materi_score, 0)::int AS total_materi_score,
          COALESCE(quiz_score.total_quiz_score, 0)::int AS total_quiz_score,
          COALESCE(puzzle_score.total_puzzle_score, 0)::int AS total_puzzle_score,

          (
            COALESCE(materi_score.total_materi_score, 0) +
            COALESCE(quiz_score.total_quiz_score, 0) +
            COALESCE(puzzle_score.total_puzzle_score, 0)
          )::int AS total_calculated_score,

          (
            COALESCE(materi_score.total_materi_done, 0) +
            COALESCE(quiz_score.total_quiz_done, 0) +
            COALESCE(puzzle_score.total_puzzle_done, 0)
          )::int AS total_completed_items

        FROM users u

        LEFT JOIN (
          SELECT
            pm.id_user,
            COALESCE(SUM(COALESCE(m.exp_materi, 0)) FILTER (
              WHERE pm.status = ANY($1::text[])
            ), 0)::int AS total_materi_score,
            COUNT(pm.id_progress) FILTER (
              WHERE pm.status = ANY($1::text[])
            )::int AS total_materi_done
          FROM progress_materi pm
          INNER JOIN materi m ON m.id_materi = pm.id_materi
          GROUP BY pm.id_user
        ) materi_score ON materi_score.id_user = u.id_user

        LEFT JOIN (
          SELECT
            pq.id_user,
            COALESCE(SUM(
              ROUND(
                COALESCE(q.exp_quiz, 0) *
                (0.2 + (0.8 * (GREATEST(0, LEAST(COALESCE(pq.score, 0), 100)) / 100.0)))
              )
            ) FILTER (
              WHERE pq.status = ANY($1::text[])
            ), 0)::int AS total_quiz_score,
            COUNT(pq.id_progress) FILTER (
              WHERE pq.status = ANY($1::text[])
            )::int AS total_quiz_done
          FROM progress_quiz pq
          INNER JOIN quiz q ON q.id_quiz = pq.id_quiz
          GROUP BY pq.id_user
        ) quiz_score ON quiz_score.id_user = u.id_user

        LEFT JOIN (
          SELECT
            pp.id_user,
            COALESCE(SUM(COALESCE(p.exp_puzzle, 0)) FILTER (
              WHERE pp.status = ANY($1::text[])
            ), 0)::int AS total_puzzle_score,
            COUNT(pp.id_progress_puzzle) FILTER (
              WHERE pp.status = ANY($1::text[])
            )::int AS total_puzzle_done
          FROM progress_puzzle pp
          INNER JOIN puzzle p ON p.id_puzzle = pp.id_puzzle
          GROUP BY pp.id_user
        ) puzzle_score ON puzzle_score.id_user = u.id_user

        WHERE u.id_role = ${MAHASISWA_ROLE_ID}
      ),

      final_data AS (
        SELECT
          u.id_user AS id,
          u.id_user,
          COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)) AS name,
          COALESCE(SPLIT_PART(u.email, '@', 1), CAST(u.id_user AS TEXT)) AS nim,
          '-' AS kelas,

          COALESCE(u.exp, 0)::int AS xp,
          COALESCE(u.exp, 0)::int AS total_score,
          COALESCE(u.exp, 0)::int AS exp,
          COALESCE(u.level, 1)::int AS level,

          COALESCE(cs.total_materi_score, 0)::int AS total_materi_score,
          COALESCE(cs.total_quiz_score, 0)::int AS total_quiz_score,
          COALESCE(cs.total_puzzle_score, 0)::int AS total_puzzle_score,
          COALESCE(cs.total_completed_items, 0)::int AS total_completed_items

        FROM users u
        LEFT JOIN calculated_score cs ON cs.id_user = u.id_user
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
       ORDER BY xp ${sortDirection}, name ASC
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

const getDetailHasilMahasiswa = async (req, res) => {
  try {
    const { id_user } = req.params;

    const studentResult = await pool.query(
      `
      SELECT
        u.id_user,
        COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)) AS name,
        COALESCE(u.email, '-') AS email,
        COALESCE(SPLIT_PART(u.email, '@', 1), CAST(u.id_user AS TEXT)) AS nim,
        '-' AS kelas,
        COALESCE(u.level, 1)::int AS level,
        COALESCE(u.exp, 0)::int AS exp,
        COALESCE(u.exp, 0)::int AS total_score,
        COALESCE(r.nama_role, '-') AS nama_role,
        COALESCE(r.kd_role, '-') AS kd_role
      FROM users u
      LEFT JOIN roles r ON r.id_role = u.id_role
      WHERE u.id_user = $1
        AND u.id_role = $2
      LIMIT 1
      `,
      [id_user, MAHASISWA_ROLE_ID],
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

        COALESCE(items.items, '[]'::json) AS items,
        COALESCE(items.total_items, 0)::int AS total_items,
        COALESCE(items.completed_items, 0)::int AS completed_items,
        COALESCE(items.subtotal, 0)::int AS subtotal

      FROM modul m

      LEFT JOIN LATERAL (
        SELECT
          json_agg(x ORDER BY x.order_index ASC, x.id ASC) AS items,
          COUNT(*)::int AS total_items,
          COUNT(*) FILTER (WHERE x.is_completed = true)::int AS completed_items,
          COALESCE(SUM(x.score) FILTER (WHERE x.is_completed = true), 0)::int AS subtotal

        FROM (
          SELECT
            mt.id_materi AS id,
            'materi' AS type,
            1 AS order_index,
            mt.judul_materi AS title,
            COALESCE(pm.status, 'not done') AS status,
            (pm.status = ANY($2::text[])) AS is_completed,
            CASE
              WHEN pm.status = ANY($2::text[]) THEN COALESCE(mt.exp_materi, 0)
              ELSE 0
            END::int AS score,
            COALESCE(mt.exp_materi, 0)::int AS max_score,
            NULL::int AS attempt,
            NULL::int AS waktu,
            NULL::int AS accuracy,
            pm.updated_at
          FROM materi mt
          LEFT JOIN progress_materi pm
            ON pm.id_materi = mt.id_materi
           AND pm.id_user = $1
          WHERE mt.id_modul = m.id_modul

          UNION ALL

          SELECT
            q.id_quiz AS id,
            'quiz' AS type,
            2 AS order_index,
            q.judul_quiz AS title,
            COALESCE(pq.status, 'not done') AS status,
            (pq.status = ANY($2::text[])) AS is_completed,
            CASE
              WHEN pq.status = ANY($2::text[]) THEN
                ROUND(
                  COALESCE(q.exp_quiz, 0) *
                  (0.2 + (0.8 * (GREATEST(0, LEAST(COALESCE(pq.score, 0), 100)) / 100.0)))
                )
              ELSE 0
            END::int AS score,
            COALESCE(q.exp_quiz, 0)::int AS max_score,
            NULL::int AS attempt,
            pq.waktu_penyelesaian AS waktu,
            COALESCE(pq.score, 0)::int AS accuracy,
            pq.updated_at
          FROM quiz q
          LEFT JOIN progress_quiz pq
            ON pq.id_quiz = q.id_quiz
           AND pq.id_user = $1
          WHERE q.id_modul = m.id_modul

          UNION ALL

          SELECT
            p.id_puzzle AS id,
            'puzzle' AS type,
            3 AS order_index,
            p.judul_puzzle AS title,
            COALESCE(pp.status, 'not done') AS status,
            (pp.status = ANY($2::text[])) AS is_completed,
            CASE
              WHEN pp.status = ANY($2::text[]) THEN COALESCE(p.exp_puzzle, 0)
              ELSE 0
            END::int AS score,
            COALESCE(p.exp_puzzle, 0)::int AS max_score,
            COALESCE(pp.attempt, 0)::int AS attempt,
            pp.waktu,
            NULL::int AS accuracy,
            pp.updated_at
          FROM puzzle p
          LEFT JOIN progress_puzzle pp
            ON pp.id_puzzle = p.id_puzzle
           AND pp.id_user = $1
          WHERE p.id_modul = m.id_modul
            AND COALESCE(p.is_event, false) = false
        ) x
      ) items ON true

      ORDER BY m.level ASC, m.id_modul ASC
      `,
      [id_user, DONE_STATUSES],
    );

    const eventsResult = await pool.query(
      `
      SELECT
        p.id_puzzle AS id,
        'event' AS type,
        p.judul_puzzle AS title,
        COALESCE(pp.status, 'not done') AS status,
        (pp.status = ANY($2::text[])) AS is_completed,
        CASE
          WHEN pp.status = ANY($2::text[]) THEN COALESCE(p.exp_puzzle, 0)
          ELSE 0
        END::int AS score,
        COALESCE(pp.attempt, 0)::int AS attempt,
        pp.waktu,
        pp.updated_at
      FROM puzzle p
      LEFT JOIN progress_puzzle pp
        ON pp.id_puzzle = p.id_puzzle
       AND pp.id_user = $1
      WHERE COALESCE(p.is_event, false) = true
      ORDER BY p.id_puzzle ASC
      `,
      [id_user, DONE_STATUSES],
    );

    const modules = modulesResult.rows.map((module) => {
      const items = Array.isArray(module.items) ? module.items : [];

      return {
        id: module.id,
        id_modul: module.id_modul,
        level: module.level,
        title: `Modul ${module.level || module.id_modul}: ${module.title}`,
        raw_title: module.title,
        countText: `${module.completed_items}/${module.total_items} item selesai`,
        subtotal: Number(module.subtotal || 0),
        total_items: Number(module.total_items || 0),
        completed_items: Number(module.completed_items || 0),
        items: items.map((item) => {
          const status = String(item.status || "not done").toLowerCase();
          const isCompleted = item.is_completed === true;
          const score = Number(item.score || 0);
          const maxScore = Number(item.max_score || 0);

          let badge = "bad";
          if (isCompleted && score >= maxScore) {
            badge = "perfect";
          } else if (isCompleted && score >= Math.round(maxScore * 0.75)) {
            badge = "good";
          } else if (isCompleted && score > 0) {
            badge = "ok";
          }

          let rightMeta = "";
          if (item.type === "quiz") {
            rightMeta = `Hasil Quiz: ${Number(item.accuracy || 0)} Score`;
          } else if (item.type === "puzzle") {
            rightMeta = `${Number(item.attempt || 0)} Attempt`;
          } else if (item.type === "materi") {
            rightMeta = isCompleted ? "Selesai" : "Belum selesai";
          }

          return {
            id: `${item.type}-${item.id}`,
            original_id: item.id,
            type: item.type,
            title: item.title,
            status,
            is_completed: isCompleted,
            meta: `${isCompleted ? "COMPLETED" : "INCOMPLETE"}${
              item.updated_at
                ? ` • ${new Date(item.updated_at).toLocaleDateString("id-ID")}`
                : ""
            }`,
            badge,
            rightMeta,
            score,
            score_label: "Score",
            max_score: maxScore,
            attempt: item.attempt,
            waktu: item.waktu,
            updated_at: item.updated_at,
          };
        }),
      };
    });

    const events = eventsResult.rows.map((event) => ({
      id: `event-${event.id}`,
      original_id: event.id,
      type: "event",
      title: event.title,
      status: event.status,
      is_completed: event.is_completed,
      meta: `${event.is_completed ? "ATTENDED" : "NOT ATTENDED"}${
        event.updated_at
          ? ` • ${new Date(event.updated_at).toLocaleDateString("id-ID")}`
          : ""
      }`,
      score: Number(event.score || 0),
      attempt: Number(event.attempt || 0),
      waktu: event.waktu,
      updated_at: event.updated_at,
    }));

    const subtotalModules = modules.reduce(
      (sum, module) => sum + Number(module.subtotal || 0),
      0,
    );

    const subtotalEvents = events.reduce(
      (sum, event) => sum + Number(event.score || 0),
      0,
    );

    const totalCalculatedScore = subtotalModules + subtotalEvents;
    const student = studentResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        student: {
          ...student,
          totalScore: Number(student.exp || 0),
          status: "Mahasiswa Aktif",
          badge: `Level ${student.level || 1}`,
          lastUpdate: "Last update: realtime",
        },
        modules,
        events,
        summary: {
          subtotal_modules: subtotalModules,
          subtotal_events: subtotalEvents,
          total_calculated_score: totalCalculatedScore,
          total_score: Number(student.exp || 0),
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
  getAllHasilMahasiswa,
  getDetailHasilMahasiswa,
};