import React, { useEffect, useMemo, useState } from "react";
import {
  getAchievementApi,
  syncAchievementApi,
} from "../../components/api/achievement";

const defaultBadges = [
  {
    id: 1,
    title: "First Step",
    desc: "Menyelesaikan aktivitas pertama di roadmap.",
    icon: "🚀",
    xp: 100,
    defaultProgress: 0,
    category: "Roadmap",
  },
  {
    id: 2,
    title: "Quiz Starter",
    desc: "Menyelesaikan quiz pertama dengan benar.",
    icon: "🧠",
    xp: 150,
    defaultProgress: 0,
    category: "Quiz",
  },
  {
    id: 3,
    title: "Puzzle Solver",
    desc: "Menyelesaikan puzzle pertama tanpa menyerah.",
    icon: "🧩",
    xp: 200,
    defaultProgress: 0,
    category: "Puzzle",
  },
  {
    id: 4,
    title: "Module Finisher",
    desc: "Menyelesaikan seluruh aktivitas dalam satu modul.",
    icon: "🏁",
    xp: 300,
    defaultProgress: 0,
    category: "Modul",
  },
  {
    id: 5,
    title: "Perfect Quiz",
    desc: "Mendapatkan nilai sempurna pada salah satu quiz.",
    icon: "🏆",
    xp: 250,
    defaultProgress: 0,
    category: "Quiz",
  },
  {
    id: 6,
    title: "Consistent Learner",
    desc: "Belajar dan menyelesaikan aktivitas secara konsisten.",
    icon: "🔥",
    xp: 500,
    defaultProgress: 0,
    category: "Roadmap",
  },
];

function normalizeBadgeIds(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
}

export default function AchievementMahasiswa() {
  const [activeFilter, setActiveFilter] = useState("semua");
  const [ownedBadges, setOwnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievement = async () => {
      try {
        setLoading(true);

        const idUser = localStorage.getItem("id_user");

        if (!idUser) {
          setOwnedBadges([]);
          return;
        }

        await syncAchievementApi(idUser);

        const response = await getAchievementApi(idUser);

        if (response?.status === 200 && response?.data?.success) {
          const badgeIds = normalizeBadgeIds(response.data.data?.no_badge || []);
          setOwnedBadges(badgeIds);
        } else {
          setOwnedBadges([]);
        }
      } catch (error) {
        setOwnedBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievement();
  }, []);

  const badges = useMemo(() => {
    return defaultBadges.map((badge) => {
      const unlocked = ownedBadges.includes(badge.id);

      return {
        ...badge,
        status: unlocked ? "unlocked" : "locked",
        progress: unlocked ? 100 : badge.defaultProgress,
      };
    });
  }, [ownedBadges]);

  const unlockedBadges = useMemo(
    () => badges.filter((item) => item.status === "unlocked"),
    [badges],
  );

  const totalBadges = badges.length;
  const unlockedCount = unlockedBadges.length;
  const lockedCount = totalBadges - unlockedCount;

  const filteredBadges = useMemo(() => {
    if (activeFilter === "semua") return badges;

    if (activeFilter === "terbuka") {
      return badges.filter((item) => item.status === "unlocked");
    }

    if (activeFilter === "terkunci") {
      return badges.filter((item) => item.status === "locked");
    }

    return badges;
  }, [activeFilter, badges]);

  if (loading) {
    return (
      <div style={styles.page}>
        <main style={styles.main}>
          <div style={styles.loadingBox}>
            <span style={styles.statusDot} />
            <span style={styles.loadingText}>Loading achievement...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>BADGE COLLECTION</div>

            <h1 style={styles.heroTitle}>Koleksi Achievement Kamu</h1>

            <p style={styles.heroDesc}>
              Pantau badge yang sudah terbuka dan achievement yang masih
              terkunci berdasarkan progress belajar kamu.
            </p>
          </div>

          <div style={styles.heroStats}>
            <StatCard label="Total Badge" value={totalBadges} />
            <StatCard label="Terbuka" value={unlockedCount} />
            <StatCard label="Terkunci" value={lockedCount} />
          </div>
        </section>

        <div style={styles.filterWrap}>
          <FilterButton
            active={activeFilter === "semua"}
            onClick={() => setActiveFilter("semua")}
          >
            Semua
          </FilterButton>

          <FilterButton
            active={activeFilter === "terbuka"}
            onClick={() => setActiveFilter("terbuka")}
          >
            Terbuka
          </FilterButton>

          <FilterButton
            active={activeFilter === "terkunci"}
            onClick={() => setActiveFilter("terkunci")}
          >
            Terkunci
          </FilterButton>
        </div>

        <div style={styles.contentGrid}>
          <section style={styles.badgeGrid}>
            {filteredBadges.length > 0 ? (
              filteredBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))
            ) : (
              <div style={styles.emptyCard}>Tidak ada badge.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.filterButton,
        ...(active ? styles.filterButtonActive : {}),
      }}
    >
      {children}
    </button>
  );
}

