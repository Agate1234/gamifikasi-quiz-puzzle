import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import MainLayout from "./layout/MainLayout.jsx";
import { decryptData } from "./components/global/Formatter";

const decodeLocalValue = (raw) => {
  try {
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    try {
      return JSON.parse(atob(raw));
    } catch {
      return null;
    }
  }
};

const getEncryptedLocal = (key, fallback = "") => {
  const decoded = decodeLocalValue(localStorage.getItem(key));
  return decoded ?? fallback;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function getRole(session) {
  const encryptedRole = getEncryptedLocal("ct_role", "");
  const plainRole = localStorage.getItem("role") || "";

  const roleText = String(
    session?.data?.nama_role ||
      session?.data?.kd_role ||
      session?.data?.role ||
      session?.user?.nama_role ||
      session?.user?.kd_role ||
      session?.user?.role ||
      session?.nama_role ||
      session?.kd_role ||
      session?.role ||
      "",
  ).toLowerCase();

  const idRole =
    toNumber(encryptedRole) ||
    toNumber(plainRole) ||
    toNumber(session?.data?.id_role) ||
    toNumber(session?.data?.role_id) ||
    toNumber(session?.user?.id_role) ||
    toNumber(session?.user?.role_id) ||
    toNumber(session?.id_role) ||
    toNumber(session?.role_id);

  if (roleText.includes("mahasiswa") || roleText.includes("mhs")) {
    return "mahasiswa";
  }

  if (roleText.includes("dosen")) return "dosen";
  if (roleText.includes("admin")) return "admin";

  if (idRole === 3) return "mahasiswa";
  if (idRole === 2) return "dosen";
  if (idRole === 1) return "admin";

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
