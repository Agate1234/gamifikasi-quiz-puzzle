const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const isMp4File = (file) => {
  if (!file) return true;

  const ext = path
    .extname(file.originalname || file.filename || "")
    .toLowerCase();
  const mimetype = String(file.mimetype || "").toLowerCase();

  return ext === ".mp4" || mimetype === "video/mp4";
};

const deleteUploadedFile = (filename) => {
  if (!filename) return;

  const filePath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getAllMateri = async (req, res) => {
  try {
    let { page = 1, limit = 10, q = "" } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;
    const search = `%${String(q || "").trim()}%`;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM materi m
       JOIN modul mo ON m.id_modul = mo.id_modul
       WHERE m.judul_materi ILIKE $1
          OR m.deskripsi_materi ILIKE $1
          OR COALESCE(m.markdown_materi, '') ILIKE $1
          OR mo.judul ILIKE $1`,
      [search],
    );

    const total = parseInt(countResult.rows[0].total, 10);

    const result = await pool.query(
      `SELECT 
          m.id_materi,
          m.judul_materi,
          m.deskripsi_materi,
          m.markdown_materi,
          m.exp_materi,
          m.link,
          m.file_materi,
          m.tipe_file,
          m.id_modul,
          mo.judul AS judul_modul,
          m.created_by,
          m.created_at,
          m.updated_by,
          m.updated_at
       FROM materi m
       JOIN modul mo ON m.id_modul = mo.id_modul
       WHERE m.judul_materi ILIKE $1
          OR m.deskripsi_materi ILIKE $1
          OR COALESCE(m.markdown_materi, '') ILIKE $1
          OR mo.judul ILIKE $1
       ORDER BY m.id_materi ASC
       LIMIT $2 OFFSET $3`,
      [search, limit, offset],
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      paging: {
        page,
        limit,
        total,
        page_total: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMateriById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
          m.id_materi,
          m.judul_materi,
          m.deskripsi_materi,
          m.markdown_materi,
          m.exp_materi,
          m.link,
          m.file_materi,
          m.tipe_file,
          m.id_modul,
          mo.judul AS judul_modul,
          m.created_by,
          m.created_at,
          m.updated_by,
          m.updated_at
       FROM materi m
       JOIN modul mo ON m.id_modul = mo.id_modul
       WHERE m.id_materi = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Materi tidak ditemukan",
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

const createMateri = async (req, res) => {
  try {
    const {
      judul_materi,
      deskripsi_materi,
      markdown_materi,
      exp_materi,
      link,
      id_modul,
    } = req.body;

    let namaUser = req.body.created_by || "Admin";

    if (req.user?.id_user) {
      const userResult = await pool.query(
        "SELECT nama_user FROM users WHERE id_user = $1",
        [req.user.id_user],
      );

      if (userResult.rows.length > 0) {
        namaUser = userResult.rows[0].nama_user;
      }
    }

    if (!judul_materi || !id_modul || exp_materi === undefined) {
      if (req.file) deleteUploadedFile(req.file.filename);

      return res.status(400).json({
        success: false,
        message: "judul_materi, id_modul, dan exp_materi wajib diisi",
      });
    }

    if (req.file && !isMp4File(req.file)) {
      deleteUploadedFile(req.file.filename);

      return res.status(400).json({
        success: false,
        message:
          "File materi hanya boleh video MP4. PDF sudah tidak digunakan.",
      });
    }

    const modulResult = await pool.query(
      "SELECT id_modul FROM modul WHERE id_modul = $1",
      [id_modul],
    );

    if (modulResult.rows.length === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);

      return res.status(404).json({
        success: false,
        message: "Modul tidak ditemukan",
      });
    }
    
    const fileMateri = req.file ? req.file.filename : null;
    const tipeFile = req.file ? "mp4" : null;

    const result = await pool.query(
      `INSERT INTO materi (
          judul_materi,
          deskripsi_materi,
          markdown_materi,
          exp_materi,
          link,
          file_materi,
          tipe_file,
          id_modul,
          created_by,
          updated_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        judul_materi,
        deskripsi_materi || null,
        markdown_materi || null,
        exp_materi,
        link || null,
        fileMateri,
        tipeFile,
        id_modul,
        namaUser,
        null,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Materi berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    if (req.file) deleteUploadedFile(req.file.filename);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMateri = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      judul_materi,
      deskripsi_materi,
      markdown_materi,
      exp_materi,
      link,
      id_modul,
      hapus_file,
    } = req.body;

    if (!req.user || !req.user.id_user) {
      if (req.file) deleteUploadedFile(req.file.filename);

      return res.status(401).json({
        success: false,
        message: "User login tidak ditemukan di token",
      });
    }

    if (req.file && !isMp4File(req.file)) {
      deleteUploadedFile(req.file.filename);

      return res.status(400).json({
        success: false,
        message:
          "File materi hanya boleh video MP4. PDF sudah tidak digunakan.",
      });
    }

    const checkMateri = await pool.query(
      "SELECT * FROM materi WHERE id_materi = $1",
      [id],
    );

    if (checkMateri.rows.length === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);

      return res.status(404).json({
        success: false,
        message: "Materi tidak ditemukan",
      });
    }

    const oldMateri = checkMateri.rows[0];

    const userResult = await pool.query(
      "SELECT nama_user FROM users WHERE id_user = $1",
      [req.user.id_user],
    );

    if (userResult.rows.length === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);

      return res.status(404).json({
        success: false,
        message: "User login tidak ditemukan",
      });
    }

    const finalIdModul = id_modul ?? oldMateri.id_modul;

    const modulResult = await pool.query(
      "SELECT id_modul FROM modul WHERE id_modul = $1",
      [finalIdModul],
    );

    if (modulResult.rows.length === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);

      return res.status(404).json({
        success: false,
        message: "Modul tidak ditemukan",
      });
    }

    const shouldDeleteOldFile =
      String(hapus_file || "").toLowerCase() === "true";

    let newFileMateri = oldMateri.file_materi;
    let newTipeFile = oldMateri.tipe_file;

    if (shouldDeleteOldFile) {
      deleteUploadedFile(oldMateri.file_materi);
      newFileMateri = null;
      newTipeFile = null;
    }

    if (req.file) {
      deleteUploadedFile(oldMateri.file_materi);
      newFileMateri = req.file.filename;
      newTipeFile = "mp4";
    }

    const namaUser = userResult.rows[0].nama_user;

    const result = await pool.query(
      `UPDATE materi
       SET judul_materi = $1,
           deskripsi_materi = $2,
           markdown_materi = $3,
           exp_materi = $4,
           link = $5,
           file_materi = $6,
           tipe_file = $7,
           id_modul = $8,
           updated_by = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_materi = $10
       RETURNING *`,
      [
        judul_materi ?? oldMateri.judul_materi,
        deskripsi_materi ?? oldMateri.deskripsi_materi,
        markdown_materi ?? oldMateri.markdown_materi,
        exp_materi ?? oldMateri.exp_materi,
        link ?? oldMateri.link,
        newFileMateri,
        newTipeFile,
        finalIdModul,
        namaUser,
        id,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Materi berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    if (req.file) deleteUploadedFile(req.file.filename);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMateri = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM materi WHERE id_materi = $1 RETURNING *",
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Materi tidak ditemukan",
      });
    }

    deleteUploadedFile(result.rows[0].file_materi);

    return res.status(200).json({
      success: true,
      message: "Materi berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const viewMateriFile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id_materi, judul_materi, file_materi, tipe_file
       FROM materi
       WHERE id_materi = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Materi tidak ditemukan",
      });
    }

    const materi = result.rows[0];

    if (!materi.file_materi) {
      return res.status(404).json({
        success: false,
        message: "Video materi tidak tersedia",
      });
    }

    const filePath = path.join(UPLOAD_DIR, materi.file_materi);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File tidak ditemukan di server",
      });
    }

    const ext = path.extname(materi.file_materi).toLowerCase();
    const tipeFile = String(materi.tipe_file || "").toLowerCase();

    if (ext !== ".mp4" && tipeFile !== "mp4" && tipeFile !== "video/mp4") {
      return res.status(415).json({
        success: false,
        message: "Preview file hanya mendukung video MP4.",
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start >= fileSize) {
        res.writeHead(416, {
          "Content-Range": `bytes */${fileSize}`,
        });
        return res.end();
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
        "Content-Disposition": "inline",
      });

      return stream.pipe(res);
    }

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Content-Disposition": "inline",
    });

    return fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllMateri,
  getMateriById,
  createMateri,
  updateMateri,
  deleteMateri,
  viewMateriFile,
};
