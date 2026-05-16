import React, { useMemo } from "react";
import { Layout, Menu, Typography, Space, Avatar } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  ToolOutlined,
  CalendarOutlined,
  BarChartOutlined,
  TrophyOutlined,
  DashboardOutlined,
  UserOutlined,
  CodeOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

function getSelectedKey(pathname) {
  // ambil segment terakhir (kayak gaya kamu)
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "home";
}

export default function LayoutSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = getSelectedKey(location.pathname);

  const items = useMemo(
    () => [
      {
        key: "home",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        onClick: () => navigate("/dashboard/home"),
      },

      { type: "group", label: "MANAGEMENT", key: "grp-management" },
      {
        key: "modul",
        icon: <AppstoreOutlined />,
        label: "Manage Modul",
        onClick: () => navigate("/dashboard/modul"),
      },
      {
        key: "materi",
        icon: <FileTextOutlined />,
        label: "Manage Materi",
        onClick: () => navigate("/dashboard/materi"),
      },
      {
        key: "quiz",
        icon: <QuestionCircleOutlined />,
        label: "Manage Quiz",
        onClick: () => navigate("/dashboard/quiz"),
      },
      {
        key: "soal",
        icon: <QuestionCircleOutlined />,
        label: "Manage Soal",
        onClick: () => navigate("/dashboard/soal"),
      },
      {
        key: "puzzle",
        icon: <ToolOutlined />,
        label: "Manage Puzzle",
        onClick: () => navigate("/dashboard/puzzle"),
      },
      {
        key: "events",
        icon: <CalendarOutlined />,
        label: "Manage Event",
        onClick: () => navigate("/dashboard/events"),
      },

      { type: "group", label: "ANALYTICS", key: "grp-analytics" },
      {
        key: "progress",
        icon: <BarChartOutlined />,
        label: "Lihat Progress Mahasiswa",
        onClick: () => navigate("/dashboard/progress"),
      },
      {
        key: "results",
        icon: <TrophyOutlined />,
        label: "Lihat Hasil Mahasiswa",
        onClick: () => navigate("/dashboard/results"),
      },

      { type: "group", label: "SYSTEM", key: "grp-system" },
      {
        key: "users",
        icon: <UserOutlined />,
        label: "Manage User",
        onClick: () => navigate("/dashboard/users"),
      },

      { type: "group", label: "MAHASISWA", key: "grp-mahasiswa" },
      {
        key: "roadmap",
        icon: <BarChartOutlined />,
        label: "Roadmap Modul",
        onClick: () => navigate("/dashboard/roadmap"),
      },
      {
        key: "achievement",
        icon: <BarChartOutlined />,
        label: "Achievement",
        onClick: () => navigate("/dashboard/achievement"),
      },
    ],
    [navigate],
  );

  return (
    <Sider
      width={260}
      breakpoint="lg"
      collapsedWidth={72}
      style={{
        background: "#0E1726",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        style={{ padding: 16, display: "flex", alignItems: "center", gap: 10 }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: "rgba(124,92,255,0.18)",
            border: "1px solid rgba(124,92,255,0.25)",
          }}
        >
          <CodeOutlined style={{ color: "#7C5CFF" }} />
        </div>
        <div>
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>
            CodeTrail
          </Typography.Text>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Dashboard
            </Typography.Text>
          </div>
        </div>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={[selectedKey]}
        style={{
          background: "transparent",
          borderRight: 0,
          paddingInline: 8,
        }}
      />

      {/* User card bottom */}
      <div style={{ padding: 14 }}>
        <div
          style={{
            borderRadius: 14,
            padding: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Space>
            <Avatar style={{ background: "rgba(124,92,255,0.22)" }}>F</Avatar>
            <div>
              <Typography.Text style={{ color: "#E6ECFF", fontWeight: 600 }}>
                Faiz Abiyu
              </Typography.Text>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Dosen TI
                </Typography.Text>
              </div>
            </div>
          </Space>

          <LogoutOutlined
            onClick={() => {
              localStorage.removeItem("session");
              localStorage.removeItem("token");
              localStorage.removeItem("id_user");
              localStorage.removeItem("nama_user");
              localStorage.removeItem("role");

              navigate("/signin", { replace: true });
            }}
            style={{ color: "rgba(255,255,255,0.55)", cursor: "pointer" }}
          />
        </div>
      </div>
    </Sider>
  );
}
