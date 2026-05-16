import React, { useEffect, useState } from "react";
import { P } from "./PuzzleStyle";
import { usePuzzleTimer } from "./PuzzleTimer";
import { updatePuzzleAttemptApi } from "../../../../components/api/puzzlemap";

export default function FillBlankPuzzle({
  open,
  puzzle,
  puzzleTitle,
  moduleLabel,
  moduleName,
  xpPotential,
  secondsTotal,
  onClose,
  onFinish,
}) {
  const detail = puzzle?.detail || {};
  const { secondsElapsed, timeMM, timeSS, timeText } = usePuzzleTimer(open);

  const [answers, setAnswers] = useState({});
  const [attempt, setAttempt] = useState(Number(puzzle?.attempt || 0));
  const [popupNotif, setPopupNotif] = useState(null);

  const isDone = puzzle?.raw_status === "done" || puzzle?.status === "done";
const isPreview = isDone || puzzle?.hasil || puzzle?.jawaban;

const handleClose = () => {
  if (!isDone) {
    alert("Selesaikan puzzle terlebih dahulu sebelum kembali.");
    return;
  }

  onClose?.();
};

  useEffect(() => {
    if (!open) return;

    setAnswers({});
    setAttempt(Number(puzzle?.attempt || 0));
  }, [open, puzzle?.attempt]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
  if (e.key === "Escape") handleClose();
};
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const template = detail.template_text || "";
  const expectedAnswers = detail.expected_answers || {};

  const getInputWidth = (key) => {
    const answer = String(expectedAnswers[key] || "");
    const length = Math.max(answer.length, key.length, 4);

    return `${length + 2}ch`;
  };

  const renderTemplate = () => {
    const parts = template.split(/(<blank\d+>)/g);

    return parts.map((part, index) => {
      const match = part.match(/<blank(\d+)>/);

      if (!match) {
        return <span key={index}>{part}</span>;
      }

      const key = `blank${match[1]}`;

      return (
        <input
          key={index}
          value={answers[key] || ""}
          placeholder={key}
          onChange={(e) =>
            setAnswers((prev) => ({
              ...prev,
              [key]: e.target.value,
            }))
          }
          style={{
            ...F.blankInput,
            width: getInputWidth(key),
          }}
        />
      );
    });
  };

  const showPopupNotif = ({ type, title, message, onClose }) => {
  setPopupNotif({
    type,
    title,
    message,
    onClose,
  });
};

const closePopupNotif = () => {
  const callback = popupNotif?.onClose;

  setPopupNotif(null);

  if (typeof callback === "function") {
    callback();
  }
};

  const checkAnswer = async () => {
  if (!puzzle?.id_progress_puzzle) {
    console.error("id_progress_puzzle tidak ditemukan:", puzzle);

    showPopupNotif({
      type: "error",
      title: "Terjadi Error",
      message: "ID progress puzzle tidak ditemukan. Cek mapping selectedPuzzle.",
    });

    return;
  }

  const duration = Number(secondsElapsed || 0);

  try {
    const requiredKeys = Object.keys(expectedAnswers);

    const isComplete = requiredKeys.every((key) => {
      return String(answers[key] || "").trim() !== "";
    });

    const jawabanPayload = {
      type: "fill_blank",
      answers,
    };

    const hasilPayload = {
      template: template,
    };

    if (!isComplete) {
      const response = await updatePuzzleAttemptApi(
        puzzle.id_progress_puzzle,
        {
          is_done: false,
          waktu: duration,
          jawaban: jawabanPayload,
          hasil: hasilPayload,
        },
      );

      const finalAttempt = response?.data?.success
        ? response.data.data.current.attempt
        : attempt + 1;

      setAttempt(finalAttempt);

      showPopupNotif({
        type: "error",
        title: "Jawaban Belum Lengkap",
        message: `Semua bagian kosong harus diisi. Attempt: ${finalAttempt}`,
      });

      return;
    }

    const isCorrect = requiredKeys.every((key) => {
      const userAnswer = String(answers[key] || "").trim();
      const correctAnswer = String(expectedAnswers[key] || "").trim();

      return userAnswer === correctAnswer;
    });

    if (!isCorrect) {
      const response = await updatePuzzleAttemptApi(
        puzzle.id_progress_puzzle,
        {
          is_done: false,
          waktu: duration,
          jawaban: jawabanPayload,
          hasil: hasilPayload,
        },
      );

      const finalAttempt = response?.data?.success
        ? response.data.data.current.attempt
        : attempt + 1;

      setAttempt(finalAttempt);

      showPopupNotif({
        type: "error",
        title: "Jawaban Salah",
        message: `Jawaban masih salah. Attempt: ${finalAttempt}`,
      });

      return;
    }

    const response = await updatePuzzleAttemptApi(puzzle.id_progress_puzzle, {
      is_done: true,
      waktu: duration,
      jawaban: jawabanPayload,
      hasil: hasilPayload,
    });

    if (response?.data?.success) {
      const finalAttempt = response.data.data.current.attempt;

      setAttempt(finalAttempt);

      const finalResult = {
        puzzleTitle,
        type: "fill_blank",
        attempt: finalAttempt,
        xp: xpPotential,
        waktu: duration,
        jawaban: jawabanPayload,
        hasil: hasilPayload,
      };

      showPopupNotif({
        type: "success",
        title: "Jawaban Benar!",
        message: "Puzzle berhasil diselesaikan.",
        onClose: () => {
          onFinish?.(finalResult);
        },
      });

      return;
    }

    showPopupNotif({
      type: "error",
      title: "Gagal Menyimpan",
      message: response?.data?.message || "Gagal menyimpan progress puzzle.",
    });
  } catch (error) {
    console.error("Gagal update attempt fill blank:", error);

    showPopupNotif({
      type: "error",
      title: "Terjadi Error",
      message: "Terjadi error saat menyimpan jawaban puzzle.",
    });
  }
};

  return (
   <div style={P.overlay} onMouseDown={handleClose}>
      <div style={P.sheet} onMouseDown={(e) => e.stopPropagation()}>
        <div style={P.topbar}>
          <div style={P.breadcrumb}>
            <button style={P.backBtn} onClick={handleClose}>
              ←
            </button>
            <span style={P.muted}>Roadmap</span>
            <span style={P.muted}>›</span>
            <span style={P.crumbStrong}>
              Modul {moduleLabel} {moduleName}
            </span>
          </div>

          <div style={P.topRight}>
            <div style={P.pillXP}>⚡ POTENSI: +{xpPotential} XP</div>
          </div>
        </div>

        <div style={P.body}>
          <div style={P.header}>
            <div>
              <div style={P.badgeRow}>
                <span style={P.badge}>FILL IN THE BLANK</span>
                <span style={P.badge}>ATTEMPT: {attempt}</span>
              </div>

              <div style={P.title}>{puzzleTitle}</div>

              <div style={P.desc}>
                {detail.instruksi || "Lengkapi bagian kode yang kosong."}
              </div>
            </div>

            <div style={P.timerPill}>
              <span style={P.timerDot}>⏱</span>
              <span style={P.timerText}>{timeMM}</span>
              <span style={P.timerSep}>:</span>
              <span style={P.timerText}>{timeSS}</span>
              <span style={P.timerSmall}>berjalan</span>
            </div>
          </div>

          <div style={P.grid}>
            <div style={P.panel}>
              <div style={P.panelTitle}>Instruksi</div>

              <div style={P.tip}>
                Isi bagian kosong sesuai jawaban yang benar. Panjang input akan
                menyesuaikan panjang jawaban.
              </div>

              <div style={P.reward}>
                🏆 Reward: <b>{xpPotential} XP</b>
              </div>
            </div>

            <div style={P.panelRight}>
              <div style={P.panelHeader}>
                <div style={P.panelTitle}>Solution Editor</div>
              </div>

              <div style={P.editor}>
                <div style={P.editorTop}>
                  <div style={P.windowDots}>
                    <span style={P.dot} />
                    <span style={P.dot} />
                    <span style={P.dot} />
                  </div>
                  <div style={P.fileTab}>fill_blank.js</div>
                </div>

                <div style={P.editorBody}>
                  <div style={F.markdownBlock}>{renderTemplate()}</div>
                </div>
              </div>

              <div style={P.actions}>
                <button style={P.checkBtn} onClick={checkAnswer}>
                  Periksa Jawaban 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {popupNotif ? (
  <div style={N.overlay} onMouseDown={(e) => e.stopPropagation()}>
    <div style={N.card}>
      <div
        style={{
          ...N.iconCircle,
          ...(popupNotif.type === "success" ? N.successIcon : N.errorIcon),
        }}
      >
        {popupNotif.type === "success" ? "✓" : "✕"}
      </div>

      <div style={N.title}>{popupNotif.title}</div>
      <div style={N.message}>{popupNotif.message}</div>

      <button
        style={{
          ...N.button,
          ...(popupNotif.type === "success" ? N.successBtn : N.errorBtn),
        }}
        onClick={closePopupNotif}
      >
        Oke
      </button>
    </div>
  </div>
) : null}
    </div>
  );
}

