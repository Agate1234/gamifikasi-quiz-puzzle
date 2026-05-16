import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import MainLayout from "./layout/MainLayout.jsx";
import { decryptData } from "./components/global/Formatter";

function getRole(session) {
  const localRole = localStorage.getItem("role");

  const role =
    localRole ||
    session?.user?.kd_role ||
    session?.user?.nama_role ||
    session?.user?.role ||
    session?.kd_role ||
    session?.nama_role ||
    session?.role ||
    "";

  const roleText = String(role).toLowerCase();

  const idRole =
    Number(localRole) ||
    Number(session?.user?.id_role) ||
    Number(session?.id_role) ||
    Number(session?.role_id) ||
    Number(session?.user?.role_id);

  if (roleText.includes("mahasiswa")) return "mahasiswa";
  if (roleText.includes("dosen")) return "dosen";
  if (roleText.includes("admin")) return "admin";

  if (Number(idRole) === 3) return "mahasiswa";
  if (Number(idRole) === 2) return "dosen";
  if (Number(idRole) === 1) return "admin";

  return "guest";
}

const mahasiswaAllowedPaths = [
  "/dashboard/roadmap",
  "/dashboard/achievement",
  "/dashboard/leaderboard",
];

export default function ProtectedRoute() {
  const location = useLocation();
  const sessionRaw = localStorage.getItem("session");
  const session = sessionRaw ? decryptData(sessionRaw) : null;

  const isAuthed = !!session?.token && session?.auth === true;

  if (!isAuthed) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  const role = getRole(session);
  const isMahasiswa = role === "mahasiswa";

  if (location.pathname === "/dashboard") {
    if (isMahasiswa) {
      return <Navigate to="/dashboard/roadmap" replace />;
    }

    return <Navigate to="/dashboard/home" replace />;
  }

  if (isMahasiswa) {
    const canAccess = mahasiswaAllowedPaths.some(
      (path) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`),
    );

    if (!canAccess) {
      return <Navigate to="/dashboard/roadmap" replace />;
    }
  }

  return (
    <MainLayout session={session}>
      <Outlet />
    </MainLayout>
  );
}
