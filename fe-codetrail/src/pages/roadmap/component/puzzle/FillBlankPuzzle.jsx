import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  tutorActive = false,
  onTutorPuzzleFinished,
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

    const savedAnswers = puzzle?.jawaban?.answers || {};

    setAnswers(isPreview ? savedAnswers : {});
    setAttempt(Number(puzzle?.attempt || 0));
  }, [open, puzzle?.attempt, puzzle?.jawaban, isPreview]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (tutorActive && !isDone) return;
        handleClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, tutorActive, isDone]);

  if (!open) return null;

  const template = detail.template_text || "";
  const expectedAnswers = detail.expected_answers || {};

  const normalizeText = (value) => {
    return String(value || "").trim().toLowerCase();
  };

  const getInputWidth = (key) => {
    const answer = String(expectedAnswers[key] || "");
    const currentAnswer = String(answers[key] || "");
    const length = Math.max(answer.length, currentAnswer.length, key.length, 4);

    return `${Math.min(length + 2, 28)}ch`;
  };

  const renderTemplate = () => {
    const parts = template.split(/(<blank\d+>|\{\{blank\d+\}\})/g);

    return parts.map((part, index) => {
      const angleMatch = part.match(/^<blank(\d+)>$/);
      const curlyMatch = part.match(/^\{\{blank(\d+)\}\}$/);

      const match = angleMatch || curlyMatch;

      if (!match) {
        return <span key={index}>{part}</span>;
      }

      const key = `blank${match[1]}`;

      return (
        <input
          key={index}
          value={answers[key] || ""}
          placeholder={key}
          disabled={isDone}
          onChange={(e) =>
            setAnswers((prev) => ({
              ...prev,
              [key]: e.target.value,
            }))
          }
          style={{
            ...F.blankInput,
            ...(isDone ? F.blankInputDisabled : {}),
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
        template,
        expected_answers: expectedAnswers,
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
        const userAnswer = normalizeText(answers[key]);
        const correctAnswer = normalizeText(expectedAnswers[key]);

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
            if (tutorActive) onTutorPuzzleFinished?.();
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

        <div style={P.body} data-tutor="puzzle-fill-area">
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
            <div style={P.panel} data-tutor="fill-instruction">
              <div style={P.panelTitle}>Instruksi</div>

              <div style={P.tip}>
                Isi bagian kosong sesuai jawaban yang benar. Format kosong bisa
                memakai <b>{"<blank1>"}</b> atau <b>{"{{blank1}}"}</b>.
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

                <div style={P.editorBody} data-tutor="fill-editor">
                  <div style={F.markdownBlock}>{renderTemplate()}</div>
                </div>
              </div>

              {!isDone ? (
                <div style={P.actions}>
                  <button
                    data-tutor="fill-submit"
                    style={P.checkBtn}
                    onClick={checkAnswer}
                  >
                    Periksa Jawaban 🚀
                  </button>
                </div>
              ) : (
                <div style={P.actions}>
                  <button style={P.checkBtn} onClick={onClose}>
                    Kembali ke Modul
                  </button>
                </div>
              )}
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

      <InlineWorkTutor
        open={tutorActive && !isDone}
        steps={[
          {
            title: "Instruksi Puzzle",
            body: "Bagian ini menjelaskan tugas puzzle dan reward XP yang bisa kamu dapat.",
            target: '[data-tutor="fill-instruction"]',
          },
          {
            title: "Editor Jawaban",
            body: "Di sini kode ditampilkan. Bagian kosong yang berbentuk input harus kamu isi dengan jawaban yang tepat.",
            target: '[data-tutor="fill-editor"]',
          },
          {
            title: "Periksa Jawaban",
            body: "Setelah semua bagian kosong terisi, klik tombol ini untuk mengecek jawaban. Jika salah, attempt akan bertambah.",
            target: '[data-tutor="fill-submit"]',
          },
        ]}
      />
    </div>
  );
}

function InlineWorkTutor({ open, steps = [] }) {
  const [index, setIndex] = React.useState(0);
  const [hidden, setHidden] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);

  const step = steps[index];
  const active = open && !hidden && !!step;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setIndex(0);
      setHidden(false);
      setRect(null);
      return;
    }
  }, [open]);

  React.useEffect(() => {
    if (!active) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("wheel", preventScroll, {
      passive: false,
      capture: true,
    });

    window.addEventListener("touchmove", preventScroll, {
      passive: false,
      capture: true,
    });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("wheel", preventScroll, true);
      window.removeEventListener("touchmove", preventScroll, true);
    };
  }, [active]);

  React.useEffect(() => {
    if (!active) return;

    let timer = null;
    let interval = null;
    let cancelled = false;
    let retry = 0;

    const update = () => {
      if (cancelled) return;

      if (!step?.target) {
        setRect(null);
        return;
      }

      const el = document.querySelector(step.target);

      if (!el) {
        setRect(null);

        if (retry < 25) {
          retry += 1;
          timer = window.setTimeout(update, 140);
        }

        return;
      }

      el.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });

      window.clearTimeout(timer);

      timer = window.setTimeout(() => {
        if (cancelled) return;

        const r = el.getBoundingClientRect();

        setRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          right: r.right,
          bottom: r.bottom,
        });
      }, 260);
    };

    update();
    interval = window.setInterval(update, 850);
    window.addEventListener("resize", update);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener("resize", update);
    };
  }, [active, step?.target, index]);

  const finish = () => {
    setHidden(true);
  };

  if (!active || !mounted) return null;

  const total = steps.length;
  const isLast = index >= total - 1;
  const pad = Number(step.padding ?? 10);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const box = rect
    ? (() => {
        const top = Math.max(8, rect.top - pad);
        const left = Math.max(8, rect.left - pad);
        const right = Math.min(vw - 8, rect.right + pad);
        const bottom = Math.min(vh - 8, rect.bottom + pad);

        return {
          top,
          left,
          right,
          bottom,
          width: Math.max(0, right - left),
          height: Math.max(0, bottom - top),
        };
      })()
    : null;

  const cardWidth = Math.min(390, vw - 28);
  const cardHeight = 214;
  const gap = 16;

  let cardPos = {
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };

  if (box) {
    const canBelow = box.bottom + gap + cardHeight <= vh - 12;
    const canAbove = box.top - gap - cardHeight >= 12;
    const canRight = box.right + gap + cardWidth <= vw - 12;
    const canLeft = box.left - gap - cardWidth >= 12;

    if (canBelow || canAbove) {
      const top = canBelow ? box.bottom + gap : box.top - gap - cardHeight;
      const left = Math.min(
        Math.max(14, box.left + box.width / 2 - cardWidth / 2),
        vw - cardWidth - 14,
      );

      cardPos = {
        top,
        left,
        transform: "none",
      };
    } else if (canRight || canLeft) {
      const left = canRight ? box.right + gap : box.left - cardWidth - gap;
      const top = Math.min(
        Math.max(14, box.top + box.height / 2 - cardHeight / 2),
        vh - cardHeight - 14,
      );

      cardPos = {
        top,
        left,
        transform: "none",
      };
    } else {
      cardPos = {
        left: "50%",
        bottom: 18,
        transform: "translateX(-50%)",
      };
    }
  }

  const blockClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const content = (
    <div style={IT.layer}>
      <style>{`
        @keyframes inlineTutorGlow {
          0%, 100% {
            box-shadow:
              0 0 24px rgba(91,255,215,0.48),
              inset 0 0 12px rgba(91,255,215,0.10);
          }
          50% {
            box-shadow:
              0 0 42px rgba(91,255,215,0.90),
              inset 0 0 18px rgba(91,255,215,0.16);
          }
        }
      `}</style>

      {box ? (
        <>
          <div
            style={{
              ...IT.dimBlock,
              top: 0,
              left: 0,
              right: 0,
              height: box.top,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...IT.dimBlock,
              top: box.bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...IT.dimBlock,
              top: box.top,
              left: 0,
              width: box.left,
              height: box.height,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...IT.dimBlock,
              top: box.top,
              left: box.right,
              right: 0,
              height: box.height,
            }}
            onMouseDown={blockClick}
            onClick={blockClick}
          />

          <div
            style={{
              ...IT.highlight,
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height,
            }}
          />
        </>
      ) : (
        <div style={IT.fullDim} onMouseDown={blockClick} onClick={blockClick} />
      )}

      <div style={{ ...IT.cardWrap, width: cardWidth, ...cardPos }}>
        <div
          style={IT.card}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={IT.badge}>Tutorial {index + 1}/{total}</div>
          <div style={IT.title}>{step.title}</div>
          <div style={IT.body}>{step.body}</div>

          <div style={IT.actions}>
            <button type="button" style={IT.skipBtn} onClick={finish}>
              Lewati
            </button>

            <button
              type="button"
              style={IT.primaryBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (isLast) {
                  finish();
                  return;
                }

                setIndex((value) => value + 1);
              }}
            >
              {isLast ? "Oke, paham" : "Lanjut"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

const IT = {
  layer: {
    position: "fixed",
    inset: 0,
    zIndex: 29990,
    pointerEvents: "none",
  },
  dimBlock: {
    position: "fixed",
    background: "rgba(2, 3, 10, 0.58)",
    backdropFilter: "blur(2px)",
    pointerEvents: "auto",
    transition: "all 260ms ease",
    zIndex: 29990,
  },
  fullDim: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 3, 10, 0.58)",
    backdropFilter: "blur(2px)",
    pointerEvents: "auto",
    zIndex: 29990,
  },
  highlight: {
    position: "fixed",
    zIndex: 29991,
    border: "2px solid rgba(91,255,215,0.98)",
    borderRadius: 18,
    boxShadow:
      "0 0 28px rgba(91,255,215,0.48), inset 0 0 14px rgba(91,255,215,0.10)",
    background: "rgba(91,255,215,0.14)",
    pointerEvents: "none",
    transition: "all 260ms ease",
    animation: "inlineTutorGlow 1.7s ease-in-out infinite",
  },
  cardWrap: {
    position: "fixed",
    zIndex: 30000,
    pointerEvents: "auto",
    transition:
      "top 280ms ease, left 280ms ease, bottom 280ms ease, transform 280ms ease",
  },
  card: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "linear-gradient(180deg, #15182a 0%, #0c0e18 100%)",
    color: "#f5f8ff",
    boxShadow: "0 24px 80px rgba(0,0,0,0.75)",
    padding: 18,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  badge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(91,255,215,0.22)",
    background: "#123c38",
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 950,
    lineHeight: 1.25,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 1.65,
    opacity: 1,
    whiteSpace: "pre-line",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginTop: 18,
  },
  skipBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#1b2033",
    color: "#f5f8ff",
    borderRadius: 12,
    padding: "10px 13px",
    fontWeight: 850,
    cursor: "pointer",
  },
  primaryBtn: {
    border: "none",
    background: "linear-gradient(135deg, #7c5cff, #32dbc6)",
    color: "white",
    borderRadius: 12,
    padding: "10px 15px",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(80,90,255,0.28)",
  },
};

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

  blankInputDisabled: {
    opacity: 0.78,
    cursor: "not-allowed",
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