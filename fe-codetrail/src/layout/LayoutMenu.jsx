import React from "react";
import { Menu } from "antd";
import { Link, useLocation } from "react-router-dom";

const LayoutMenu = () => {
  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const selectedMenu = pathParts[pathParts.length - 1] || "home";

  const items = [
    {
      key: "home",
      label: <Link to="/dashboard/home">Dashboard</Link>,
    },

    {
      key: "admin-menu",
      label: "Admin / Dosen",
      children: [
        { key: "modul", label: <Link to="/dashboard/modul">Manage Modul</Link> },
        { key: "materi", label: <Link to="/dashboard/materi">Manage Materi</Link> },
        { key: "quiz", label: <Link to="/dashboard/quiz">Manage Quiz</Link> },
        { key: "soal", label: <Link to="/dashboard/soal">Manage Soal</Link> },
        { key: "puzzle", label: <Link to="/dashboard/puzzle">Manage Puzzle</Link> },
        { key: "events", label: <Link to="/dashboard/events">Manage Event</Link> },
        { key: "progress", label: <Link to="/dashboard/progress">Progress</Link> },
        { key: "results", label: <Link to="/dashboard/results">Hasil</Link> },
        { key: "users", label: <Link to="/dashboard/users">Manage User</Link> },
      ],
    },

    {
      key: "student-menu",
      label: "Mahasiswa",
      children: [
        { key: "roadmap", label: <Link to="/dashboard/student/roadmap">Roadmap</Link> },
        { key: "badges", label: <Link to="/dashboard/student/badges">Badge</Link> },
        { key: "leaderboard", label: <Link to="/dashboard/student/leaderboard">Leaderboard</Link> },
      ],
    },
  ];

  return <Menu theme="dark" mode="inline" items={items} selectedKeys={[selectedMenu]} />;
};

export default LayoutMenu;
