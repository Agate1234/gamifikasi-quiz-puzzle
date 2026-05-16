import React, { useEffect, useMemo, useState } from "react";
import { getLeaderboardApi } from "../../components/api/leaderboard";

export default function IndexLeaderboard() {
  const [mode, setMode] = useState("level");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.append("mode", mode);
        params.append("limit", "50");

        const response = await getLeaderboardApi(params);

        if (response?.status === 200 && response?.data?.success) {
          setLeaderboard(response.data.data || []);
        } else {
          setLeaderboard([]);
        }
      } catch (error) {
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [mode]);

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const remainingLeaderboard = useMemo(
    () => leaderboard.slice(3),
    [leaderboard],
  );

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>LEADERBOARD</div>

            <h1 style={styles.heroTitle}>Peringkat Mahasiswa</h1>

            <p style={styles.heroDesc}>
              Lihat peringkat mahasiswa berdasarkan level atau total EXP. Pada
              mode level, jika level sama maka urutan ditentukan oleh total EXP
              terbesar.
            </p>
          </div>

          <div style={styles.modeWrap}>
            <ModeButton
              active={mode === "level"}
              onClick={() => setMode("level")}
            >
              Leaderboard Level
            </ModeButton>

            <ModeButton active={mode === "exp"} onClick={() => setMode("exp")}>
              Leaderboard EXP
            </ModeButton>
          </div>
        </section>

        {loading ? (
          <section style={styles.loadingBox}>
            <span style={styles.statusDot} />
            <span>Loading leaderboard...</span>
          </section>
        ) : (
          <>
            {topThree.length > 0 && (
              <section style={styles.podiumWrap}>
                {topThree.map((item) => (
                  <PodiumCard key={item.id_user} item={item} mode={mode} />
                ))}
              </section>
            )}

            {remainingLeaderboard.length > 0 && (
              <section style={styles.board}>
                {remainingLeaderboard.map((item) => (
                  <LeaderboardRow key={item.id_user} item={item} mode={mode} />
                ))}
              </section>
            )}

            {!topThree.length && !remainingLeaderboard.length && (
              <div style={styles.emptyCard}>Belum ada data leaderboard.</div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.modeButton,
        ...(active ? styles.modeButtonActive : {}),
      }}
    >
      {children}
    </button>
  );
}

