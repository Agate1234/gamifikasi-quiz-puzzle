const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const { nama_user, email, password, no_badge, id_role } = req.body;

    if (!nama_user || !email || !password || !id_role) {
      return res.status(400).json({
        success: false,
        message: "nama_user, email, password, dan id_role wajib diisi",
      });
    }

    await client.query("BEGIN");

    const checkEmail = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (checkEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    const checkRole = await client.query(
      "SELECT * FROM roles WHERE id_role = $1",
      [id_role],
    );

    if (checkRole.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Role tidak ditemukan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (nama_user, email, password, no_badge, id_role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_user, nama_user, email, no_badge, id_role`,
      [nama_user, email, hashedPassword, no_badge || null, id_role],
    );

    const newUser = userResult.rows[0];

    const modulResult = await client.query(
      `SELECT id_modul
       FROM modul
       ORDER BY id_modul ASC`,
    );

    if (modulResult.rows.length > 0) {
      const values = [];
      const placeholders = [];

      modulResult.rows.forEach((modul, index) => {
        const baseIndex = index * 2;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2})`);
        values.push(newUser.id_user, modul.id_modul);
      });

      await client.query(
        `INSERT INTO progress_modul (id_user, id_modul)
         VALUES ${placeholders.join(", ")}`,
        values,
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Register berhasil",
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const result = await pool.query(
      `SELECT 
          u.id_user,
          u.nama_user,
          u.email,
          u.password,
          u.no_badge,
          u.id_role,
          u.level,
          u.exp,
          u.total_score,
          r.nama_role,
          r.kd_role
       FROM users u
       JOIN roles r ON u.id_role = r.id_role
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email tidak ditemukan",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password salah",
      });
    }

    const { SignJWT } = await import("jose");

const payload = {
  id_user: Number(user.id_user),
  email: user.email,
  id_role: Number(user.id_role),
};

const jwtSecret = process.env.JWT_SECRET?.trim();

if (!jwtSecret) {
  return res.status(500).json({
    success: false,
    message: "JWT_SECRET belum diset",
  });
}

console.log("LOGIN JWT_SECRET:", jwtSecret);
console.log("LOGIN JWT_SECRET LENGTH:", jwtSecret.length);

const secret = new TextEncoder().encode(jwtSecret);

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("1d")
  .sign(secret);

delete user.password;

return res.status(200).json({
  success: true,
  message: "Login berhasil",
  token,
  data: user,
});
  } catch (error) {
    console.log("LOGIN ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const me = async (req, res) => {
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
       WHERE u.id_user = $1`,
      [req.user.id_user],
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

module.exports = {
  register,
  login,
  me,
  logout,
};
