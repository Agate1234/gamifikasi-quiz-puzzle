const pool = require("../config/db");

const getAllRoles = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM roles ORDER BY id_role ASC"
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

// const createRole = async (req, res) => {
//   try {
//     const { nama_role, kd_role } = req.body;

//     if (!nama_role || !kd_role) {
//       return res.status(400).json({
//         success: false,
//         message: "nama_role dan kd_role wajib diisi",
//       });
//     }

//     const checkKode = await pool.query(
//       "SELECT * FROM roles WHERE kd_role = $1",
//       [kd_role]
//     );

//     if (checkKode.rows.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Kode role sudah ada",
//       });
//     }

//     const result = await pool.query(
//       `INSERT INTO roles (nama_role, kd_role)
//        VALUES ($1, $2)
//        RETURNING *`,
//       [nama_role, kd_role]
//     );

//     return res.status(201).json({
//       success: true,
//       message: "Role berhasil ditambahkan",
//       data: result.rows[0],
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

module.exports = {
  getAllRoles,
};