function PodiumCard({ item, mode }) {
  const medal = item.rank === 1 ? "🏆" : item.rank === 2 ? "🥈" : "🥉";

  return (
    <div
      style={{
        ...styles.podiumCard,
        ...(item.rank === 1 ? styles.podiumCardFirst : {}),
      }}
    >
      <div style={styles.podiumTop}>
        <div style={styles.podiumRank}>{medal}</div>
        <div style={styles.podiumNumber}>#{item.rank}</div>
      </div>

      <div style={styles.podiumAvatar}>
        {item.nama_user?.charAt(0)?.toUpperCase() || "M"}
      </div>

      <div title={item.nama_user} style={styles.podiumName}>
        {item.nama_user}
      </div>

      <div style={styles.podiumMeta}>
        {mode === "level" ? `Level ${item.level}` : `${item.total_exp} XP`} •{" "}
        {item.total_badge} Badge
      </div>

      <div style={styles.podiumInfoRow}>
        {mode === "level" ? (
          <>
            <div style={styles.podiumInfoBox}>
              <div style={styles.podiumInfoValue}>Level {item.level}</div>
              <div style={styles.podiumInfoLabel}>Current Level</div>
            </div>

            <div style={styles.podiumInfoBox}>
              <div style={styles.podiumInfoValue}>{item.total_badge}</div>
              <div style={styles.podiumInfoLabel}>Badge</div>
            </div>
          </>
        ) : (
          <>
            <div style={styles.podiumInfoBox}>
              <div style={styles.podiumInfoValue}>{item.total_exp}</div>
              <div style={styles.podiumInfoLabel}>Total EXP</div>
            </div>

            <div style={styles.podiumInfoBox}>
              <div style={styles.podiumInfoValue}>{item.total_badge}</div>
              <div style={styles.podiumInfoLabel}>Badge</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({ item, mode }) {
  return (
    <div style={styles.row}>
      <div
        style={{
          ...styles.rankBox,
          ...(item.rank === 1 ? styles.rankBoxFirst : {}),
          ...(item.rank === 2 ? styles.rankBoxSecond : {}),
          ...(item.rank === 3 ? styles.rankBoxThird : {}),
        }}
      >
        #{item.rank}
      </div>

      <div style={styles.userInfo}>
        <div style={styles.avatar}>
          {item.nama_user?.charAt(0)?.toUpperCase() || "M"}
        </div>

        <div style={styles.userText}>
          <div title={item.nama_user} style={styles.name}>
            {item.nama_user}
          </div>

          <div style={styles.meta}>
            {item.total_badge} Badge • Score {item.total_score}
          </div>
        </div>
      </div>

      {mode === "level" ? (
        <div style={styles.levelBox}>
          <span style={styles.levelValue}>Level {item.level}</span>
        </div>
      ) : (
        <div style={styles.xpBox}>
          <span style={styles.xpValue}>{item.total_exp}</span>
          <span style={styles.xpLabel}>XP</span>
        </div>
      )}

      <div style={styles.modeBadge}>
        {mode === "level" ? "LEVEL RANK" : "EXP RANK"}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 60% 30%, #0a2a2a 0%, #070a14 55%, #050611 100%)",
    color: "#d7defa",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },

  main: {
    padding: "18px 14px",
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: 20,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.08), rgba(140,86,255,0.08))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    flexWrap: "wrap",
  },

  heroContent: {
    flex: "1 1 560px",
    minWidth: 0,
  },

  heroBadge: {
    display: "inline-flex",
    width: "fit-content",
    fontSize: 11,
    letterSpacing: 1,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.08)",
    marginBottom: 12,
  },

  heroTitle: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1,
    fontWeight: 850,
  },

  heroDesc: {
    maxWidth: 720,
    margin: "12px 0 0",
    fontSize: 14,
    lineHeight: 1.7,
    opacity: 0.8,
  },

  modeWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 6,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    flexWrap: "wrap",
  },

  modeButton: {
    border: "1px solid transparent",
    background: "transparent",
    color: "rgba(230,236,255,0.72)",
    borderRadius: 999,
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  modeButtonActive: {
    border: "1px solid rgba(60,255,201,0.34)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.16), rgba(140,86,255,0.12))",
    color: "#ffffff",
    boxShadow: "0 0 18px rgba(60,255,201,0.10)",
  },

  loadingBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.035)",
    fontSize: 14,
    opacity: 0.8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    background: "#3cffc9",
    boxShadow: "0 0 14px rgba(60,255,201,0.35)",
  },

  podiumWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },

  podiumCard: {
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.035)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
    minWidth: 0,
  },

  podiumCardFirst: {
    border: "1px solid rgba(60,255,201,0.30)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.08), rgba(140,86,255,0.08))",
  },

  podiumTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  podiumRank: {
    fontSize: 28,
  },

  podiumNumber: {
    fontSize: 13,
    fontWeight: 900,
    opacity: 0.72,
  },

  podiumAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "rgba(124,92,255,0.22)",
    border: "1px solid rgba(124,92,255,0.24)",
    fontWeight: 900,
    fontSize: 20,
    marginBottom: 12,
  },

  podiumName: {
    fontSize: 17,
    fontWeight: 850,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  podiumMeta: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.72,
  },

  podiumInfoRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 14,
  },

  podiumInfoBox: {
    borderRadius: 14,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },

  podiumInfoValue: {
    fontSize: 16,
    fontWeight: 800,
    color: "#ffffff",
  },

  podiumInfoLabel: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.68,
  },

  board: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  row: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr) 200px 110px",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.035)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },

  rankBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 17,
    fontWeight: 900,
    border: "1px solid rgba(60,255,201,0.24)",
    background: "rgba(60,255,201,0.08)",
  },

  rankBoxFirst: {
    border: "1px solid rgba(255,214,102,0.35)",
    background: "rgba(255,214,102,0.10)",
  },

  rankBoxSecond: {
    border: "1px solid rgba(190,200,220,0.35)",
    background: "rgba(190,200,220,0.10)",
  },

  rankBoxThird: {
    border: "1px solid rgba(255,150,85,0.35)",
    background: "rgba(255,150,85,0.10)",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(124,92,255,0.22)",
    border: "1px solid rgba(124,92,255,0.24)",
    fontWeight: 900,
    flexShrink: 0,
  },

  userText: {
    minWidth: 0,
  },

  name: {
    fontSize: 16,
    fontWeight: 800,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  meta: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.65,
  },

  levelBox: {
    justifySelf: "end",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },

  levelValue: {
    fontSize: 18,
    fontWeight: 900,
  },

  xpBox: {
    justifySelf: "end",
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(140,86,255,0.24)",
    background: "rgba(140,86,255,0.10)",
  },

  xpValue: {
    fontSize: 18,
    fontWeight: 900,
  },

  xpLabel: {
    fontSize: 12,
    opacity: 0.7,
  },

  modeBadge: {
    justifySelf: "end",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.6,
    padding: "6px 9px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    opacity: 0.72,
    whiteSpace: "nowrap",
  },

  emptyCard: {
    borderRadius: 18,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    fontSize: 14,
    opacity: 0.75,
  },
};