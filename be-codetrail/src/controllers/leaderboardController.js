const pool = require("../config/db");
const { getLevelInfo } = require("../helper/leveling");

const normalizeBadgeIds = (value) => {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => parseInt(item, 10))
        .filter((item) => !Number.isNaN(item)),
    ),
  ].sort((a, b) => a - b);
};

const getLeaderboard = async (req, res) => {
  try {
    const mode = req.query.mode === "exp" ? "exp" : "level";
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);

    const orderBy =
      mode === "exp"
        ? `
          COALESCE(u.exp, 0) DESC,
          COALESCE(u.level, 1) DESC,
          u.id_user ASC
        `
        : `
          COALESCE(u.level, 1) DESC,
          COALESCE(u.exp, 0) DESC,
          u.id_user ASC
        `;

    const result = await pool.query(
      `
      SELECT
        u.id_user,
        u.nama_user,
        u.email,
        COALESCE(u.level, 1)::int AS level,
        COALESCE(u.exp, 0)::int AS exp,
        COALESCE(u.total_score, 0)::int AS total_score,
        COALESCE(u.no_badge, '{}'::integer[]) AS no_badge,
        r.id_role,
        r.nama_role,
        r.kd_role
      FROM users u
      JOIN roles r ON r.id_role = u.id_role
      WHERE
        LOWER(COALESCE(r.kd_role, '')) = 'mhs'
        OR LOWER(COALESCE(r.kd_role, '')) LIKE '%mahasiswa%'
        OR LOWER(COALESCE(r.nama_role, '')) LIKE '%mahasiswa%'
        OR u.id_role = 3
      ORDER BY ${orderBy}
      LIMIT $1
      `,
      [limit],
    );

    const data = result.rows.map((item, index) => {
      const badgeIds = normalizeBadgeIds(item.no_badge);
      const levelInfo = getLevelInfo(item.exp);

      return {
        rank: index + 1,
        id_user: item.id_user,
        nama_user: item.nama_user,
        email: item.email,
        level: item.level,
        exp: item.exp,
        total_exp: item.exp,
        total_score: item.total_score,
        no_badge: badgeIds,
        total_badge: badgeIds.length,
        nama_role: item.nama_role,
        kd_role: item.kd_role,
        level_info: levelInfo,
      };
    });

    return res.status(200).json({
      success: true,
      message:
        mode === "exp"
          ? "Leaderboard berdasarkan total EXP berhasil diambil"
          : "Leaderboard berdasarkan level berhasil diambil",
      mode,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};

module.exports = {
  getLeaderboard,
};