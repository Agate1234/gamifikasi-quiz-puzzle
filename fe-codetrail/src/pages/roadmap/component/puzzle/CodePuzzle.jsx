import React, { useEffect, useState } from "react";
import { P } from "./PuzzleStyle";
import { usePuzzleTimer } from "./PuzzleTimer";
import { updatePuzzleAttemptApi } from "../../../../components/api/puzzlemap";

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

    const done = puzzle?.raw_status === "done" || puzzle?.status === "done";

    setIsSolved(done);
    setCode(puzzle?.jawaban?.code || detail.starter_code || "");
    setOutput(
      done ? "✅ Puzzle sudah selesai. Ini adalah preview jawaban." : "",
    );
    setTestResults(puzzle?.hasil?.testResults || []);
    setAttempt(Number(puzzle?.attempt || 0));
  }, [open, detail.starter_code, puzzle]);

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
      const expectedOutput = testcase.expected_output;

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

  try {
    if (detail.language !== "javascript") {
      showPopupNotif({
        type: "error",
        title: "Bahasa Belum Didukung",
        message: "Saat ini runner baru mendukung JavaScript.",
      });

      return;
    }

    const runResult = runJavascriptTestcases();

    setOutput(runResult.message);
    setTestResults(runResult.results);

    const duration = Number(secondsElapsed || 0);

    const response = await updatePuzzleAttemptApi(puzzle.id_progress_puzzle, {
      is_done: runResult.success,
      waktu: duration,
      jawaban: {
        type: "code",
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
      message: "Terjadi error saat submit code puzzle.",
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
            <div style={P.panel}>
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
                      <code>{JSON.stringify(testcase.expected_output)}</code>
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

              <div style={P.editor}>
                <div style={P.editorTop}>
                  <div style={P.windowDots}>
                    <span style={P.dot} />
                    <span style={P.dot} />
                    <span style={P.dot} />
                  </div>
                  <div style={P.fileTab}>
                    solution.{detail.language === "javascript" ? "js" : "txt"}
                  </div>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isSolved}
                  spellCheck={false}
                  style={{
                    ...C.textarea,
                    ...(isSolved ? C.textareaDisabled : {}),
                  }}
                />
              </div>

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

              {!isSolved ? (
                <div style={P.actions}>
                  <button style={P.checkBtn} onClick={checkAnswer}>
                    Submit Code 🚀
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

    </div>
  );
}

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