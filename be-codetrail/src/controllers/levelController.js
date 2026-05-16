const pool = require("../config/db");
const { getLevelInfo, syncUserLevel } = require("../helper/leveling");

const getUserLevel = async (req, res) => {
  const client = await pool.connect();

  try {
    const idUser = req.params.id_user || req.query.id_user;

    if (!idUser) {
      return res.status(400).json({
        success: false,
        message: "id_user wajib diisi",
      });
    }

    const userResult = await client.query(
      `
      SELECT
        id_user,
        nama_user,
        email,
        COALESCE(level, 1)::int AS level,
        COALESCE(exp, 0)::int AS exp,
        COALESCE(total_score, 0)::int AS total_score,
        COALESCE(no_badge, '{}'::integer[]) AS no_badge
      FROM users
      WHERE id_user = $1
      LIMIT 1
      `,
      [idUser],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const synced = await syncUserLevel(client, idUser);
    const levelInfo = getLevelInfo(synced.user.exp);

    return res.status(200).json({
      success: true,
      data: {
        user: synced.user,
        level_info: levelInfo,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getUserLevel,
};