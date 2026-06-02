import React, { useMemo, useState } from "react";
import { Layout, Menu, Typography, Space, Avatar, Tooltip } from "antd";
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
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RiseOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

function getSelectedKey(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "home";
}

function decodeLocalValue(value) {
  if (!value) return "";

  try {
    return JSON.parse(decodeURIComponent(escape(atob(value))));
  } catch {
    return "";
  }
}

function getRoleName() {
  const encodedRole = localStorage.getItem("ct_role");
  const plainRole = localStorage.getItem("role");
  const role = decodeLocalValue(encodedRole) || plainRole;

  const roleMap = {
    1: "Admin",
    2: "Dosen TI",
    3: "Mahasiswa",
  };

  return roleMap[Number(role)] || plainRole || "User";
}

function getUserName() {
  return (
    localStorage.getItem("nama_user") ||
    localStorage.getItem("email") ||
    "User CodeTrail"
  );
}

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
}

function handleLogout(navigate) {
  const keysToRemove = [
    "session",
    "token",
    "id_user",
    "nama_user",
    "role",
    "email",
    "game_role",

    "ct_role",
    "ct_id_user",
    "ct_nama_user",
    "ct_email",
    "ct_game_role",
  ];

  keysToRemove.forEach((key) => localStorage.removeItem(key));

  Object.keys(localStorage)
    .filter(
      (key) =>
        key.startsWith("codetrail_quiz_session_") ||
        key.startsWith("codetrail_active_quiz_session") ||
        key.startsWith("codetrail_completed_quiz_result_") ||
        key.startsWith("codetrail_timeout_result") ||
        key.startsWith("codetrail_"),
    )
    .forEach((key) => localStorage.removeItem(key));

  sessionStorage.clear();

  navigate("/signin", { replace: true });
}

