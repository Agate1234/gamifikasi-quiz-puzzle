const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const allowedGameRoles = [
  "assassin",
  "seer",
  "marauder",
  "spectator",
  "criminal",
  "prisoner",
  "warrior",
  "reader",
  "hunter",
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const getAllUsers = async (req, res) => {
  try {
    const { q = "", role = "" } = req.query;

    const search = `%${String(q || "").trim()}%`;
    const roleFilter = String(role || "").trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT 
        u.id_user AS id,
        u.id_user,
        u.nama_user AS name,
        u.nama_user,
        u.email,
        u.no_badge,
        u.id_role,
        u.game_role,
        u.level,
        u.exp,
        u.total_score,
        r.nama_role AS role,
        r.nama_role,
        r.kd_role
      FROM users u
      JOIN roles r ON u.id_role = r.id_role
      WHERE (
        u.nama_user ILIKE $1
        OR u.email ILIKE $1
        OR CAST(u.id_user AS TEXT) ILIKE $1
        OR r.nama_role ILIKE $1
        OR r.kd_role ILIKE $1
      )
      AND (
        $2 = ''
        OR LOWER(r.nama_role) = $2
        OR LOWER(r.kd_role) = $2
      )
      ORDER BY u.id_user ASC
      `,
      [search, roleFilter],
    );

    const total = result.rows.length;

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua data user",
      data: result.rows,
      paging: {
        page: 1,
        limit: 10,
        total,
        page_total: Math.max(1, Math.ceil(total / 10)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        u.id_user AS id,
        u.id_user,
        u.nama_user AS name,
        u.nama_user,
        u.email,
        u.no_badge,
        u.id_role,
        u.game_role,
        u.level,
        u.exp,
        u.total_score,
        r.nama_role AS role,
        r.nama_role,
        r.kd_role
      FROM users u
      JOIN roles r ON u.id_role = r.id_role
      WHERE u.id_user = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
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

const createUser = async (req, res) => {
  const client = await pool.connect();

  try {
    const { nama_user, email, password, no_badge, id_role } = req.body;

    const finalNama = normalizeText(nama_user);
    const finalEmail = normalizeText(email).toLowerCase();

    if (!finalNama || !finalEmail || !password || !id_role) {
      return res.status(400).json({
        success: false,
        message: "nama_user, email, password, dan id_role wajib diisi",
      });
    }

    if (![2, 3].includes(Number(id_role))) {
      return res.status(400).json({
        success: false,
        message: "Admin hanya dapat menambahkan role Dosen atau Mahasiswa",
      });
    }

    const checkEmail = await client.query(
      "SELECT id_user FROM users WHERE LOWER(email) = LOWER($1)",
      [finalEmail],
    );

    if (checkEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO users (
        nama_user,
        email,
        password,
        no_badge,
        id_role,
        game_role
      )
      VALUES ($1, $2, $3, $4::integer[], $5, NULL)
      RETURNING 
        id_user AS id,
        id_user, 
        nama_user AS name,
        nama_user, 
        email, 
        no_badge, 
        id_role,
        game_role,
        level,
        exp,
        total_score
      `,
      [
        finalNama,
        finalEmail,
        hashedPassword,
        Array.isArray(no_badge) ? no_badge : [],
        Number(id_role),
      ],
    );

    const newUser = result.rows[0];
    const idUser = newUser.id_user;

    await client.query(
      `
      INSERT INTO progress_modul (id_user, id_modul, is_unlock)
      SELECT
        $1,
        m.id_modul,
        CASE
          WHEN m.id_modul = first_modul.id_modul THEN true
          ELSE false
        END AS is_unlock
      FROM modul m
      CROSS JOIN (
        SELECT id_modul
        FROM modul
        ORDER BY id_modul ASC
        LIMIT 1
      ) first_modul
      ORDER BY m.id_modul ASC
      ON CONFLICT DO NOTHING
      `,
      [idUser],
    );

    await client.query(
      `
      INSERT INTO progress_materi (id_user, id_materi, is_unlock, status)
      SELECT
        $1,
        m.id_materi,
        CASE
          WHEN m.id_materi = first_materi.id_materi THEN true
          ELSE false
        END AS is_unlock,
        CASE
          WHEN m.id_materi = first_materi.id_materi THEN 'not done'
          ELSE 'locked'
        END AS status
      FROM materi m
      CROSS JOIN (
        SELECT id_materi
        FROM materi
        ORDER BY id_materi ASC
        LIMIT 1
      ) first_materi
      ORDER BY m.id_materi ASC
      ON CONFLICT DO NOTHING
      `,
      [idUser],
    );

    await client.query(
      `
      INSERT INTO progress_puzzle (id_user, id_puzzle, is_unlock, status)
      SELECT
        $1,
        p.id_puzzle,
        CASE
          WHEN p.id_puzzle = first_puzzle.id_puzzle THEN true
          ELSE false
        END AS is_unlock,
        CASE
          WHEN p.id_puzzle = first_puzzle.id_puzzle THEN 'not done'
          ELSE 'locked'
        END AS status
      FROM puzzle p
      CROSS JOIN (
        SELECT id_puzzle
        FROM puzzle
        WHERE COALESCE(is_event, false) = false
        ORDER BY id_puzzle ASC
        LIMIT 1
      ) first_puzzle
      WHERE COALESCE(p.is_event, false) = false
      ORDER BY p.id_puzzle ASC
      ON CONFLICT DO NOTHING
      `,
      [idUser],
    );

    await client.query(
      `
      INSERT INTO progress_quiz (id_user, id_quiz, is_unlock, status)
      SELECT
        $1,
        q.id_quiz,
        CASE
          WHEN q.id_quiz = first_quiz.id_quiz THEN true
          ELSE false
        END AS is_unlock,
        CASE
          WHEN q.id_quiz = first_quiz.id_quiz THEN 'not done'
          ELSE 'locked'
        END AS status
      FROM quiz q
      CROSS JOIN (
        SELECT id_quiz
        FROM quiz
        WHERE COALESCE(is_event, false) = false
        ORDER BY id_quiz ASC
        LIMIT 1
      ) first_quiz
      WHERE COALESCE(q.is_event, false) = false
      ORDER BY q.id_quiz ASC
      ON CONFLICT DO NOTHING
      `,
      [idUser],
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "User berhasil ditambahkan beserta progress awal",
      data: newUser,
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

const updateUser = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      nama_user,
      nama,
      email,
      password,
      no_badge,
      id_role,
      game_role,
    } = req.body;

    await client.query("BEGIN");

    const userCheck = await client.query(
      `
      SELECT 
        id_user,
        nama_user,
        email,
        password,
        no_badge,
        id_role,
        game_role
      FROM users 
      WHERE id_user = $1
      FOR UPDATE
      `,
      [id],
    );

    if (userCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const oldUser = userCheck.rows[0];

    const finalNama = normalizeText(nama_user || nama) || oldUser.nama_user;
    const finalEmailInput = normalizeText(email).toLowerCase();
    const finalEmail = finalEmailInput || oldUser.email;

    if (finalEmailInput && finalEmailInput !== oldUser.email) {
      const emailCheck = await client.query(
        `
        SELECT id_user 
        FROM users 
        WHERE LOWER(email) = LOWER($1) 
          AND id_user <> $2
        `,
        [finalEmailInput, id],
      );

      if (emailCheck.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Email sudah digunakan oleh user lain",
        });
      }
    }

    let finalPassword = oldUser.password;

    if (password && String(password).trim().length > 0) {
      if (String(password).trim().length < 6) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Password minimal 6 karakter",
        });
      }

      finalPassword = await bcrypt.hash(String(password), 10);
    }

    const finalBadge = Array.isArray(no_badge)
      ? no_badge
      : oldUser.no_badge || [];

    const finalSystemRole = id_role ? Number(id_role) : oldUser.id_role;

    if (![2, 3].includes(Number(finalSystemRole))) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Admin hanya dapat mengubah role menjadi Dosen atau Mahasiswa",
      });
    }

    let finalGameRole = oldUser.game_role;

    if (game_role !== undefined && game_role !== null && game_role !== "") {
      const cleanGameRole = String(game_role).trim().toLowerCase();

      if (!allowedGameRoles.includes(cleanGameRole)) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Game role tidak valid",
        });
      }

      if (oldUser.game_role && oldUser.game_role !== cleanGameRole) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Role game hanya bisa dipilih satu kali dan tidak bisa diubah",
        });
      }

      finalGameRole = cleanGameRole;
    }

    const result = await client.query(
      `
      UPDATE users
      SET nama_user = $1,
          email = $2,
          password = $3,
          no_badge = $4::integer[],
          id_role = $5,
          game_role = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id_user = $7
      RETURNING 
        id_user AS id,
        id_user, 
        nama_user AS name,
        nama_user, 
        email, 
        no_badge, 
        id_role,
        game_role,
        level,
        exp,
        total_score
      `,
      [
        finalNama,
        finalEmail,
        finalPassword,
        finalBadge,
        finalSystemRole,
        finalGameRole,
        id,
      ],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "User berhasil diupdate",
      data: result.rows[0],
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

const deleteUser = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const userCheck = await client.query(
      "SELECT id_user FROM users WHERE id_user = $1",
      [id],
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    await client.query("BEGIN");

    await client.query("DELETE FROM progress_materi WHERE id_user = $1", [id]);
    await client.query("DELETE FROM progress_quiz WHERE id_user = $1", [id]);
    await client.query("DELETE FROM progress_puzzle WHERE id_user = $1", [id]);
    await client.query("DELETE FROM progress_modul WHERE id_user = $1", [id]);

    await client.query("DELETE FROM users WHERE id_user = $1", [id]);

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "User berhasil dihapus",
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
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};