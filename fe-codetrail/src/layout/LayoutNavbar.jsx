import React, { useEffect, useState } from "react";
import { Avatar, Layout, Typography } from "antd";
import {
  BarChartOutlined,
  TrophyOutlined,
  RiseOutlined,
  LogoutOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserLevelApi } from "../components/api/level";

const { Header } = Layout;

const defaultLevelInfo = {
  level: 1,
  total_exp: 0,
  current_level_exp: 0,
  required_exp: 100,
  remaining_exp: 100,
  next_level: 2,
  progress_percent: 0,
};

function getUserName(session) {
  return (
    localStorage.getItem("nama_user") ||
    session?.user?.nama_user ||
    session?.user?.nama ||
    session?.nama_user ||
    session?.nama ||
    "Mahasiswa"
  );
}

export default function LayoutNavbar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();

  const userName = getUserName(session);

  const [levelInfo, setLevelInfo] = useState(defaultLevelInfo);
  const [loadingLevel, setLoadingLevel] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        setLoadingLevel(true);

        const idUser = localStorage.getItem("id_user");

        if (!idUser) {
          setLevelInfo(defaultLevelInfo);
          return;
        }

        const response = await getUserLevelApi(idUser);

        if (response?.status === 200 && response?.data?.success) {
          setLevelInfo(response.data.data?.level_info || defaultLevelInfo);
        } else {
          setLevelInfo(defaultLevelInfo);
        }
      } catch (error) {
        setLevelInfo(defaultLevelInfo);
      } finally {
        setLoadingLevel(false);
      }
    };

    fetchLevel();
  }, [location.pathname]);

  const menus = [
    {
      key: "roadmap",
      label: "Roadmap",
      icon: <BarChartOutlined />,
      path: "/dashboard/roadmap",
    },
    {
      key: "achievement",
      label: "Achievement",
      icon: <TrophyOutlined />,
      path: "/dashboard/achievement",
    },
    {
      key: "leaderboard",
      label: "Leaderboard",
      icon: <RiseOutlined />,
      path: "/dashboard/leaderboard",
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("token");
    localStorage.removeItem("id_user");
    localStorage.removeItem("nama_user");
    localStorage.removeItem("role");

    navigate("/signin", { replace: true });
  };

  return (
    <Header style={styles.header}>
      <div style={styles.navWrap}>
        <div
          onClick={() => navigate("/dashboard/roadmap")}
          style={styles.brand}
        >
          <div style={styles.logoBox}>
            <CodeOutlined style={{ color: "#7C5CFF", fontSize: 18 }} />
          </div>

          <div style={styles.brandText}>
            <Typography.Text style={styles.brandTitle}>
              CodeTrail
            </Typography.Text>
            <Typography.Text style={styles.brandSub}>
              Student Learning
            </Typography.Text>
          </div>
        </div>

        <nav style={styles.menuWrap}>
          {menus.map((menu) => {
            const active = isActive(menu.path);

            return (
              <button
                key={menu.key}
                onClick={() => navigate(menu.path)}
                style={{
                  ...styles.menuButton,
                  ...(active ? styles.menuButtonActive : {}),
                }}
              >
                {menu.icon}
                {menu.label}
              </button>
            );
          })}
        </nav>

        <div style={styles.rightWrap}>
          <div style={styles.levelMiniCard}>
            <div style={styles.levelBadge}>
              LV {loadingLevel ? "-" : levelInfo.level}
            </div>

            <div style={styles.levelInfo}>
              <div style={styles.levelXpRow}>
                <span>
                  {loadingLevel
                    ? "0 / 100 XP"
                    : `${levelInfo.current_level_exp} / ${levelInfo.required_exp} XP`}
                </span>

                <span>{loadingLevel ? 0 : levelInfo.progress_percent}%</span>
              </div>

              <div style={styles.levelBarOuter}>
                <div
                  style={{
                    ...styles.levelBarInner,
                    width: `${loadingLevel ? 0 : levelInfo.progress_percent}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={styles.profileCard}>
            <Avatar style={styles.avatar}>
              {userName?.charAt(0)?.toUpperCase() || "M"}
            </Avatar>

            <div style={styles.profileText}>
              <Typography.Text title={userName} style={styles.profileName}>
                {userName}
              </Typography.Text>
              <Typography.Text style={styles.profileRole}>
                Mahasiswa
              </Typography.Text>
            </div>
          </div>

         <button onClick={handleLogout} style={styles.logoutButton} title="Logout">
  <LogoutOutlined style={styles.logoutIcon} />
</button>
        </div>
      </div>
    </Header>
  );
}

const styles = {
  header: {
    height: "auto",
    background:
      "radial-gradient(900px 420px at 55% 0%, #0a2a2a 0%, #070a14 55%, #050611 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "sticky",
    top: 0,
    zIndex: 50,
    lineHeight: 1,
  },

  navWrap: {
    width: "100%",
    maxWidth: 1400,
    minHeight: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: "12px 16px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    flexWrap: "wrap",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    minWidth: 210,
    flexShrink: 0,
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(124,92,255,0.18)",
    border: "1px solid rgba(124,92,255,0.25)",
    flexShrink: 0,
  },

  brandText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  brandTitle: {
    color: "#E6ECFF",
    fontWeight: 850,
    fontSize: 18,
    lineHeight: 1,
  },

  brandSub: {
    color: "rgba(230,236,255,0.55)",
    fontSize: 12,
    lineHeight: 1,
  },

  menuWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 7,
    borderRadius: 999,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    flexWrap: "wrap",
    flex: "0 1 auto",
  },

  menuButton: {
    border: "1px solid transparent",
    background: "transparent",
    color: "rgba(230,236,255,0.72)",
    borderRadius: 999,
    padding: "11px 18px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    whiteSpace: "nowrap",
  },

  menuButtonActive: {
    border: "1px solid rgba(60,255,201,0.34)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.16), rgba(140,86,255,0.12))",
    color: "#ffffff",
    boxShadow: "0 0 18px rgba(60,255,201,0.10)",
  },

  rightWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    minWidth: 0,
    flexWrap: "wrap",
    flexShrink: 0,
  },

  levelMiniCard: {
    width: 240,
    height: 46,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(60,255,201,0.18)",
    background: "rgba(255,255,255,0.035)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },

  levelBadge: {
    minWidth: 48,
    height: 30,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.08)",
    color: "#E6ECFF",
    fontSize: 12,
    fontWeight: 900,
    flexShrink: 0,
  },

  levelInfo: {
    flex: 1,
    minWidth: 0,
  },

  levelXpRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
    color: "rgba(230,236,255,0.72)",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
  },

  levelBarOuter: {
    height: 7,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  levelBarInner: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.9), rgba(140,86,255,0.9))",
  },

  profileCard: {
    width: 190,
    height: 46,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    flexShrink: 0,
  },

  avatar: {
    background: "rgba(124,92,255,0.28)",
    flexShrink: 0,
  },

  profileText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
    flex: 1,
  },

  profileName: {
    color: "#E6ECFF",
    fontWeight: 750,
    fontSize: 13,
    lineHeight: 1,
    display: "block",
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  profileRole: {
    color: "rgba(230,236,255,0.55)",
    fontSize: 12,
    lineHeight: 1,
  },

  logoutButton: {
  width: 42,
  height: 42,
  padding: 0,
  borderRadius: 999,
  border: "1px solid rgba(255,95,95,0.35)",
  background: "rgba(255,75,75,0.10)",
  color: "#ffb3b3",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  flexShrink: 0,
  boxShadow: "0 0 18px rgba(255,75,75,0.06)",
},

  logoutIcon: {
    color: "#ff8f8f",
    fontSize: 15,
  },

  logoutText: {
    color: "#ffb3b3",
    lineHeight: 1,
  },
};