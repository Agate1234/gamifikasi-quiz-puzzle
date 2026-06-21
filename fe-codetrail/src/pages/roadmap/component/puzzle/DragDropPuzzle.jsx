import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { P } from "./PuzzleStyle";
import { usePuzzleTimer } from "./PuzzleTimer";
import {
  savePuzzleProgressApi,
  updatePuzzleAttemptApi,
} from "../../../../components/api/puzzlemap";

function shuffleArray(array) {
  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied;
}

export default function DragDropPuzzle({
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
  const { secondsElapsed, timeMM, timeSS, timeText } = usePuzzleTimer(
    open,
    Number(puzzle?.waktu || 0),
    puzzle?.id_progress_puzzle ||
      puzzle?.id_puzzle ||
      puzzle?.id ||
      "drag-drop",
  );
  const [popupNotif, setPopupNotif] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [slots, setSlots] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [attempt, setAttempt] = useState(Number(puzzle?.attempt || 0));
  const [isSolved, setIsSolved] = useState(
    puzzle?.raw_status === "done" || puzzle?.status === "done",
  );

  const isDone = isSolved;

  const items = useMemo(() => {
    const raw = detail.items || [];

    return raw.map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `snippet-${index + 1}`,
          code: item,
        };
      }

      return {
        id: item.id || `snippet-${index + 1}`,
        code: item.code || item.text || "",
      };
    });
  }, [detail.items]);

  const expectedOrder = useMemo(() => {
    const raw = detail.expected_order || [];

    return raw.map((item) => {
      if (typeof item === "string") return item;
      return item.code || item.text || "";
    });
  }, [detail.expected_order]);

  const normalizeJsonValue = (value, fallback = {}) => {
    if (!value) return fallback;

    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }

    if (typeof value === "object") return value;

    return fallback;
  };

  const buildSlotsFromSavedAnswer = (savedAnswer = []) => {
    return expectedOrder.map((_, index) => {
      const code = savedAnswer[index];

      return {
        id: `slot-${index + 1}`,
        label: `Baris ${index + 1}`,
        value:
          code !== null && code !== undefined && code !== ""
            ? {
                id: `saved-${index + 1}`,
                code,
              }
            : null,
      };
    });
  };

  const buildRemainingSnippets = (savedAnswer = []) => {
    const usedCount = {};

    savedAnswer
      .filter((code) => code !== null && code !== undefined && code !== "")
      .forEach((code) => {
        usedCount[code] = (usedCount[code] || 0) + 1;
      });

    return items.filter((item) => {
      const code = item.code;

      if (!usedCount[code]) {
        return true;
      }

      usedCount[code] -= 1;
      return false;
    });
  };

  useEffect(() => {
    if (!open) return;

    const done = puzzle?.raw_status === "done" || puzzle?.status === "done";
    const jawaban = normalizeJsonValue(puzzle?.jawaban, {});
    const hasil = normalizeJsonValue(puzzle?.hasil, {});
    const savedAnswer = Array.isArray(jawaban?.answer)
      ? jawaban.answer
      : Array.isArray(hasil?.answer)
        ? hasil.answer
        : [];

    const hasSavedProgress =
      savedAnswer.length > 0 ||
      puzzle?.status === "progress" ||
      Number(puzzle?.waktu || 0) > 0 ||
      Boolean(puzzle?.jawaban) ||
      Boolean(puzzle?.hasil);

    setIsSolved(done);
    setAttempt(Number(puzzle?.attempt || 0));

    if (hasSavedProgress) {
      setSlots(buildSlotsFromSavedAnswer(savedAnswer));
      setSnippets(shuffleArray(buildRemainingSnippets(savedAnswer)));
    } else {
      setSnippets(shuffleArray(items));

      setSlots(
        expectedOrder.map((_, index) => ({
          id: `slot-${index + 1}`,
          label: `Baris ${index + 1}`,
          value: null,
        })),
      );
    }

    setDragging(null);
  }, [open, items, expectedOrder, puzzle]);

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
  }, [open, onClose]);

  const allowDrop = (e) => e.preventDefault();

  const onDragStartFromBank = (snippetId) => {
    setDragging({ from: "bank", id: snippetId });
  };

  const onDragStartFromSlot = (slotId) => {
    setDragging({ from: "slot", id: slotId });
  };

  const dropToSlot = (slotId) => {
    if (!dragging) return;

    const targetSlot = slots.find((slot) => slot.id === slotId);
    if (!targetSlot) return;

    if (dragging.from === "bank") {
      const snippet = snippets.find((item) => item.id === dragging.id);
      if (!snippet) return;

      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === slotId ? { ...slot, value: snippet } : slot,
        ),
      );

      setSnippets((prev) => prev.filter((item) => item.id !== dragging.id));

      if (targetSlot.value) {
        setSnippets((prev) => [...prev, targetSlot.value]);
      }
    }

    if (dragging.from === "slot") {
      const fromSlot = slots.find((slot) => slot.id === dragging.id);
      if (!fromSlot?.value) return;

      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.id === dragging.id) return { ...slot, value: null };
          if (slot.id === slotId) return { ...slot, value: fromSlot.value };
          return slot;
        }),
      );

      if (targetSlot.value) {
        setSnippets((prev) => [...prev, targetSlot.value]);
      }
    }

    setDragging(null);
  };

  const dropToBank = () => {
    if (!dragging || dragging.from !== "slot") return;

    const fromSlot = slots.find((slot) => slot.id === dragging.id);
    if (!fromSlot?.value) return;

    setSnippets((prev) => [...prev, fromSlot.value]);

    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === dragging.id ? { ...slot, value: null } : slot,
      ),
    );

    setDragging(null);
  };

  const resetAll = () => {
    const backToBank = slots
      .filter((slot) => slot.value)
      .map((slot) => slot.value);

    setSnippets((prev) => shuffleArray([...prev, ...backToBank]));

    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        value: null,
      })),
    );
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

  const getCurrentAnswer = () => {
    return slots.map((slot) => slot.value?.code || null);
  };

  const saveProgressOnly = async () => {
    if (!open || !puzzle?.id_progress_puzzle || isDone) return;

    try {
      const userAnswer = getCurrentAnswer();

      await savePuzzleProgressApi(puzzle.id_progress_puzzle, {
        waktu: Number(secondsElapsed || 0),
        jawaban: {
          type: "drag_drop",
          answer: userAnswer,
        },
        hasil: {
          expectedOrder,
        },
      });
    } catch (error) {
      console.error("Gagal autosave progress puzzle:", error);
    }
  };

  const handleClose = async () => {
    await saveProgressOnly();
    onClose?.();
  };

  useEffect(() => {
    if (!open || isDone || !puzzle?.id_progress_puzzle) return;
    if (secondsElapsed <= 0 || secondsElapsed % 3 !== 0) return;

    saveProgressOnly();
  }, [open, isDone, puzzle?.id_progress_puzzle, secondsElapsed, slots]);

  const checkAnswer = async () => {
    const newAttempt = attempt + 1;

    try {
      const userAnswer = getCurrentAnswer();
      const isComplete = userAnswer.every((item) => item !== null);

      const duration = Number(secondsElapsed || 0);

      if (!isComplete) {
        const response = await updatePuzzleAttemptApi(
          puzzle.id_progress_puzzle,
          {
            is_done: false,
            waktu: duration,
            jawaban: {
              type: "drag_drop",
              answer: userAnswer,
            },
            hasil: {
              expectedOrder,
            },
          },
        );

        if (response?.data?.success) {
          setAttempt(response.data.data.current.attempt);
        } else {
          setAttempt(newAttempt);
        }
        showPopupNotif({
          type: "error",
          title: "Jawaban Belum Lengkap",
          message: `Semua slot harus diisi. Attempt: ${newAttempt}`,
        });

        return;
      }

      const isCorrect =
        userAnswer.length === expectedOrder.length &&
        userAnswer.every((code, index) => code === expectedOrder[index]);

      if (!isCorrect) {
        const response = await updatePuzzleAttemptApi(
          puzzle.id_progress_puzzle,
          {
            is_done: false,
            waktu: duration,
            jawaban: {
              type: "drag_drop",
              answer: userAnswer,
            },
            hasil: {
              expectedOrder,
            },
          },
        );

        if (response?.data?.success) {
          setAttempt(response.data.data.current.attempt);
        } else {
          setAttempt(newAttempt);
        }

        showPopupNotif({
          type: "error",
          title: "Jawaban Salah",
          message: `Urutan masih salah. Attempt: ${newAttempt}`,
        });

        return;
      }

      const response = await updatePuzzleAttemptApi(puzzle.id_progress_puzzle, {
        is_done: true,
        waktu: duration,
        jawaban: {
          type: "drag_drop",
          answer: userAnswer,
        },
        hasil: {
          expectedOrder,
        },
      });

      if (response?.data?.success) {
        const finalAttempt = response.data.data.current.attempt;

        setAttempt(finalAttempt);
        setIsSolved(true);
        setSnippets([]);

        const finalResult = {
          attempt: response.data.data.current.attempt,
          xp: xpPotential,
          waktu: duration,
          type: "drag_drop",
          jawaban: {
            type: "drag_drop",
            answer: userAnswer,
          },
          hasil: {
            expectedOrder,
          },
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
    } catch (error) {
      console.error("Gagal update attempt puzzle:", error);

      showPopupNotif({
        type: "error",
        title: "error",
        message: "Terjadi error saat menyimpan jawaban puzzle.",
      });
    }
  };

  if (!open) return null;

  return (
    <div style={P.overlay}>
      <div style={P.sheet} onMouseDown={(e) => e.stopPropagation()}>
        <div style={P.topbar}>
          <div style={P.breadcrumb}>
            <button style={P.backBtn} onClick={handleClose} title="Kembali">
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

        <div style={P.body} data-tutor="puzzle-drag-area">
          <div style={P.header}>
            <div>
              <div style={P.badgeRow}>
                <span style={P.badge}>DRAG & DROP</span>
                <span style={P.badge}>ATTEMPT: {attempt}</span>
              </div>

              <div style={P.title}>{puzzleTitle}</div>

              <div style={P.desc}>
                {puzzle?.deskripsi_puzzle ||
                  "Susun potongan kode sesuai urutan yang benar."}
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
              <div style={P.panelHeader}>
                <div style={P.panelTitle}>Available Snippets</div>
                <div style={P.smallPill}>{snippets.length} items left</div>
              </div>

              <div
                data-tutor="drag-items"
                style={D.snipList}
                onDragOver={allowDrop}
                onDrop={dropToBank}
              >
                {snippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    draggable={!isDone}
                    onDragStart={() => onDragStartFromBank(snippet.id)}
                    style={D.snipItem}
                  >
                    <span style={D.dragHandle}>⠿</span>
                    <code style={P.code}>{snippet.code}</code>
                  </div>
                ))}
              </div>

              <div
                style={{
                  ...P.tip,
                  whiteSpace: "pre-line",
                }}
              >
                {detail?.instruksi}
              </div>

              <div style={P.reward}>
                🏆 Reward: <b>{xpPotential} XP</b>
              </div>
            </div>

            <div style={P.panelRight}>
              <div style={P.panelHeader}>
                <div style={P.panelTitle}>Solution Editor</div>
                {!isDone ? (
                  <button style={P.secondaryBtn} onClick={resetAll}>
                    Reset All
                  </button>
                ) : null}
              </div>

              <div style={P.editor}>
                <div style={P.editorTop}>
                  <div style={P.windowDots}>
                    <span style={P.dot} />
                    <span style={P.dot} />
                    <span style={P.dot} />
                  </div>
                  <div style={P.fileTab}>
                    {detail.language === "java"
                      ? "Solution.java"
                      : "solution.txt"}
                  </div>
                </div>

                <div style={P.editorBody} data-tutor="drop-slots">
                  {slots.map((slot, index) => (
                    <div
                      key={slot.id}
                      style={D.slotRow}
                      onDragOver={allowDrop}
                      onDrop={() => dropToSlot(slot.id)}
                    >
                      <div style={D.lineNo}>{index + 1}</div>

                      {slot.value ? (
                        <div
                          draggable={!isDone}
                          onDragStart={() => onDragStartFromSlot(slot.id)}
                          style={D.slotFilled}
                        >
                          <span style={D.dragHandle}>⠿</span>
                          <code style={P.code}>{slot.value.code}</code>
                        </div>
                      ) : (
                        <div style={D.slotEmpty}>↓ {slot.label}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={P.actions}>
                {!isDone ? (
                  <button
                    data-tutor="drag-submit"
                    style={P.checkBtn}
                    onClick={checkAnswer}
                  >
                    Periksa Jawaban 🚀
                  </button>
                ) : (
                  <button style={P.checkBtn} onClick={handleClose}>
                    Kembali ke Modul
                  </button>
                )}
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
                ...(popupNotif.type === "success"
                  ? N.successIcon
                  : N.errorIcon),
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
            title: "Item yang Di-drag",
            body: "Ini item/potongan kode yang harus kamu geser.",
            target: '[data-tutor="drag-items"]',
          },
          {
            title: "Tempat Meletakkan",
            body: "Taruh item ke slot ini sesuai urutan yang benar.",
            target: '[data-tutor="drop-slots"]',
          },
          {
            title: "Cek Jawaban",
            body: "Kalau semua slot sudah terisi, klik tombol ini untuk mengecek jawaban.",
            target: '[data-tutor="drag-submit"]',
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
          <div style={IT.badge}>
            Tutorial {index + 1}/{total}
          </div>
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
    background: "linear-gradient(180deg, #15182a 0%, #0c0e18 100%)",
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

const D = {
  snipList: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  snipItem: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.28)",
    padding: "10px 10px",
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    cursor: "grab",
  },
  dragHandle: { opacity: 0.7 },
  slotRow: {
    display: "grid",
    gridTemplateColumns: "30px 1fr",
    gap: 10,
    alignItems: "center",
  },
  lineNo: {
    fontSize: 11,
    opacity: 0.45,
    textAlign: "right",
  },
  slotEmpty: {
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.02)",
    padding: "12px 12px",
    fontSize: 12,
    opacity: 0.55,
  },
  slotFilled: {
    borderRadius: 14,
    border: "1px solid rgba(140,86,255,0.22)",
    background: "rgba(140,86,255,0.10)",
    padding: "12px 12px",
    display: "flex",
    gap: 10,
    cursor: "grab",
    alignItems: "flex-start",
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