const F = {
  markdownBlock: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 1.9,
    whiteSpace: "pre-wrap",
  },

  blankInput: {
    background: "rgba(140,86,255,0.12)",
    border: "1px solid rgba(140,86,255,0.25)",
    borderRadius: 8,
    padding: "4px 8px",
    margin: "0 4px",
    color: "white",
    fontSize: 12,
    minWidth: "6ch",
    maxWidth: "28ch",
    outline: "none",
    fontFamily: "monospace",
  },
};

const N = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 20000,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    width: "min(390px, 92vw)",
    borderRadius: 24,
    padding: "28px 24px 22px",
    background:
      "linear-gradient(180deg, rgba(20,22,38,0.98), rgba(10,12,22,0.98))",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
    color: "rgba(235,240,255,0.94)",
    textAlign: "center",
    animation: "popupScale 0.18s ease-out",
  },

  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 16px",
    fontSize: 42,
    fontWeight: 950,
  },

  successIcon: {
    background: "rgba(60,255,201,0.13)",
    border: "2px solid rgba(60,255,201,0.42)",
    color: "rgba(60,255,201,0.95)",
    boxShadow: "0 0 45px rgba(60,255,201,0.18)",
  },

  errorIcon: {
    background: "rgba(255,90,120,0.13)",
    border: "2px solid rgba(255,90,120,0.42)",
    color: "rgba(255,105,135,0.98)",
    boxShadow: "0 0 45px rgba(255,90,120,0.16)",
  },

  title: {
    fontSize: 22,
    fontWeight: 950,
    marginBottom: 8,
  },

  message: {
    fontSize: 14,
    lineHeight: 1.6,
    opacity: 0.78,
    marginBottom: 22,
  },

  button: {
    width: "100%",
    borderRadius: 14,
    padding: "12px 16px",
    color: "rgba(235,240,255,0.96)",
    cursor: "pointer",
    fontWeight: 900,
  },

  successBtn: {
    border: "1px solid rgba(60,255,201,0.35)",
    background: "rgba(60,255,201,0.14)",
  },

  errorBtn: {
    border: "1px solid rgba(255,90,120,0.35)",
    background: "rgba(255,90,120,0.14)",
  },
};