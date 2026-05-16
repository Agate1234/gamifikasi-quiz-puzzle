import React, { useEffect, useState } from "react";
import { getUserLevelApi } from "./api/level";

const defaultLevelInfo = {
  level: 1,
  total_exp: 0,
  current_level_exp: 0,
  required_exp: 100,
  remaining_exp: 100,
  next_level: 2,
  progress_percent: 0,
};

export default function LevelProgressCard({ title = "Progress Level" }) {
  const [levelInfo, setLevelInfo] = useState(defaultLevelInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        setLoading(true);

        const idUser = localStorage.getItem("id_user");

        if (!idUser) {
          setLevelInfo(defaultLevelInfo);
          return;
        }

        const response = await getUserLevelApi(idUser);

        if (response?.status === 200 && response?.data?.success) {
          setLevelInfo(response.data.data.level_info || defaultLevelInfo);
        } else {
          setLevelInfo(defaultLevelInfo);
        }
      } catch (error) {
        setLevelInfo(defaultLevelInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
  }, []);

  return (
    <section style={styles.levelCard}>
      <div>
        <div style={styles.kicker}>{title}</div>
        <div style={styles.title}>
          Level {loading ? "-" : levelInfo.level}
        </div>
        <div style={styles.desc}>
          {loading
            ? "Memuat progress level..."
            : `${levelInfo.current_level_exp} / ${levelInfo.required_exp} XP untuk naik ke Level ${levelInfo.next_level}`}
        </div>
      </div>

      <div style={styles.progressBlock}>
        <div style={styles.progressText}>
          <span>{loading ? 0 : levelInfo.progress_percent}%</span>
          <span>Total XP: {loading ? 0 : levelInfo.total_exp}</span>
        </div>

        <div style={styles.progressOuter}>
          <div
            style={{
              ...styles.progressInner,
              width: `${loading ? 0 : levelInfo.progress_percent}%`,
            }}
          />
        </div>

        <div style={styles.remainingText}>
          Sisa {loading ? 0 : levelInfo.remaining_exp} XP lagi
        </div>
      </div>
    </section>
  );
}

const styles = {
  levelCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.08), rgba(140,86,255,0.08))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    flexWrap: "wrap",
  },

  kicker: {
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(215,222,250,0.65)",
    marginBottom: 6,
  },

  title: {
    fontSize: 26,
    fontWeight: 900,
    color: "#ffffff",
    lineHeight: 1.1,
  },

  desc: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(215,222,250,0.78)",
  },

  progressBlock: {
    minWidth: 320,
    maxWidth: 440,
    flex: 1,
  },

  progressText: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "rgba(215,222,250,0.82)",
    marginBottom: 8,
    fontWeight: 700,
  },

  progressOuter: {
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  progressInner: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.9), rgba(140,86,255,0.9))",
  },

  remainingText: {
    marginTop: 8,
    textAlign: "right",
    fontSize: 12,
    color: "rgba(215,222,250,0.65)",
  },
};