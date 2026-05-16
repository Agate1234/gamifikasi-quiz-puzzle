import React from "react";
import { Breadcrumb } from "antd";
import { useLocation } from "react-router-dom";

function routeLabel(pathname) {
  if (pathname.includes("/dashboard/home")) return ["Dashboard"];
  if (pathname.includes("/dashboard/modul")) return ["Dashboard", "Manage Modul"];
  if (pathname.includes("/dashboard/materi")) return ["Dashboard", "Manage Materi"];
  if (pathname.includes("/dashboard/quiz")) return ["Dashboard", "Manage Quiz"];
  if (pathname.includes("/dashboard/soal")) return ["Dashboard", "Manage Soal"];
  if (pathname.includes("/dashboard/puzzle")) return ["Dashboard", "Manage Puzzle"];
  if (pathname.includes("/dashboard/events")) return ["Dashboard", "Manage Event"];
  if (pathname.includes("/dashboard/progress")) return ["Dashboard", "Progress"];
  if (pathname.includes("/dashboard/results")) return ["Dashboard", "Hasil"];
  if (pathname.includes("/dashboard/users")) return ["Dashboard", "Manage User"];
  if (pathname.includes("/dashboard/student/roadmap")) return ["Mahasiswa", "Roadmap"];
  if (pathname.includes("/dashboard/student/badges")) return ["Mahasiswa", "Badge"];
  if (pathname.includes("/dashboard/student/leaderboard")) return ["Mahasiswa", "Leaderboard"];
  return ["Dashboard"];
}

export default function LayoutBreadcrumb() {
  const location = useLocation();
  const items = routeLabel(location.pathname).map((title) => ({ title }));
  return <Breadcrumb items={items} />;
}