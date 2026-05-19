import React, { useEffect, useMemo, useState } from "react";

const formatSecondsToTime = (totalSeconds = 0) => {
  const parsed = Number(totalSeconds);

  if (!Number.isFinite(parsed)) {
    return "-";
  }

  const safeSeconds = Math.max(0, Math.floor(parsed));
  const mm = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const ss = String(safeSeconds % 60).padStart(2, "0");

  return `${mm}:${ss}`;
};

const getResultTimeText = (result) => {
  const directTimeText = result?.timeText;

  if (
    directTimeText !== null &&
    directTimeText !== undefined &&
    String(directTimeText).trim() !== "" &&
    String(directTimeText).trim() !== "-"
  ) {
    return directTimeText;
  }

  const rawSisaWaktu =
    result?.sisa_waktu_detik ??
    result?.waktu_penyelesaian ??
    result?.waktuPenyelesaian ??
    null;

  if (rawSisaWaktu !== null && rawSisaWaktu !== undefined) {
    return formatSecondsToTime(rawSisaWaktu);
  }

  return "-";
};

export default function HasilQuiz({
  open,
  quizTitle = "Quiz",
  result,
  onBackToModule,
  onShowKey,
  questions = [],
  selectedMap = {},
}) {
  const [showKey, setShowKey] = useState(false);

  const score = result?.score100 ?? 0;
  const xp = result?.xpEarned ?? 0;
  const accuracy = result?.accuracy ?? 0;
  const timeText = getResultTimeText(result);
  const totalQ = result?.totalQuestions ?? questions.length ?? 0;
  const review = result?.review || [];
  const [showParty, setShowParty] = useState(false);

  const shouldPlayWinEffect =
    open &&
    Number(score || 0) >= 70 &&
    (result?.playWinEffect === true ||
      result?.justFinished === true ||
      result?.source === "finish");

  useEffect(() => {
    if (!shouldPlayWinEffect) {
      setShowParty(false);
      return undefined;
    }

    setShowParty(true);

    const timer = window.setTimeout(() => {
      setShowParty(false);
    }, 2300);

    return () => window.clearTimeout(timer);
  }, [shouldPlayWinEffect, result]);

  const keyList = useMemo(() => {
    return (questions || []).map((q, i) => {
      const picked = selectedMap[q.id];
      const correct = q.correctIndex;

      return {
        no: i + 1,
        question: q.question,
        pickedText: picked === undefined ? "-" : q.options?.[picked],
        correctText: q.options?.[correct],
        ok: picked === correct,
      };
    });
  }, [questions, selectedMap]);

  if (!open) return null;

  return (
    <div style={R.wrap}>
      {showParty ? <QuizPartyFromBottom /> : null}

      <div style={R.content}>
        <div style={R.trophyCircle}>🏆</div>

        <div style={R.title}>Kuis Selesai!</div>

        <div style={R.subtitle}>
          Berikut adalah hasil performa Anda pada{" "}
          <span style={R.linkLike}>{quizTitle}</span>
        </div>

        <div style={R.card}>
          <div style={R.smallLabel}>TOTAL SKOR</div>

          <div style={R.scoreRow}>
            <div style={R.scoreBig}>{score}</div>
            <div style={R.scoreSmall}>/100</div>
          </div>

          <div style={R.statsGrid}>
            <StatBox label="XP DIPEROLEH" value={`+${xp} XP`} icon="⚡" />
            <StatBox label="AKURASI" value={`${accuracy}%`} icon="🎯" />
            <StatBox label="SISA WAKTU" value={timeText} icon="⏱" />
            <StatBox label="SOAL" value={`${totalQ} Butir`} icon="📄" />
          </div>

          <div style={R.actions}>
            <button
              style={R.secondaryBtn}
              onClick={() => {
                const next = !showKey;
                setShowKey(next);
                onShowKey?.(next);
              }}
            >
              👁 Lihat Kunci Jawaban
            </button>

            <button style={R.primaryBtn} onClick={onBackToModule}>
              ← Kembali ke Modul
            </button>
          </div>
        </div>

        {showKey ? (
          <div style={R.answerKeyCard}>
            <div style={R.previewTitle}>Review Jawaban Quiz</div>

            {review.length > 0 ? (
              <div style={R.reviewListNew}>
                {review.map((item, index) => (
                  <QuizReviewItem
                    key={item.id_soal || index}
                    item={item}
                    index={index}
                    isLast={index === review.length - 1}
                  />
                ))}
              </div>
            ) : keyList.length > 0 ? (
              <div style={R.reviewListNew}>
                {keyList.map((item) => (
                  <div key={item.no} style={R.reviewItemNew}>
                    <div style={R.questionHeader}>
                      <div style={R.questionNumber}>{item.no}</div>
                      <div style={R.questionText}>{item.question}</div>
                    </div>

                    <div style={R.summaryBox}>
                      <div style={R.answerRow}>
                        <span style={R.answerLabel}>Jawaban kamu</span>
                        <span style={R.answerValue}>
                          {item.pickedText || "-"}
                        </span>
                      </div>

                      <div style={R.answerRow}>
                        <span style={R.answerLabel}>Kunci jawaban</span>
                        <span style={R.answerValue}>
                          {item.correctText || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={R.emptyText}>Kunci jawaban belum tersedia.</div>
            )}
          </div>
        ) : null}

        <div style={R.quote}>
          “Learning never exhausts the mind.” — Leonardo da Vinci
        </div>
      </div>
    </div>
  );
}

function QuizPartyFromBottom() {
  const pieces = [
    { left: 5, delay: 0.0, duration: 1.85, size: 8, rotate: 18, color: "#5bffd7" },
    { left: 9, delay: 0.1, duration: 2.05, size: 7, rotate: -24, color: "#9b5cff" },
    { left: 14, delay: 0.18, duration: 1.95, size: 8, rotate: 36, color: "#ffd166" },
    { left: 19, delay: 0.05, duration: 2.15, size: 9, rotate: -42, color: "#ff6b9a" },
    { left: 24, delay: 0.22, duration: 1.9, size: 7, rotate: 28, color: "#6f7cff" },
    { left: 29, delay: 0.12, duration: 2.08, size: 8, rotate: -18, color: "#5bffd7" },
    { left: 34, delay: 0.02, duration: 1.9, size: 8, rotate: 50, color: "#ffd166" },
    { left: 39, delay: 0.26, duration: 2.18, size: 7, rotate: -35, color: "#ff6b9a" },
    { left: 44, delay: 0.15, duration: 1.92, size: 9, rotate: 21, color: "#9b5cff" },
    { left: 49, delay: 0.08, duration: 2.08, size: 8, rotate: -52, color: "#5bffd7" },
    { left: 54, delay: 0.2, duration: 2.14, size: 8, rotate: 44, color: "#ffd166" },
    { left: 59, delay: 0.11, duration: 1.95, size: 7, rotate: -14, color: "#6f7cff" },
    { left: 64, delay: 0.25, duration: 2.1, size: 9, rotate: 31, color: "#ff6b9a" },
    { left: 69, delay: 0.14, duration: 1.88, size: 8, rotate: -46, color: "#5bffd7" },
    { left: 74, delay: 0.06, duration: 2.12, size: 7, rotate: 15, color: "#9b5cff" },
    { left: 79, delay: 0.24, duration: 1.94, size: 8, rotate: -28, color: "#ffd166" },
    { left: 84, delay: 0.13, duration: 2.16, size: 8, rotate: 39, color: "#6f7cff" },
    { left: 89, delay: 0.19, duration: 2.0, size: 9, rotate: -19, color: "#ff6b9a" },
    { left: 94, delay: 0.04, duration: 2.08, size: 7, rotate: 52, color: "#5bffd7" },
  ];

  const streamers = [
    { left: 10, delay: 0.02, duration: 2.05, color: "#5bffd7" },
    { left: 23, delay: 0.18, duration: 2.18, color: "#ff6b9a" },
    { left: 36, delay: 0.08, duration: 2.0, color: "#ffd166" },
    { left: 50, delay: 0.24, duration: 2.22, color: "#9b5cff" },
    { left: 64, delay: 0.14, duration: 2.08, color: "#5bffd7" },
    { left: 78, delay: 0.04, duration: 2.14, color: "#6f7cff" },
    { left: 90, delay: 0.2, duration: 2.06, color: "#ff6b9a" },
  ];

  return (
    <div style={R.partyLayer} aria-hidden="true">
      <style>{`
        @keyframes quizPartyRiseFromBottom {
          0% {
            transform: translate3d(0, 76px, 0) rotate(0deg) scale(0.94);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          70% {
            opacity: 0.92;
          }
          100% {
            transform: translate3d(var(--drift), -108vh, 0) rotate(var(--spin)) scale(1.04);
            opacity: 0;
          }
        }

        @keyframes quizPartyStreamerRise {
          0% {
            transform: translate3d(0, 86px, 0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 0.95;
          }
          72% {
            opacity: 0.85;
          }
          100% {
            transform: translate3d(var(--drift), -108vh, 0) rotate(var(--spin));
            opacity: 0;
          }
        }
      `}</style>

      {pieces.map((piece, index) => (
        <span
          key={`quiz-party-piece-${index}`}
          style={{
            ...R.partyPiece,
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 1.35,
            background: piece.color,
            borderRadius: index % 3 === 0 ? 999 : 2,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            "--drift": `${index % 2 === 0 ? 38 : -38}px`,
            "--spin": `${piece.rotate * 8}deg`,
          }}
        />
      ))}

      {streamers.map((streamer, index) => (
        <span
          key={`quiz-party-streamer-${index}`}
          style={{
            ...R.partyStreamer,
            left: `${streamer.left}%`,
            borderColor: streamer.color,
            animationDelay: `${streamer.delay}s`,
            animationDuration: `${streamer.duration}s`,
            "--drift": `${index % 2 === 0 ? -52 : 52}px`,
            "--spin": `${index % 2 === 0 ? -390 : 390}deg`,
          }}
        />
      ))}
    </div>
  );
}

function QuizReviewItem({ item, index, isLast }) {
  const options = item?.pilihan || [];

  const selectedIds = getAnswerIds(item?.jawaban_user, item?.jawaban_ids);
  const correctIds = getAnswerIds(item?.jawaban_benar);

  return (
    <div
      style={{
        ...R.reviewItem,
        ...(isLast ? R.reviewItemLast : {}),
      }}
    >
      <div style={R.questionHeader}>
        <div style={R.questionNumber}>{index + 1}</div>

        <div style={R.questionBody}>
          <div style={R.questionText}>{item?.soal || "-"}</div>

          <div style={R.questionMeta}>
            {item?.tipe_soal === "checkbox"
              ? "Checkbox / Multiple Answer"
              : "Single Answer"}{" "}
            • {item?.difficulty || "-"}{" "}
            <span style={item?.is_correct ? R.correctText : R.wrongText}>
              {item?.is_correct ? "✓ Benar" : "✕ Salah"}
            </span>
          </div>
        </div>
      </div>

      <div style={R.optionsList}>
        {options.length > 0 ? (
          options.map((option, optionIndex) => {
            const optionId = Number(option.id_jawaban);
            const selected = selectedIds.includes(optionId);
            const correct = correctIds.includes(optionId);

            const isSelectedCorrect = selected && correct;
            const isSelectedWrong = selected && !correct;

            return (
              <div
                key={option.id_jawaban || optionIndex}
                style={{
                  ...R.optionRow,
                  ...(isSelectedCorrect ? R.optionRowCorrect : {}),
                  ...(isSelectedWrong ? R.optionRowWrong : {}),
                }}
              >
                <div
                  style={{
                    ...R.optionDot,
                    ...(isSelectedCorrect ? R.optionDotCorrect : {}),
                    ...(isSelectedWrong ? R.optionDotWrong : {}),
                  }}
                >
                  {isSelectedCorrect ? "✓" : isSelectedWrong ? "✕" : ""}
                </div>

                <div style={R.optionTextWrap}>
                  <div style={R.optionText}>{option.jawaban_soal}</div>
                </div>

                {selected ? (
                  <div style={isSelectedCorrect ? R.correctText : R.wrongText}>
                    {isSelectedCorrect ? "Benar" : "Salah"}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div style={R.emptyText}>Pilihan jawaban belum tersedia.</div>
        )}
      </div>

      <div style={R.correctAnswerCard}>
        <div style={R.correctAnswerTitle}>Jawaban benar</div>
        <div style={R.correctAnswerContent}>
          <BulletAnswers data={item?.jawaban_benar} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div style={R.statBox}>
      <div style={R.statIcon}>{icon}</div>
      <div style={R.statLabel}>{label}</div>
      <div style={R.statValue}>{value}</div>
    </div>
  );
}

function BulletAnswers({ data = [] }) {
  const answers = normalizeAnswerArray(data);

  if (!answers.length) {
    return <div style={R.answerValue}>-</div>;
  }

  return (
    <ul style={R.answerBulletList}>
      {answers.map((answer, index) => (
        <li key={index} style={R.answerBulletItem}>
          {answer.text}
        </li>
      ))}
    </ul>
  );
}

function normalizeAnswerArray(data = []) {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    if (typeof item === "string") {
      return {
        id: null,
        text: item,
      };
    }

    return {
      id: item.id_jawaban ?? item.id ?? null,
      text: item.jawaban_soal ?? item.text ?? item.label ?? "-",
    };
  });
}

function getAnswerIds(answerData = [], fallbackIds = []) {
  if (Array.isArray(fallbackIds) && fallbackIds.length > 0) {
    return fallbackIds
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  }

  if (!Array.isArray(answerData)) return [];

  return answerData
    .map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return null;
      return Number(item.id_jawaban ?? item.id);
    })
    .filter((id) => !Number.isNaN(id) && id !== null);
}

const R = {
  wrap: {
    position: "fixed",
    inset: 0,
    zIndex: 13000,
    background: "#060816",
    overflowY: "auto",
    padding: 22,
    color: "rgba(235,240,255,0.92)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },

  content: {
    position: "relative",
    zIndex: 1,
    width: "min(980px, 94vw)",
    margin: "0 auto",
    textAlign: "center",
  },

  partyLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },

  partyPiece: {
    position: "absolute",
    bottom: -30,
    display: "block",
    opacity: 0,
    animationName: "quizPartyRiseFromBottom",
    animationTimingFunction: "cubic-bezier(0.18, 0.72, 0.32, 1)",
    animationIterationCount: 1,
    animationFillMode: "forwards",
    willChange: "transform, opacity",
  },

  partyStreamer: {
    position: "absolute",
    bottom: -48,
    width: 18,
    height: 34,
    borderStyle: "solid",
    borderWidth: "0 0 3px 3px",
    borderRadius: "0 0 0 16px",
    opacity: 0,
    animationName: "quizPartyStreamerRise",
    animationTimingFunction: "cubic-bezier(0.2, 0.74, 0.28, 1)",
    animationIterationCount: 1,
    animationFillMode: "forwards",
    willChange: "transform, opacity",
  },

  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "2px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.06)",
    boxShadow: "0 0 90px rgba(60,255,201,0.16)",
    fontSize: 58,
    margin: "0 auto 14px",
  },

  card: {
    width: "min(560px, 92vw)",
    margin: "18px auto 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#0d1020",
    padding: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    textAlign: "left",
  },

  title: {
    fontSize: 28,
    fontWeight: 950,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.75,
  },

  linkLike: {
    color: "rgba(140,86,255,0.95)",
    fontWeight: 800,
  },

  smallLabel: {
    fontSize: 11,
    opacity: 0.6,
    letterSpacing: 1.2,
    textAlign: "center",
  },

  scoreRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 6,
    marginTop: 6,
  },

  scoreBig: {
    fontSize: 64,
    fontWeight: 950,
    color: "rgba(140,86,255,0.95)",
    lineHeight: 1,
  },

  scoreSmall: {
    fontSize: 16,
    opacity: 0.7,
    paddingBottom: 10,
  },

  statsGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  statBox: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.25)",
    padding: 12,
    textAlign: "center",
  },

  statIcon: {
    fontSize: 18,
    opacity: 0.9,
  },

  statLabel: {
    marginTop: 6,
    fontSize: 10,
    opacity: 0.7,
    letterSpacing: 0.6,
  },

  statValue: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 900,
  },

  actions: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    width: "100%",
  },

  primaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(120,90,255,0.30)",
    background: "rgba(120,90,255,0.16)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    width: "100%",
    fontWeight: 900,
  },

  answerKeyCard: {
    width: "min(820px, 94vw)",
    margin: "18px auto 18px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#0d1020",
    padding: 24,
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    textAlign: "left",
  },

  previewTitle: {
    fontSize: 22,
    fontWeight: 950,
    marginBottom: 18,
    textAlign: "left",
  },

  reviewItem: {
    padding: "22px 0 26px",
    borderBottom: "1px solid rgba(255,255,255,0.14)",
    textAlign: "left",
  },

  reviewItemLast: {
    borderBottom: "none",
    paddingBottom: 0,
  },

  reviewListNew: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },

  reviewItemNew: {
    padding: "20px 22px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.025)",
    textAlign: "left",
  },

  questionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
  },

  questionNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    fontSize: 15,
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  },

  questionBody: {
    minWidth: 0,
    flex: 1,
  },

  questionText: {
    fontSize: 17,
    fontWeight: 900,
    lineHeight: 1.6,
    color: "rgba(245,247,255,0.96)",
  },

  questionMeta: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.72,
    lineHeight: 1.5,
  },

  correctText: {
    marginLeft: 8,
    color: "rgba(60,255,201,0.95)",
    fontWeight: 900,
  },

  wrongText: {
    marginLeft: 8,
    color: "rgba(255,130,150,0.95)",
    fontWeight: 900,
  },

  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 12,
  },

  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 15px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#111525",
  },

  optionRowCorrect: {
    border: "1px solid rgba(60,255,201,0.24)",
    background: "rgba(60,255,201,0.055)",
  },

  optionRowWrong: {
    border: "1px solid rgba(255,90,120,0.24)",
    background: "rgba(255,90,120,0.055)",
  },

  optionDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    fontSize: 14,
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.035)",
    color: "rgba(235,240,255,0.92)",
  },

  optionDotCorrect: {
    border: "1px solid rgba(60,255,201,0.42)",
    background: "rgba(60,255,201,0.12)",
    color: "rgba(60,255,201,0.98)",
  },

  optionDotWrong: {
    border: "1px solid rgba(255,90,120,0.38)",
    background: "rgba(255,90,120,0.10)",
    color: "rgba(255,120,145,0.98)",
  },

  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  optionText: {
    fontSize: 15,
    fontWeight: 850,
    lineHeight: 1.6,
    color: "rgba(245,247,255,0.94)",
  },

  summaryBox: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
    marginTop: 12,
  },

  answerRow: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginTop: 8,
  },

  answerLabel: {
    fontSize: 12,
    opacity: 0.68,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  answerValue: {
    fontSize: 15,
    fontWeight: 850,
    lineHeight: 1.6,
    color: "rgba(245,247,255,0.94)",
  },

  answerBulletList: {
    margin: "0 0 0 18px",
    padding: 0,
  },

  answerBulletItem: {
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.7,
    color: "rgba(245,247,255,0.94)",
  },

  quote: {
    marginTop: 18,
    fontSize: 11,
    opacity: 0.4,
  },

  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 1.6,
  },

  correctAnswerCard: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#111525",
    padding: "12px 14px",
  },

  correctAnswerTitle: {
    fontSize: 12,
    opacity: 0.72,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  correctAnswerContent: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,12,22,0.22)",
    padding: "10px 12px",
  },
};