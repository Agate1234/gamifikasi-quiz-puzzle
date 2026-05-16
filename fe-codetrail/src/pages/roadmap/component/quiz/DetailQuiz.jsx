import React, { useEffect } from "react";

export default function DetailQuizModal({
  open,
  quiz,
  moduleTitle,
  onClose,
  onStart,
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !quiz) return null;

  const score = Number(quiz?.score || 0);
  const xp = Number(quiz?.xp ?? quiz?.exp_quiz ?? 0);

  const rawStatus =
    quiz?.raw_status ||
    quiz?.status ||
    (quiz?.is_unlock ? "not done" : "locked");

  const normalizedStatus =
    rawStatus === "done"
      ? "done"
      : rawStatus === "locked"
      ? "locked"
      : "not done";

  const primaryLabel =
    normalizedStatus === "done" ? "Preview Quiz →" : "Mulai Quiz →";

  const infoLine =
    normalizedStatus === "done"
      ? "Quiz sudah selesai, tombol di bawah akan membuka preview hasil quiz."
      : "Setelah menekan tombol mulai, quiz akan langsung dibuka.";

  return (
    <div style={S.overlay} onMouseDown={onClose}>
      <div style={S.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <div style={S.title}>{quiz?.title || "Quiz"}</div>
            <div style={S.subtitle}>Modul: {moduleTitle || "-"}</div>
          </div>

          <button style={S.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={S.body}>
          <div style={S.descBox}>
            <div style={S.descLabel}>Deskripsi</div>
            <div style={S.descText}>
              {quiz?.desc || "Quiz ini siap dikerjakan."}
            </div>
          </div>

          <div style={S.metaGrid}>
            <div style={S.metaCard}>
              <div style={S.metaLabel}>Reward XP</div>
              <div style={S.metaValue}>+{xp}</div>
            </div>

            <div style={S.metaCard}>
              <div style={S.metaLabel}>Skor Saat Ini</div>
              <div style={S.metaValue}>{score}</div>
            </div>

            <div style={S.metaCard}>
              <div style={S.metaLabel}>Status</div>
              <div style={S.metaValue}>{normalizedStatus}</div>
            </div>
          </div>

          <div style={S.infoBox}>
            <div style={S.infoTitle}>Perhatian</div>
            <ul style={S.infoList}>
              <li>Pastikan koneksi stabil sebelum mulai quiz.</li>
              <li>Jawab setiap soal dengan teliti.</li>
              <li>{infoLine}</li>
            </ul>
          </div>
        </div>

        <div style={S.footer}>
          <button style={S.secondaryBtn} onClick={onClose}>
            Nanti Saja
          </button>
          <button style={S.primaryBtn} onClick={onStart}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 12000,
    background: "rgba(0,0,0,0.58)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    width: "min(640px, 100%)",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "radial-gradient(900px 500px at 50% 0%, rgba(140,86,255,0.18) 0%, rgba(255,255,255,0.03) 45%, rgba(12,14,24,0.98) 100%)",
    color: "rgba(235,240,255,0.94)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
    overflow: "hidden",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: "20px 20px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  title: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1.2,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.72,
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
  },

  body: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  descBox: {
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },

  descLabel: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.7,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  descText: {
    fontSize: 14,
    lineHeight: 1.7,
    opacity: 0.9,
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },

  metaCard: {
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },

  metaLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },

  metaValue: {
    fontSize: 18,
    fontWeight: 800,
  },

  infoBox: {
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(140,86,255,0.22)",
    background: "rgba(140,86,255,0.10)",
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 8,
  },

  infoList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.7,
    opacity: 0.9,
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },

  secondaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    fontWeight: 700,
  },

  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(140,86,255,0.35)",
    background: "rgba(140,86,255,0.16)",
    color: "rgba(235,240,255,0.96)",
    cursor: "pointer",
    fontWeight: 800,
  },
};