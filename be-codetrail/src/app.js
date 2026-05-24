const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");
const userRoutes = require("./routes/userRoutes");
const modulRoutes = require("./routes/modulRoutes");
const materiRoutes = require("./routes/materiRoutes");
const quizRoutes = require("./routes/quizRoutes");
const soalRoutes = require("./routes/soalRoutes");
const puzzleRoutes = require("./routes/puzzleRoutes");
const mapRoutes = require("./routes/mapRoutes");
const mapMateriRoutes = require("./routes/mapMateriRoutes");
const mapQuizRoutes = require("./routes/mapQuizRoutes");
const soalMahasiswaRoutes = require("./routes/soalMahasiswaRoutes");
const mapPuzzleRoutes = require("./routes/mapPuzzleRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const levelRoutes = require("./routes/levelRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const codeRunnerRoutes = require("./routes/codeRunnerRoutes");
const adminProgressMahasiswaRoutes = require("./routes/progressMahasiswaRoutes");
const hasilMahasiswaRoutes = require("./routes/hasilMahasiswaRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/modul", modulRoutes);
app.use("/api/materi", materiRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/soal", soalRoutes);
app.use("/api/puzzle", puzzleRoutes);
app.use("/api/roadmap", mapRoutes);
app.use("/api/roadmap/materi-map", mapMateriRoutes);
app.use("/api/roadmap/quiz-map", mapQuizRoutes);
app.use("/api/roadmap/quiz-map/quiz", soalMahasiswaRoutes);
app.use("/api/roadmap/puzzle-map", mapPuzzleRoutes);
app.use("/api/achievement", achievementRoutes);
app.use("/api/level", levelRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/code-runner", codeRunnerRoutes);
app.use("/api/progress-mahasiswa", adminProgressMahasiswaRoutes);
app.use("/api/hasil-mahasiswa", hasilMahasiswaRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;
