const authMiddleware = async (req, res, next) => {
  console.log("=== AUTH MIDDLEWARE AKTIF ===", req.method, req.originalUrl);
  console.log("FILE AUTH:", __filename);

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Format token harus Bearer <token>",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const jwtSecret = process.env.JWT_SECRET?.trim();

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET belum diset",
      });
    }

    console.log("VERIFY JWT_SECRET:", jwtSecret);
    console.log("VERIFY JWT_SECRET LENGTH:", jwtSecret.length);
    console.log("TOKEN MASUK:", token);

    const { jwtVerify } = await import("jose");

    const secret = new TextEncoder().encode(jwtSecret);

    const { payload } = await jwtVerify(token, secret);

    req.user = payload;

    next();
  } catch (error) {
    console.log("JWT VERIFY ERROR:", error.name, error.message);

    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;