import React from "react";
import { ConfigProvider } from "antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { antdTheme } from "./theme/antdTheme.js";

import SignIn from "./pages/auth/SignIn.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import Dashboard from "./pages/dashboard/IndexDashboard.jsx";
import Modules from "./pages/modul/IndexModul.jsx";
import Materi from "./pages/materi/IndexMateri.jsx";
import ManageQuiz from "./pages/quiz/IndexQuiz.jsx";
import ManageSoal from "./pages/soal/IndexSoal.jsx";
import ManagePuzzle from "./pages/puzzle/IndexPuzzle.jsx";
import ManageEvent from "./pages/event/IndexEvent.jsx";
import ProgressMahasiswa from "./pages/progress/IndexProgress.jsx";
import HasilMahasiswa from "./pages/hasil/IndexHasil.jsx";
import ManageUser from "./pages/user/IndexUser.jsx";
import RoadmapMahasiswa from "./pages/roadmap/IndexRoadmap.jsx";
import AchievementMahasiswa from "./pages/achievement/IndexAchievement";
import IndexLeaderboard from "./pages/leaderboard/IndexLeaderboard.jsx";

export default function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />

          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="home" replace />} />

            <Route path="home" element={<Dashboard />} />
            <Route path="modul" element={<Modules />} />
            <Route path="materi" element={<Materi />} />
            <Route path="quiz" element={<ManageQuiz />} />
            <Route path="soal" element={<ManageSoal />} />
            <Route path="puzzle" element={<ManagePuzzle />} />
            <Route path="events" element={<ManageEvent />} />
            <Route path="progress" element={<ProgressMahasiswa />} />
            <Route path="results" element={<HasilMahasiswa />} />
            <Route path="users" element={<ManageUser />} />

            <Route path="roadmap" element={<RoadmapMahasiswa />} />
            <Route path="achievement" element={<AchievementMahasiswa />} />
            <Route path="leaderboard" element={<IndexLeaderboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
