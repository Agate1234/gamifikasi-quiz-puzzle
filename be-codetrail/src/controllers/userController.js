const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          u.id_user,
          u.nama_user,
          u.email,
          u.no_badge,
          u.id_role,
          u.level,
          u.exp,
          u.total_score,
          r.nama_role,
          r.kd_role
       FROM users u
       JOIN roles r ON u.id_role = r.id_role
       ORDER BY u.id_user ASC`,
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
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
      `SELECT 
          u.id_user,
          u.nama_user,
          u.email,
          u.no_badge,
          u.id_role,
          u.level,
          u.exp,
          u.total_score,
          r.nama_role,
          r.kd_role
       FROM users u
       JOIN roles r ON u.id_role = r.id_role
       WHERE u.id_user = $1`,
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

    if (!nama_user || !email || !password || !id_role) {
      return res.status(400).json({
        success: false,
        message: "nama_user, email, password, dan id_role wajib diisi",
      });
    }

    const checkEmail = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
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
      `INSERT INTO users (nama_user, email, password, no_badge, id_role)
   VALUES ($1, $2, $3, $4::integer[], $5)
   RETURNING id_user, nama_user, email, no_badge, id_role`,
      [
        nama_user,
        email,
        hashedPassword,
        Array.isArray(no_badge) ? no_badge : [],
        id_role,
      ],
    );

    const newUser = result.rows[0];
    const idUser = newUser.id_user;

    // 0. Progress modul
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

    // 1. Progress materi
    await client.query(
      `
  INSERT INTO progress_materi (id_user, id_materi, is_unlock, status)
  SELECT
    $1,
    m.id_materi,
    true,
    'not done'
  FROM materi m
  ORDER BY m.id_materi ASC
  ON CONFLICT DO NOTHING
  `,
      [idUser],
    );

    // 2. Progress puzzle
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

    // 3. Progress quiz
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
  try {
    const { id } = req.params;
    const { nama, email, password, id: customId, no_badge, id_role } = req.body;

    const userCheck = await pool.query(
      "SELECT * FROM users WHERE id_user = $1",
      [id],
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const oldUser = userCheck.rows[0];
    let finalPassword = oldUser.password;

    if (password) {
      finalPassword = await bcrypt.hash(password, 10);
    }

    const finalBadge = Array.isArray(no_badge)
      ? no_badge
      : oldUser.no_badge || [];

    const result = await pool.query(
      `UPDATE users
   SET nama_user = $1,
       email = $2,
       password = $3,
       no_badge = $4::integer[],
       id_role = $5
   WHERE id_user = $6
   RETURNING id_user, nama_user, email, no_badge, id_role`,
      [
        nama_user || oldUser.nama_user,
        email || oldUser.email,
        finalPassword,
        finalBadge,
        id_role || oldUser.id_role,
        id,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id_user = $1 RETURNING *",
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
      message: "User berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
