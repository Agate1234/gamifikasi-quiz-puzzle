import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { P } from "./PuzzleStyle";
import { usePuzzleTimer } from "./PuzzleTimer";
import {
  updatePuzzleAttemptApi,
  runCodeApi,
} from "../../../../components/api/puzzlemap";

export default function CodePuzzle({
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
  const [code, setCode] = useState("");
  const [attempt, setAttempt] = useState(Number(puzzle?.attempt || 0));
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [isSolved, setIsSolved] = useState(
    puzzle?.raw_status === "done" || puzzle?.status === "done",
  );
  const [popupNotif, setPopupNotif] = useState(null);
  const [running, setRunning] = useState(false);

  const isDone = puzzle?.raw_status === "done" || puzzle?.status === "done";

  const handleClose = () => {
    if (!isDone) {
      alert("Selesaikan puzzle terlebih dahulu sebelum kembali.");
      return;
    }

    onClose?.();
  };

  useEffect(() => {
    if (!open) return;

    const done = puzzle?.raw_status === "done" || puzzle?.status === "done";

    setIsSolved(done);
    setCode(puzzle?.jawaban?.code || detail.starter_code || "");
    setOutput(
      done ? "✅ Puzzle sudah selesai. Ini adalah preview jawaban." : "",
    );
    setTestResults(puzzle?.hasil?.testResults || []);
    setAttempt(Number(puzzle?.attempt || 0));
    setRunning(false);
  }, [open, detail.starter_code, puzzle]);

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

  const normalizeLanguage = (value) => {
    return String(value || "").toLowerCase().trim();
  };

  const getFileExtension = () => {
    const language = normalizeLanguage(detail.language);

    if (language === "javascript") return "js";
    if (language === "java") return "java";

    return "txt";
  };

  const getExpectedOutput = (testcase) => {
    if (testcase?.expected_output !== undefined) {
      return testcase.expected_output;
    }

    return testcase?.expected;
  };

  const isEqualValue = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  const runJavascriptTestcases = () => {
    const functionName = detail.function_name;
    const testcases = detail.testcases || [];

    if (!functionName) {
      return {
        success: false,
        message: "Nama function belum tersedia.",
        results: [],
      };
    }

    if (!Array.isArray(testcases) || testcases.length === 0) {
      return {
        success: false,
        message: "Testcase belum tersedia.",
        results: [],
      };
    }

    let userFunction;

    try {
      userFunction = new Function(`
        ${code}
        return ${functionName};
      `)();
    } catch (error) {
      return {
        success: false,
        message: `Syntax error: ${error.message}`,
        results: [],
      };
    }

    if (typeof userFunction !== "function") {
      return {
        success: false,
        message: `${functionName} bukan function atau belum dibuat.`,
        results: [],
      };
    }

    const results = testcases.map((testcase, index) => {
      const input = Array.isArray(testcase.input) ? testcase.input : [];
      const expectedOutput = getExpectedOutput(testcase);

      try {
        const actualOutput = userFunction(...input);
        const passed = isEqualValue(actualOutput, expectedOutput);

        return {
          index: index + 1,
          input,
          expected_output: expectedOutput,
          actual_output: actualOutput,
          passed,
          error: null,
        };
      } catch (error) {
        return {
          index: index + 1,
          input,
          expected_output: expectedOutput,
          actual_output: null,
          passed: false,
          error: error.message,
        };
      }
    });

    const allPassed = results.every((result) => result.passed);

    return {
      success: allPassed,
      message: allPassed
        ? "Semua testcase berhasil."
        : "Masih ada testcase yang gagal.",
      results,
    };
  };

  const runJavaTestcases = async () => {
    const response = await runCodeApi({
      language: detail.language,
      code,
      function_name: detail.function_name,
      testcases: detail.testcases || [],
      time_limit_ms: detail.time_limit_ms || 1000,
    });

    if (!response?.data?.success) {
      return {
        success: false,
        message: response?.data?.message || "Gagal menjalankan Java.",
        results: [],
      };
    }

    return response.data.data;
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
        message:
          "ID progress puzzle tidak ditemukan. Cek mapping selectedPuzzle.",
      });

      return;
    }

    if (running) return;

    try {
      setRunning(true);

      const language = normalizeLanguage(detail.language);

      let runResult;

      if (language === "javascript") {
        runResult = runJavascriptTestcases();
      } else if (language === "java") {
        runResult = await runJavaTestcases();
      } else {
        showPopupNotif({
          type: "error",
          title: "Bahasa Belum Didukung",
          message: `Runner belum mendukung bahasa ${detail.language}.`,
        });

        return;
      }

      setOutput(runResult.message);
      setTestResults(runResult.results);

      const duration = Number(secondsElapsed || 0);

      const response = await updatePuzzleAttemptApi(puzzle.id_progress_puzzle, {
        is_done: runResult.success,
        waktu: duration,
        jawaban: {
          type: "code",
          language,
          code,
        },
        hasil: {
          testResults: runResult.results,
          message: runResult.message,
        },
      });

      if (response?.data?.success) {
        const finalAttempt = response.data.data.current.attempt;

        setAttempt(finalAttempt);

        if (!runResult.success) {
          showPopupNotif({
            type: "error",
            title: "Jawaban Belum Benar",
            message: `Masih ada testcase yang gagal. Attempt: ${finalAttempt}`,
          });

          return;
        }

        setIsSolved(true);
        setOutput(
          `✅ Jawaban benar! Semua testcase berhasil.\nAttempt: ${finalAttempt}`,
        );

        const finalResult = {
          puzzleTitle,
          type: "code",
          attempt: finalAttempt,
          xp: xpPotential,
          waktu: duration,
          jawaban: {
            type: "code",
            language,
            code,
          },
          hasil: {
            testResults: runResult.results,
            message: runResult.message,
          },
        };

        showPopupNotif({
          type: "success",
          title: "Jawaban Benar!",
          message: "Semua testcase berhasil.",
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
      console.error("Gagal submit code puzzle:", error);

      showPopupNotif({
        type: "error",
        title: "Terjadi Error",
        message: error?.response?.data?.message || "Terjadi error saat submit code puzzle.",
      });
    } finally {
      setRunning(false);
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

        <div style={P.body} data-tutor="puzzle-code-area">
          <div style={P.header}>
            <div>
              <div style={P.badgeRow}>
                <span style={P.badge}>CODE PUZZLE</span>
                <span style={P.badge}>ATTEMPT: {attempt}</span>
              </div>

              <div style={P.title}>{puzzleTitle}</div>

              <div style={P.desc}>
                {detail.instruksi || "Lengkapi kode sesuai instruksi."}
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
            <div style={P.panel} data-tutor="code-detail">
              <div style={P.panelTitle}>Detail Soal</div>

              <div style={P.tip}>
                <b>Function:</b> {detail.function_name || "-"}
                <br />
                <b>Language:</b> {detail.language || "-"}
                <br />
                <b>Time Limit:</b> {detail.time_limit_ms || "-"} ms
                <br />
                <b>Memory:</b> {detail.memory_limit_mb || "-"} MB
              </div>

              <div style={C.testBox}>
                <div style={P.panelTitle}>Testcases</div>

                {(detail.testcases || []).map((testcase, index) => (
                  <div key={index} style={C.testItem}>
                    <div style={C.testTitle}>Testcase {index + 1}</div>
                    <div>
                      <b>Input:</b>{" "}
                      <code>{JSON.stringify(testcase.input)}</code>
                    </div>
                    <div>
                      <b>Expected:</b>{" "}
                      <code>{JSON.stringify(getExpectedOutput(testcase))}</code>
                    </div>
                  </div>
                ))}
              </div>

              <div style={P.reward}>
                🏆 Reward: <b>{xpPotential} XP</b>
              </div>
            </div>

            <div style={P.panelRight}>
              <div style={P.panelHeader}>
                <div style={P.panelTitle}>Code Editor</div>
              </div>

              <div style={P.editor} data-tutor="code-editor">
                <div style={P.editorTop}>
                  <div style={P.windowDots}>
                    <span style={P.dot} />
                    <span style={P.dot} />
                    <span style={P.dot} />
                  </div>
                  <div style={P.fileTab}>solution.{getFileExtension()}</div>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isSolved || running}
                  spellCheck={false}
                  style={{
                    ...C.textarea,
                    ...(isSolved || running ? C.textareaDisabled : {}),
                  }}
                />
              </div>

              <div>
                {output ? <div style={C.output}>{output}</div> : null}

                {testResults.length > 0 ? (
                  <div style={C.resultBox}>
                    {testResults.map((result) => (
                      <div
                        key={result.index}
                        style={{
                          ...C.resultItem,
                          ...(result.passed ? C.resultPass : C.resultFail),
                        }}
                      >
                        <div style={C.resultTitle}>
                          {result.passed ? "✅" : "❌"} Testcase {result.index}
                        </div>

                        <div>
                          Input: <code>{JSON.stringify(result.input)}</code>
                        </div>

                        <div>
                          Expected:{" "}
                          <code>{JSON.stringify(result.expected_output)}</code>
                        </div>

                        <div>
                          Output:{" "}
                          <code>{JSON.stringify(result.actual_output)}</code>
                        </div>

                        {result.error ? (
                          <div>
                            Error: <code>{result.error}</code>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {!isSolved ? (
                <div style={P.actions}>
                  <button
                    data-tutor="code-submit"
                    style={{
                      ...P.checkBtn,
                      ...(running ? C.buttonDisabled : {}),
                    }}
                    disabled={running}
                    onClick={checkAnswer}
                  >
                    {running ? "Menjalankan..." : "Submit Code 🚀"}
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
                ...(popupNotif.type === "success"
                  ? N.successBtn
                  : N.errorBtn),
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
            title: "Detail Soal",
            body: "Bagian ini berisi function yang harus dibuat, bahasa yang dipakai, dan aturan pengerjaan.",
            target: '[data-tutor="code-detail"]',
          },
          {
            title: "Testcase",
            body: "Input adalah data yang otomatis dimasukkan sistem ke function kamu. Expected adalah hasil yang seharusnya keluar dari function tersebut.",
            target: '[data-tutor="code-detail"]',
          },
          {
            title: "Code Editor",
            body: "Tulis atau lengkapi kode di sini sesuai function yang diminta. Jangan ubah nama function jika sudah ditentukan.",
            target: '[data-tutor="code-editor"]',
          },
          {
            title: "Submit Code",
            body: "Klik tombol ini untuk menjalankan testcase dan menyimpan attempt. Puzzle selesai jika semua testcase berhasil.",
            target: '[data-tutor="code-submit"]',
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

const C = {
  textarea: {
    flex: 1,
    width: "100%",
    minHeight: 420,
    resize: "none",
    border: "none",
    outline: "none",
    padding: 14,
    background: "rgba(10,12,22,0.30)",
    color: "rgba(235,240,255,0.92)",
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 1.7,
  },

  textareaDisabled: {
    opacity: 0.75,
    cursor: "not-allowed",
  },

  buttonDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
    filter: "grayscale(0.3)",
  },

  testBox: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.25)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  testItem: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 10,
    fontSize: 12,
    lineHeight: 1.6,
  },

  testTitle: {
    fontWeight: 900,
    marginBottom: 6,
  },

  output: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,12,22,0.35)",
    padding: 12,
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: "pre-line",
  },

  resultBox: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  resultItem: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    fontSize: 12,
    lineHeight: 1.6,
  },

  resultPass: {
    background: "rgba(60,255,201,0.08)",
    border: "1px solid rgba(60,255,201,0.18)",
  },

  resultFail: {
    background: "rgba(255,80,120,0.08)",
    border: "1px solid rgba(255,80,120,0.18)",
  },

  resultTitle: {
    fontWeight: 900,
    marginBottom: 6,
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