function BadgeCard({ badge }) {
  const locked = badge.status === "locked";
  const unlocked = badge.status === "unlocked";

  return (
    <div
      style={{
        ...styles.badgeCard,
        ...(locked ? styles.badgeCardLocked : {}),
      }}
    >
      <div style={styles.badgeTop}>
        <div
          style={{
            ...styles.badgeIcon,
            ...(unlocked ? styles.badgeIconUnlocked : {}),
            ...(locked ? styles.badgeIconLocked : {}),
          }}
        >
          {locked ? "🔒" : badge.icon}
        </div>

        <StatusBadge status={badge.status} />
      </div>

      <div style={styles.badgeTitle}>{badge.title}</div>
      <div style={styles.badgeDesc}>{badge.desc}</div>

      <div style={styles.badgeMeta}>
        <span>{badge.category}</span>
        <span>{badge.xp} XP</span>
      </div>

      <div style={styles.cardProgressRow}>
        <div style={styles.cardProgressOuter}>
          <div
            style={{
              ...styles.cardProgressInner,
              width: `${badge.progress}%`,
            }}
          />
        </div>

        <div style={styles.cardProgressText}>{badge.progress}%</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const text = status === "unlocked" ? "TERBUKA" : "TERKUNCI";

  const style =
    status === "unlocked" ? styles.badgeUnlocked : styles.badgeLocked;

  return <span style={{ ...styles.statusBadge, ...style }}>{text}</span>;
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

  loadingBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    background: "#3cffc9",
    boxShadow: "0 0 14px rgba(60,255,201,0.35)",
  },

  loadingText: {
    fontSize: 12,
    opacity: 0.85,
  },

  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: 18,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.08), rgba(140,86,255,0.08))",
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    flexWrap: "wrap",
  },

  heroContent: {
    flex: "1 1 520px",
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
    maxWidth: 620,
    margin: "12px 0 0",
    fontSize: 14,
    lineHeight: 1.7,
    opacity: 0.8,
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 132px)",
    gap: 10,
    alignItems: "stretch",
    justifyContent: "end",
    flex: "0 0 auto",
  },

  statCard: {
    borderRadius: 16,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.035)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: 92,
  },

  statValue: {
    fontSize: 26,
    fontWeight: 850,
    color: "#ffffff",
  },

  statLabel: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.72,
  },

  filterWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    padding: 6,
    borderRadius: 999,
    width: "fit-content",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.025)",
  },

  filterButton: {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#d7defa",
    padding: "9px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 650,
  },

  filterButtonActive: {
    border: "1px solid rgba(60,255,201,0.28)",
    background: "rgba(60,255,201,0.10)",
    boxShadow: "0 0 18px rgba(60,255,201,0.08)",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 18,
    alignItems: "start",
  },

  badgeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },

  badgeCard: {
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    transition: "transform 120ms ease, border-color 120ms ease",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },

  badgeCardLocked: {
    opacity: 0.62,
  },

  badgeTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  },

  badgeIconUnlocked: {
    border: "1px solid rgba(60,255,201,0.28)",
    background: "rgba(60,255,201,0.10)",
    boxShadow: "0 0 20px rgba(60,255,201,0.08)",
  },

  badgeIconLocked: {
    background: "rgba(255,255,255,0.035)",
  },

  badgeTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 8,
  },

  badgeDesc: {
    fontSize: 13,
    opacity: 0.78,
    lineHeight: 1.5,
    minHeight: 40,
  },

  badgeMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
    fontSize: 12,
    opacity: 0.78,
  },

  cardProgressRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },

  cardProgressOuter: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  cardProgressInner: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.85), rgba(140,86,255,0.85))",
  },

  cardProgressText: {
    fontSize: 12,
    opacity: 0.8,
    width: 42,
    textAlign: "right",
  },

  statusBadge: {
    fontSize: 11,
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    letterSpacing: 0.6,
    fontWeight: 750,
  },

  badgeUnlocked: {
    border: "1px solid rgba(60,255,201,0.25)",
    background: "rgba(60,255,201,0.10)",
  },

  badgeLocked: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    opacity: 0.9,
  },

  emptyCard: {
    gridColumn: "1 / -1",
    borderRadius: 18,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    fontSize: 14,
    opacity: 0.75,
  },
};