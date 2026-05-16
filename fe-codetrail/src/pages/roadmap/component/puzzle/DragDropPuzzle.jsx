import React, { useEffect, useMemo, useState } from "react";
import { P } from "./PuzzleStyle";
import { usePuzzleTimer } from "./PuzzleTimer";
import { updatePuzzleAttemptApi } from "../../../../components/api/puzzlemap";

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
}) {
  const detail = puzzle?.detail || {};
  const { secondsElapsed, timeMM, timeSS, timeText } = usePuzzleTimer(open);
  const [popupNotif, setPopupNotif] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [slots, setSlots] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [attempt, setAttempt] = useState(Number(puzzle?.attempt || 0));
  const [isSolved, setIsSolved] = useState(
    puzzle?.raw_status === "done" || puzzle?.status === "done",
  );

  const isDone = isSolved;

  const handleClose = () => {
    if (!isDone) {
      alert("Selesaikan puzzle terlebih dahulu sebelum kembali.");
      return;
    }

    onClose?.();
  };

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

  useEffect(() => {
    if (!open) return;

    const done = puzzle?.raw_status === "done" || puzzle?.status === "done";
    const savedAnswer = puzzle?.jawaban?.answer || [];

    setIsSolved(done);
    setAttempt(Number(puzzle?.attempt || 0));

    if (done && savedAnswer.length > 0) {
      setSnippets([]);

      setSlots(
        savedAnswer.map((code, index) => ({
          id: `slot-${index + 1}`,
          label: `Baris ${index + 1}`,
          value: {
            id: `saved-${index + 1}`,
            code,
          },
        })),
      );
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
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

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

  const checkAnswer = async () => {
    const newAttempt = attempt + 1;

    try {
      const userAnswer = slots.map((slot) => slot.value?.code || null);
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
                <span style={P.badge}>DRAG & DROP</span>
                <span style={P.badge}>ATTEMPT: {attempt}</span>
              </div>

              <div style={P.title}>{puzzleTitle}</div>

              <div style={P.desc}>
                {detail.instruksi ||
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

              <div style={P.tip}>
                Drag potongan kode ke editor sebelah kanan sesuai urutan yang
                benar.
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
                  <div style={P.fileTab}>solution.sql</div>
                </div>

                <div style={P.editorBody}>
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
                  <button style={P.checkBtn} onClick={checkAnswer}>
                    Periksa Jawaban 🚀
                  </button>
                ) : (
                  <button style={P.checkBtn} onClick={onClose}>
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