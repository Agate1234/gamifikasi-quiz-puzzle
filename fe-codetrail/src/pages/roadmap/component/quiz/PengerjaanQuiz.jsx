import React, { useEffect, useMemo, useState } from "react";
import HasilQuiz from "./HasilQuiz";
import {
  getNextSoalMahasiswaApi,
  submitJawabanMahasiswaApi,
} from "../../../../components/api/soal";

export default function QuizFullscreen({
  open,
  quizId,
  quizTitle,
  quizXp = 0,
  onClose,
  onFinish,
}) {
  const INITIAL_HEALTH = 100;
  const QUIZ_TOTAL_SECONDS = 30 * 60;

  const [currentSoal, setCurrentSoal] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_TOTAL_SECONDS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [progressInfo, setProgressInfo] = useState({
    nomor_soal: 1,
    total_soal: 10,
    total_dijawab: 0,
    total_benar: 0,
  });
  const [health, setHealth] = useState(INITIAL_HEALTH);

  const timeText = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const secondsElapsed = QUIZ_TOTAL_SECONDS - secondsLeft;
  const isTimeUp = secondsLeft <= 0;

  const progress = useMemo(() => {
    if (!progressInfo.total_soal) return 0;

    return Math.min(
      1,
      Number(progressInfo.nomor_soal || 1) /
        Number(progressInfo.total_soal || 1),
    );
  }, [progressInfo]);

  const isMultipleChoice = currentSoal?.type === "checkbox";

  useEffect(() => {
    if (!open) return;

    setCurrentSoal(null);
    setSelected([]);
    setShowResult(false);
    setResult(null);
    setSecondsLeft(QUIZ_TOTAL_SECONDS);
    setHealth(INITIAL_HEALTH);
    setErrorMessage("");
    setProgressInfo({
      nomor_soal: 1,
      total_soal: 10,
      total_dijawab: 0,
      total_benar: 0,
    });

    if (quizId) {
      fetchNextSoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quizId]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || showResult) return;

    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) return 0;
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, showResult]);

  useEffect(() => {
    if (!open || showResult) return;

    if (secondsLeft <= 0) {
      setErrorMessage("Waktu quiz sudah habis.");
    }
  }, [open, showResult, secondsLeft]);

  const fetchNextSoal = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getNextSoalMahasiswaApi(quizId);

      if (response?.status !== 200 || !response?.data?.success) {
        setErrorMessage(response?.data?.message || "Gagal mengambil soal.");
        return;
      }

      const payload = response.data.data;

      if (payload?.finished) {
        const finalResult = buildResultSummary({
          score: payload.score || 0,
          expEarned: payload.exp_earned || 0,
          totalSoal: payload.progress?.total_soal || payload.total_soal || 10,
          totalBenar:
            payload.progress?.total_benar || payload.total_benar || 0,
          waktuPenyelesaian: payload.waktu_penyelesaian || null,
          secondsElapsed,
          timeText,
          review: payload.review || [],
        });

        setHealth(Number(payload.score || 0));
        setResult(finalResult);
        setShowResult(true);
        onFinish?.(finalResult);
        return;
      }

      setCurrentSoal(payload);

      setProgressInfo(
        payload.progress || {
          nomor_soal: 1,
          total_soal: 10,
          total_dijawab: 0,
          total_benar: 0,
        },
      );

      setHealth(
        typeof payload.health_remaining === "number"
          ? Number(payload.health_remaining)
          : INITIAL_HEALTH,
      );

      setSelected([]);
    } catch (error) {
      console.error("Gagal mengambil soal:", error);
      setErrorMessage("Terjadi kesalahan saat mengambil soal.");
    } finally {
      setLoading(false);
    }
  };

  const pickOption = (idJawaban) => {
    if (!currentSoal || isTimeUp) return;

    if (isMultipleChoice) {
      setSelected((prev) => {
        if (prev.includes(idJawaban)) {
          return prev.filter((item) => item !== idJawaban);
        }

        return [...prev, idJawaban];
      });

      return;
    }

    setSelected([idJawaban]);
  };

  const isChecked = (idJawaban) => {
    return selected.includes(idJawaban);
  };

  const handleSubmitJawaban = async () => {
    if (!currentSoal || selected.length < 1 || submitting || isTimeUp) return;

    try {
      setSubmitting(true);
      setErrorMessage("");

      const response = await submitJawabanMahasiswaApi(quizId, {
        id_soal: currentSoal.id,
        jawaban_ids: selected,
      });

      if (response?.status !== 200 || !response?.data?.success) {
        setErrorMessage(response?.data?.message || "Gagal mengirim jawaban.");
        return;
      }

      const payload = response.data.data;

      setHealth(Number(payload.health_remaining ?? payload.score ?? health));

      if (payload.finished) {
        const finalResult = buildResultSummary({
          score: payload.score || 0,
          expEarned: payload.exp_earned || 0,
          totalSoal: payload.progress?.total_soal || payload.total_soal || 10,
          totalBenar:
            payload.progress?.total_benar || payload.total_benar || 0,
          waktuPenyelesaian: payload.waktu_penyelesaian || null,
          secondsElapsed,
          timeText,
          review: payload.review || [],
        });

        setResult(finalResult);
        setShowResult(true);
        onFinish?.(finalResult);
        return;
      }

      await fetchNextSoal();
    } catch (error) {
      console.error("Gagal submit jawaban:", error);
      setErrorMessage("Terjadi kesalahan saat mengirim jawaban.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div style={S.overlay} onMouseDown={onClose}>
      <div style={S.sheet} onMouseDown={(e) => e.stopPropagation()}>
        {showResult ? (
          <HasilQuiz
            open={true}
            quizTitle={quizTitle || "Kuis"}
            result={result}
            questions={[]}
            selectedMap={{}}
            onBackToModule={() => {
              setShowResult(false);
              onClose?.();
            }}
          />
        ) : (
          <>
            <div style={S.topbar}>
              <div style={S.topbarLeft}>
                <button style={S.backIconBtn} onClick={onClose}>
                  ←
                </button>

                <div style={S.titleWrap}>
                  <div style={S.eyebrow}>Quiz Adaptive</div>
                  <div style={S.quizTitle}>{quizTitle || "Kuis"}</div>
                </div>
              </div>

              <div style={S.topbarRight}>
                <div style={S.topPill}>XP Quiz: +{quizXp}</div>
                <div style={S.topPill}>
                  Soal {progressInfo.nomor_soal || 1}/
                  {progressInfo.total_soal || 10}
                </div>
              </div>
            </div>

            <div style={S.main}>
              <div style={S.mainInner}>
                <div style={S.statusRow}>
                  <div style={S.statusLeft}>
                    <div style={S.bigTitle}>
                      Pertanyaan {progressInfo.nomor_soal || 1}
                      <span style={S.bigTitleSoft}>
                        {" "}
                        dari {progressInfo.total_soal || 10}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      ...S.timerPill,
                      ...(isTimeUp ? S.timerPillDanger : {}),
                    }}
                  >
                    <span>⏱</span>
                    <span style={{ fontWeight: 900 }}>{timeText}</span>
                  </div>
                </div>

                <div style={S.progressWrap}>
                  <div style={S.progressOuter}>
                    <div
                      style={{
                        ...S.progressInner,
                        width: `${progress * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={S.contentArea}>
                  <div style={S.playerColumn}>
                    <div style={S.profileHpCard}>
                      <div style={S.profileTop}>
                        <div style={S.avatarMini}>F</div>
                        <div>
                          <div style={S.profileName}>Faiz</div>
                          <div style={S.profileSub}>Player Quiz</div>
                        </div>
                      </div>

                      <div style={S.hpMiniWrap}>
                        <div style={S.hpHeader}>
                          <span>Health</span>
                          <span>
                            {health}/{INITIAL_HEALTH}
                          </span>
                        </div>

                        <div style={S.hpMiniTrack}>
                          <div
                            style={{
                              ...S.hpMiniFill,
                              width: `${Math.max(
                                0,
                                (health / INITIAL_HEALTH) * 100,
                              )}%`,
                              background:
                                health > 60
                                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                                  : health > 30
                                    ? "linear-gradient(90deg, #facc15, #fde047)"
                                    : "linear-gradient(90deg, #ef4444, #f87171)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={S.soalColumn}>
                    {loading ? (
                      <div style={S.card}>
                        <div style={S.stateBox}>Memuat soal...</div>
                      </div>
                    ) : errorMessage ? (
                      <div style={S.card}>
                        <div style={S.stateBox}>{errorMessage}</div>

                        <div style={S.footerRow}>
                          <button style={S.secondaryBtn} onClick={onClose}>
                            Kembali
                          </button>

                          {!isTimeUp ? (
                            <button style={S.primaryBtn} onClick={fetchNextSoal}>
                              Coba Lagi
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : !currentSoal ? (
                      <div style={S.card}>
                        <div style={S.stateBox}>Soal belum tersedia.</div>
                      </div>
                    ) : (
                      <div style={S.card}>
                        <div style={S.cardTopRow}>
                          <div style={S.questionLabel}>Pertanyaan</div>

                          <div style={S.difficultyBadge}>
                            Difficulty: {currentSoal?.difficulty || "-"}
                          </div>
                        </div>

                        <div style={S.questionBlock}>
                          <div style={S.qTitle}>{currentSoal.question}</div>
                        </div>

                        <div style={S.options}>
                          {(currentSoal.jawaban || []).map((opt) => {
                            const active = isChecked(opt.id_jawaban);

                            return (
                              <button
                                key={opt.id_jawaban}
                                onClick={() => pickOption(opt.id_jawaban)}
                                disabled={isTimeUp}
                                style={{
                                  ...S.optionBtn,
                                  ...(active ? S.optionBtnActive : {}),
                                  ...(isTimeUp ? S.optionBtnDisabled : {}),
                                }}
                              >
                                <div
                                  style={{
                                    ...S.radio,
                                    ...(active ? S.radioActive : {}),
                                  }}
                                />
                                <div style={S.optionText}>
                                  {opt.jawaban_soal}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div style={S.footerRow}>
                          <button style={S.secondaryBtn} onClick={onClose}>
                            Kembali
                          </button>

                          <button
                            style={{
                              ...S.primaryBtn,
                              ...(selected.length < 1 || submitting || isTimeUp
                                ? S.primaryBtnDisabled
                                : {}),
                            }}
                            onClick={handleSubmitJawaban}
                            disabled={selected.length < 1 || submitting || isTimeUp}
                          >
                            {isTimeUp
                              ? "Waktu Habis"
                              : submitting
                                ? "Mengirim..."
                                : "Kirim Jawaban →"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function buildResultSummary({
  score,
  expEarned,
  totalSoal,
  totalBenar,
  waktuPenyelesaian,
  secondsElapsed,
  timeText,
  review = [],
}) {
  const accuracy =
    totalSoal > 0
      ? Math.round((Number(totalBenar) / Number(totalSoal)) * 100)
      : 0;

  return {
    correct: totalBenar,
    total: totalSoal,
    score100: score,
    xpEarned: expEarned,
    accuracy,
    timeText,
    secondsElapsed,
    totalQuestions: totalSoal,
    waktu_penyelesaian: waktuPenyelesaian,
    review,
  };
}

const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 11000,
    background: "rgba(2, 6, 23, 0.62)",
    backdropFilter: "blur(8px)",
  },

  sheet: {
    width: "100%",
    height: "100%",
    background:
      "radial-gradient(900px 500px at 50% 12%, rgba(55, 65, 255, 0.22) 0%, rgba(18, 24, 56, 0.35) 25%, #060816 72%)",
    color: "#eef2ff",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    overflow: "hidden",
    position: "relative",
  },

  topbar: {
    height: 72,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    backdropFilter: "blur(8px)",
  },

  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
  },

  backIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#eef2ff",
    cursor: "pointer",
    fontSize: 18,
    flexShrink: 0,
  },

  titleWrap: {
    minWidth: 0,
  },

  eyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.7,
    fontWeight: 700,
  },

  quizTitle: {
    fontSize: 18,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  topPill: {
    fontSize: 12,
    fontWeight: 700,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(238,242,255,0.92)",
  },

  main: {
    height: "calc(100% - 72px)",
    overflowY: "auto",
    padding: "32px 24px 64px",
  },

  mainInner: {
    width: "min(1320px, 100%)",
    margin: "0 auto",
  },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  statusLeft: {
    flex: 1,
    minWidth: 280,
  },

  bigTitle: {
    fontSize: 42,
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: -0.8,
  },

  bigTitleSoft: {
    color: "rgba(238,242,255,0.56)",
    fontWeight: 800,
  },

  timerPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 110,
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: 16,
    border: "1px solid rgba(139, 92, 246, 0.30)",
    background: "rgba(139, 92, 246, 0.16)",
    fontSize: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
  },

  timerPillDanger: {
    border: "1px solid rgba(239,68,68,0.38)",
    background: "rgba(239,68,68,0.16)",
  },

  progressWrap: {
    marginBottom: 24,
  },

  progressOuter: {
    width: "100%",
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
      "linear-gradient(90deg, rgba(139,92,246,0.98), rgba(99,102,241,0.90), rgba(45,212,191,0.90))",
    boxShadow: "0 0 18px rgba(99,102,241,0.28)",
  },

  contentArea: {
    display: "flex",
    alignItems: "flex-end",
    gap: 28,
    width: "100%",
  },

  playerColumn: {
    width: 360,
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-end",
  },

  soalColumn: {
    flex: 1,
    minWidth: 0,
    maxWidth: 920,
  },

  profileHpCard: {
    width: "100%",
    borderRadius: 24,
    border: "1px solid rgba(139,92,246,0.28)",
    background: "rgba(15,23,42,0.58)",
    padding: 22,
    boxShadow: "0 24px 60px rgba(0,0,0,0.32)",
  },

  profileTop: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  avatarMini: {
    width: 56,
    height: 56,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    color: "#06111f",
    background: "linear-gradient(135deg, #8b5cf6, #5eead4)",
  },

  profileName: {
    fontSize: 16,
    fontWeight: 900,
  },

  profileSub: {
    marginTop: 3,
    fontSize: 12,
    opacity: 0.7,
  },

  hpMiniWrap: {
    marginTop: 18,
  },

  hpHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 8,
  },

  hpMiniTrack: {
    height: 14,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  hpMiniFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.2s ease",
  },

  card: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15, 23, 42, 0.54)",
    padding: 26,
    boxShadow: "0 24px 60px rgba(0,0,0,0.32)",
    backdropFilter: "blur(8px)",
  },

  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 10,
    flexWrap: "wrap",
  },

  questionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    opacity: 0.6,
    marginBottom: 8,
    fontWeight: 700,
  },

  difficultyBadge: {
    fontSize: 12,
    padding: "9px 14px",
    borderRadius: 999,
    background: "rgba(139, 92, 246, 0.14)",
    border: "1px solid rgba(139, 92, 246, 0.30)",
    color: "rgba(238,242,255,0.95)",
    fontWeight: 700,
    marginLeft: "auto",
  },

  questionBlock: {
    marginBottom: 22,
  },

  qTitle: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.35,
    color: "#f8fafc",
  },

  options: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    minHeight: 64,
    padding: "16px 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    color: "#eef2ff",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.18s ease",
  },

  optionBtnActive: {
    border: "1px solid rgba(139,92,246,0.42)",
    background: "rgba(139,92,246,0.18)",
  },

  optionBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.28)",
    flexShrink: 0,
  },

  radioActive: {
    border: "5px solid rgba(139,92,246,0.95)",
    background: "#eef2ff",
  },

  optionText: {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.4,
  },

  footerRow: {
    marginTop: 22,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#eef2ff",
    cursor: "pointer",
    fontWeight: 800,
  },

  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(139,92,246,0.42)",
    background: "rgba(139,92,246,0.25)",
    color: "#eef2ff",
    cursor: "pointer",
    fontWeight: 900,
  },

  primaryBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  stateBox: {
    fontSize: 15,
    opacity: 0.86,
    lineHeight: 1.6,
  },
};