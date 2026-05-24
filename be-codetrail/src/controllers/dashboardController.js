const pool = require("../config/db");

const MAHASISWA_ROLE_ID = 3;
const DONE_STATUSES = ["done", "selesai"];

const getDashboardData = async (req, res) => {
  try {
    const statsResult = await pool.query(
      `
      SELECT
        (
          SELECT COUNT(*)::int
          FROM users
          WHERE id_role = $1
        ) AS total_mahasiswa,

        (
          SELECT COUNT(*)::int
          FROM puzzle
          WHERE COALESCE(is_event, false) = true
        ) AS total_event,

        (
          SELECT COUNT(*)::int
          FROM puzzle p
          LEFT JOIN progress_puzzle pp ON pp.id_puzzle = p.id_puzzle
          WHERE COALESCE(p.is_event, false) = false
            AND COALESCE(pp.status, 'not done') NOT IN ('done', 'selesai', 'locked')
        ) AS puzzle_pending,

        (
          SELECT COALESCE(ROUND(AVG(score))::int, 0)
          FROM progress_quiz pq
          INNER JOIN users u ON u.id_user = pq.id_user
          WHERE u.id_role = $1
            AND pq.status = ANY($2::text[])
            AND pq.score IS NOT NULL
        ) AS rata_rata_nilai,

        (
          SELECT COUNT(*)::int
          FROM progress_quiz pq
          INNER JOIN users u ON u.id_user = pq.id_user
          WHERE u.id_role = $1
            AND pq.status = ANY($2::text[])
        ) AS total_quiz_selesai,

        (
          SELECT COUNT(*)::int
          FROM progress_puzzle pp
          INNER JOIN users u ON u.id_user = pp.id_user
          WHERE u.id_role = $1
            AND pp.status = ANY($2::text[])
        ) AS total_puzzle_selesai,

        (
          SELECT COUNT(*)::int
          FROM progress_materi pm
          INNER JOIN users u ON u.id_user = pm.id_user
          WHERE u.id_role = $1
            AND pm.status = ANY($2::text[])
        ) AS total_materi_selesai
      `,
      [MAHASISWA_ROLE_ID, DONE_STATUSES],
    );

    const weeklyResult = await pool.query(
      `
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS tanggal
      ),
      activities AS (
        SELECT
          DATE(pm.updated_at) AS tanggal,
          COUNT(*)::int AS total
        FROM progress_materi pm
        INNER JOIN users u ON u.id_user = pm.id_user
        WHERE u.id_role = $1
          AND pm.status = ANY($2::text[])
          AND pm.updated_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(pm.updated_at)

        UNION ALL

        SELECT
          DATE(pq.updated_at) AS tanggal,
          COUNT(*)::int AS total
        FROM progress_quiz pq
        INNER JOIN users u ON u.id_user = pq.id_user
        WHERE u.id_role = $1
          AND pq.status = ANY($2::text[])
          AND pq.updated_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(pq.updated_at)

        UNION ALL

        SELECT
          DATE(pp.updated_at) AS tanggal,
          COUNT(*)::int AS total
        FROM progress_puzzle pp
        INNER JOIN users u ON u.id_user = pp.id_user
        WHERE u.id_role = $1
          AND pp.status = ANY($2::text[])
          AND pp.updated_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(pp.updated_at)
      )
      SELECT
        d.tanggal,
        TO_CHAR(d.tanggal, 'Dy') AS label,
        COALESCE(SUM(a.total), 0)::int AS total
      FROM days d
      LEFT JOIN activities a ON a.tanggal = d.tanggal
      GROUP BY d.tanggal
      ORDER BY d.tanggal ASC
      `,
      [MAHASISWA_ROLE_ID, DONE_STATUSES],
    );

    const recentResult = await pool.query(
  `
  SELECT *
  FROM (
    SELECT
      'materi' AS type,
      COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)) AS nama_user,
      CONCAT(
        COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)),
        ' menyelesaikan materi "',
        mt.judul_materi,
        '".'
      ) AS title,
      pm.updated_at AS created_at
    FROM progress_materi pm
    INNER JOIN users u ON u.id_user = pm.id_user
    INNER JOIN materi mt ON mt.id_materi = pm.id_materi
    WHERE u.id_role = $1
      AND pm.status = ANY($2::text[])
      AND pm.updated_at IS NOT NULL

    UNION ALL

    SELECT
      'quiz' AS type,
      COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)) AS nama_user,
      CONCAT(
        COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)),
        ' menyelesaikan quiz "',
        q.judul_quiz,
        '" dengan score ',
        COALESCE(pq.score, 0),
        '.'
      ) AS title,
      pq.updated_at AS created_at
    FROM progress_quiz pq
    INNER JOIN users u ON u.id_user = pq.id_user
    INNER JOIN quiz q ON q.id_quiz = pq.id_quiz
    WHERE u.id_role = $1
      AND pq.status = ANY($2::text[])
      AND pq.updated_at IS NOT NULL

    UNION ALL

    SELECT
      'puzzle' AS type,
      COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)) AS nama_user,
      CONCAT(
        COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)),
        ' menyelesaikan puzzle "',
        p.judul_puzzle,
        '".'
      ) AS title,
      pp.updated_at AS created_at
    FROM progress_puzzle pp
    INNER JOIN users u ON u.id_user = pp.id_user
    INNER JOIN puzzle p ON p.id_puzzle = pp.id_puzzle
    WHERE u.id_role = $1
      AND pp.status = ANY($2::text[])
      AND pp.updated_at IS NOT NULL
  ) recent
  ORDER BY recent.created_at DESC
  LIMIT 4
  `,
  [MAHASISWA_ROLE_ID, DONE_STATUSES],
);

    const topStudentsResult = await pool.query(
      `
      SELECT
        u.id_user,
        COALESCE(u.nama_user, u.email, CONCAT('User ', u.id_user)) AS name,
        COALESCE(u.total_score, u.exp, 0)::int AS total_score,
        COALESCE(u.level, 1)::int AS level
      FROM users u
      WHERE u.id_role = $1
      ORDER BY COALESCE(u.total_score, u.exp, 0) DESC, u.nama_user ASC
      LIMIT 5
      `,
      [MAHASISWA_ROLE_ID],
    );

    const stats = statsResult.rows[0] || {};

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total_mahasiswa: Number(stats.total_mahasiswa || 0),
          total_event: Number(stats.total_event || 0),
          puzzle_pending: Number(stats.puzzle_pending || 0),
          rata_rata_nilai: Number(stats.rata_rata_nilai || 0),
          total_quiz_selesai: Number(stats.total_quiz_selesai || 0),
          total_puzzle_selesai: Number(stats.total_puzzle_selesai || 0),
          total_materi_selesai: Number(stats.total_materi_selesai || 0),
        },
        weekly_activity: weeklyResult.rows.map((item) => ({
          tanggal: item.tanggal,
          label: item.label,
          total: Number(item.total || 0),
        })),
        recent_activity: recentResult.rows,
        top_students: topStudentsResult.rows,
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
  getDashboardData,
};