function LogoMark({ collapsed = false }) {
  return (
    <div
      style={{
        width: collapsed ? 38 : 44,
        height: collapsed ? 38 : 44,
        borderRadius: collapsed ? 14 : 16,
        display: "grid",
        placeItems: "center",
        position: "relative",
        flexShrink: 0,
        border: "1px solid rgba(60,255,201,0.30)",
        background:
          "radial-gradient(circle at 30% 25%, rgba(60,255,201,0.18), transparent 48%), rgba(255,255,255,0.03)",
        boxShadow:
          "0 0 24px rgba(60,255,201,0.12), inset 0 0 18px rgba(255,255,255,0.03)",
      }}
    >
      <span
        style={{
          fontSize: collapsed ? 16 : 19,
          fontWeight: 950,
          letterSpacing: -3,
          paddingRight: 3,
          background:
            "linear-gradient(135deg, rgba(60,255,201,1), rgba(140,86,255,1))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        CT
      </span>

      <span
        style={{
          position: "absolute",
          width: collapsed ? 22 : 25,
          height: 2,
          left: collapsed ? 8 : 9,
          bottom: collapsed ? 10 : 11,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(60,255,201,0.95), rgba(140,86,255,0.95))",
          transform: "rotate(-20deg)",
          boxShadow: "0 0 14px rgba(60,255,201,0.34)",
        }}
      />

      <span
        style={{
          position: "absolute",
          width: 5,
          height: 5,
          left: collapsed ? 8 : 9,
          bottom: collapsed ? 8 : 9,
          borderRadius: 999,
          background: "rgba(60,255,201,1)",
          boxShadow: "0 0 12px rgba(60,255,201,0.8)",
        }}
      />

      <span
        style={{
          position: "absolute",
          width: 5,
          height: 5,
          right: collapsed ? 8 : 9,
          bottom: collapsed ? 16 : 17,
          borderRadius: 999,
          background: "rgba(140,86,255,1)",
          boxShadow: "0 0 12px rgba(140,86,255,0.8)",
        }}
      />
    </div>
  );
}

export default function LayoutSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = getSelectedKey(location.pathname);
  const namaUser = getUserName();
  const roleName = getRoleName();

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
      {
        key: "leaderboard",
        icon: <RiseOutlined />,
        label: "Leaderboard",
        onClick: () => navigate("/dashboard/leaderboard"),
      },

      { type: "group", label: "SYSTEM", key: "grp-system" },
      {
        key: "users",
        icon: <UserOutlined />,
        label: "Manage User",
        onClick: () => navigate("/dashboard/users"),
      },
    ],
    [navigate],
  );

  return (
    <Sider
      width={260}
      collapsedWidth={76}
      collapsed={collapsed}
      trigger={null}
      breakpoint="lg"
      onBreakpoint={(broken) => setCollapsed(broken)}
      style={{
        minHeight: "100vh",
        background: "#0E1726",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "16px 12px 12px" : "16px 14px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 10,
          }}
        >
          <div
            onClick={() => navigate("/dashboard/home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              cursor: "pointer",
            }}
          >
            <LogoMark collapsed={collapsed} />

            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <Typography.Text
                  style={{
                    color: "#E6ECFF",
                    fontWeight: 900,
                    fontSize: 15,
                    display: "block",
                    lineHeight: 1.15,
                  }}
                >
                  CodeTrail
                </Typography.Text>

                <Typography.Text
                  style={{
                    color: "rgba(230,236,255,0.48)",
                    fontSize: 11,
                    lineHeight: 1.15,
                  }}
                >
                  Dashboard
                </Typography.Text>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.035)",
                color: "rgba(230,236,255,0.74)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
              title="Tutup sidebar"
            >
              <MenuFoldOutlined />
            </button>
          )}
        </div>

        {collapsed && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              style={{
                width: 38,
                height: 34,
                borderRadius: 11,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.035)",
                color: "rgba(230,236,255,0.74)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
              title="Buka sidebar"
            >
              <MenuUnfoldOutlined />
            </button>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            paddingBottom: 12,
          }}
        >
          <Menu
            theme="dark"
            mode="inline"
            inlineCollapsed={collapsed}
            items={items}
            selectedKeys={[selectedKey]}
            style={{
              background: "transparent",
              borderRight: 0,
              paddingInline: collapsed ? 8 : 8,
            }}
          />
        </div>

        {/* User card bottom */}
        <div style={{ padding: collapsed ? 10 : 14 }}>
          <div
            style={{
              borderRadius: 16,
              padding: collapsed ? 8 : 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              gap: 10,
            }}
          >
            {collapsed ? (
              <Tooltip title={`${namaUser} - ${roleName}`} placement="right">
                <Avatar
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(60,255,201,0.28), rgba(140,86,255,0.36))",
                    color: "#E6ECFF",
                    fontWeight: 900,
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  {getInitial(namaUser)}
                </Avatar>
              </Tooltip>
            ) : (
              <>
                <Space style={{ minWidth: 0 }}>
                  <Avatar
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(60,255,201,0.28), rgba(140,86,255,0.36))",
                      color: "#E6ECFF",
                      fontWeight: 900,
                      border: "1px solid rgba(255,255,255,0.10)",
                      flexShrink: 0,
                    }}
                  >
                    {getInitial(namaUser)}
                  </Avatar>

                  <div style={{ minWidth: 0 }}>
                    <Typography.Text
                      title={namaUser}
                      style={{
                        color: "#E6ECFF",
                        fontWeight: 700,
                        display: "block",
                        maxWidth: 126,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {namaUser}
                    </Typography.Text>

                    <Typography.Text
                      title={roleName}
                      style={{
                        color: "rgba(230,236,255,0.52)",
                        fontSize: 12,
                        display: "block",
                        maxWidth: 126,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {roleName}
                    </Typography.Text>
                  </div>
                </Space>

                <Tooltip title="Logout">
                  <button
                    type="button"
                    onClick={() => handleLogout(navigate)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      border: "1px solid rgba(248,113,113,0.35)",
                      background: "rgba(239,68,68,0.10)",
                      color: "rgba(254,202,202,0.92)",
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      transition: "0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.18)";
                      e.currentTarget.style.borderColor =
                        "rgba(248,113,113,0.55)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.10)";
                      e.currentTarget.style.borderColor =
                        "rgba(248,113,113,0.35)";
                    }}
                  >
                    <LogoutOutlined />
                  </button>
                </Tooltip>
              </>
            )}
          </div>

          {collapsed && (
            <Tooltip title="Logout" placement="right">
              <button
                type="button"
                onClick={() => handleLogout(navigate)}
                style={{
                  width: "100%",
                  height: 38,
                  marginTop: 8,
                  borderRadius: 13,
                  border: "1px solid rgba(248,113,113,0.35)",
                  background: "rgba(239,68,68,0.10)",
                  color: "rgba(254,202,202,0.92)",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  transition: "0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.18)";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.10)";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.35)";
                }}
              >
                <LogoutOutlined />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </Sider>
  );
}
