import React, { useEffect, useMemo, useState } from "react";
import MateriFullscreen from "./materi/DetailMateri";
import QuizFullscreen from "./quiz/PengerjaanQuiz";
import PuzzleFullscreen from "./puzzle/PengerjaanPuzzle";
import HasilPuzzle from "./puzzle/HasilPuzzle";
import DetailPuzzleModal from "./puzzle/DetailPuzzle";
import { getMapPuzzleByIdApi } from "../../../components/api/puzzlemap";
import { useNavigate } from "react-router-dom";
import { getMapMateriByIdApi } from "../../../components/api/materimap";
import HasilQuiz from "./quiz/HasilQuiz";
import DetailQuizModal from "./quiz/DetailQuiz";
import { getMapQuizByIdApi } from "../../../components/api/quizmap";
import { getNextSoalMahasiswaApi } from "../../../components/api/soal";

function NodePathSection({ list, tab, onPrimaryAction }) {
  return (
    <div style={M.pathWrap}>
      <div
        style={{
          ...M.pathInner,
          height: `${list.length * 170}px`,
        }}
      >
        <svg
          style={M.pathSvg}
          viewBox={`0 0 1000 ${Math.max(220, list.length * 170)}`}
          preserveAspectRatio="none"
        >
          {list.slice(0, -1).map((_, index) => {
            const startLeft = index % 2 === 0;

            const nodeSize = 88;
            const radius = nodeSize / 2;

            const leftNodeCenterX = radius;
            const rightNodeCenterX = 1000 - radius;

            const startX = startLeft
              ? leftNodeCenterX + radius - 2
              : rightNodeCenterX - radius + 2;

            const endX = startLeft
              ? rightNodeCenterX - radius + 2
              : leftNodeCenterX + radius - 2;

            const startY = index * 170 + radius;
            const endY = (index + 1) * 170 + radius;

            const waveUp = index % 2 === 0;

            const cp1X = startLeft ? startX + 140 : startX - 140;
            const cp2X = startLeft ? startX + 280 : startX - 280;
            const cp4X = startLeft ? endX - 140 : endX + 140;

            const cp1Y = startY + (waveUp ? -55 : 55);
            const cp2Y = startY + 70;
            const cp4Y = endY + (waveUp ? 55 : -55);

            return (
              <path
                key={`line-${index}`}
                d={`
                  M ${startX} ${startY}
                  C ${cp1X} ${cp1Y},
                    ${cp2X} ${cp2Y},
                    ${(startX + endX) / 2} ${(startY + endY) / 2}
                  S ${cp4X} ${cp4Y},
                    ${endX} ${endY}
                `}
                fill="none"
                stroke="url(#nodePathGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.98"
              />
            );
          })}

          <defs>
            <linearGradient
              id="nodePathGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#9b5cff" />
              <stop offset="55%" stopColor="#6f7cff" />
              <stop offset="100%" stopColor="#39d0b8" />
            </linearGradient>
          </defs>
        </svg>

        {list.map((item, index) => {
          const isDone = !!item.done;
          const isLocked = item.status === "preview";
          const isActive = !isDone && !isLocked;
          const left = index % 2 === 0;

          return (
            <div
              key={item.id}
              style={{
                ...M.pathRowAbsolute,
                top: `${index * 170}px`,
                justifyContent: left ? "flex-start" : "flex-end",
              }}
            >
              <button
                onClick={() => {
  if (isLocked) return;
  onPrimaryAction(item);
}}
                title={item.title}
                style={{
                  ...M.pathNode,
                  ...(isDone ? M.pathNodeDone : {}),
                  ...(isActive ? M.pathNodeActive : {}),
                  ...(isLocked ? M.pathNodeLocked : {}),
                }}
              >
                <div style={M.pathNodeInner}>
                  <div style={M.pathNodeIndex}>
                    {isDone ? "✓" : isLocked ? "🔒" : index + 1}
                  </div>
                  <div style={M.pathNodeType}>
                    {tab === "materi"
                      ? "Materi"
                      : tab === "kuis"
                        ? "Kuis"
                        : "Puzzle"}
                  </div>
                </div>
              </button>

              <div
                style={{
                  ...M.pathLabelCard,
                  ...(left ? M.pathLabelCardLeft : M.pathLabelCardRight),
                }}
              >
                <div style={M.pathLabelTitle}>{item.title}</div>
                <div style={M.pathLabelMeta}>
                  +{item.xp} XP •{" "}
                  {tab === "materi"
                    ? "Buka materi"
                    : tab === "kuis"
                      ? "Kerjakan kuis"
                      : "Mainkan puzzle"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ModulePage({
  open,
  module,
  onClose,
  onModuleProgressChange,
}) {
  const [tab, setTab] = useState("materi");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDetailOpen, setQuizDetailOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [quizXp, setQuizXp] = useState(0);
  const [puzzleDetailOpen, setPuzzleDetailOpen] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [puzzleLoading, setPuzzleLoading] = useState(false);
  const [activePuzzle, setActivePuzzle] = useState(null);
  const [puzzleType, setPuzzleType] = useState("drag_drop");
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showPuzzleResult, setShowPuzzleResult] = useState(false);
  const [puzzleResultData, setPuzzleResultData] = useState(null);
  const [localModule, setLocalModule] = useState(module);
  const [materiOpen, setMateriOpen] = useState(false);
  const [activeMateri, setActiveMateri] = useState(null);
  const [materiLoading, setMateriLoading] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizResultData, setQuizResultData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (open) setTab("materi");
  }, [open, module?.id]);

  useEffect(() => {
    setLocalModule(module);
  }, [module]);

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

  console.log("MODULE DETAIL:", module);
  console.log("PUZZLE DATA:", module?.puzzle);

  const list = useMemo(() => {
    if (!localModule) return [];
    if (tab === "kuis") return localModule.kuis || [];
    if (tab === "puzzle") return localModule.puzzle || [];
    return localModule.materi || [];
  }, [tab, localModule]);

  const moduleStats = useMemo(() => {
    const materi = localModule?.materi || [];
    const puzzle = localModule?.puzzle || [];
    const kuis = localModule?.kuis || [];

    const allActivities = [...materi, ...puzzle, ...kuis];

    const totalActivities = allActivities.length;

    const doneActivities = allActivities.filter((item) => {
      return (
        item.done === true ||
        item.status === "done" ||
        item.raw_status === "done"
      );
    }).length;

    const progressValue =
      totalActivities > 0 ? doneActivities / totalActivities : 0;

    return {
      totalActivities,
      doneActivities,
      progressValue,
      progressText: `${doneActivities} dari ${totalActivities} aktivitas terselesaikan`,
    };
  }, [localModule]);

  const notifyModuleProgressChange = (nextModule) => {
  if (!nextModule) return;
  onModuleProgressChange?.(nextModule);
};

  if (!open) return null;

  const openMateri = async (item) => {
    if (item.status === "preview") return;

    const rawId =
      item.id_materi ||
      String(item.id || "")
        .replace("materi-", "")
        .trim();

    if (!rawId) return;

    try {
      setMateriLoading(true);

      const params = new URLSearchParams();
      const idUser = localStorage.getItem("id_user") || "";

      if (idUser) {
        params.append("id_user", idUser);
      }

      const response = await getMapMateriByIdApi(rawId, params);

      if (response?.status === 200 && response?.data?.success) {
        setActiveMateri(response.data.data);
        setMateriOpen(true);
      }
    } catch (error) {
      console.log("Gagal mengambil detail materi:", error);
    } finally {
      setMateriLoading(false);
    }
  };

  const closeMateri = () => setMateriOpen(false);

  const openQuizDetail = async (item) => {
    if (item.status === "preview") return;
    if (!item.id_quiz) {
      console.error(
        "id_quiz tidak ada. Item ini masih pakai id buatan UI:",
        item,
      );
      return;
    }

    try {
      setQuizLoading(true);

      const params = new URLSearchParams();
      const idUser = localStorage.getItem("id_user") || "";
      if (idUser) params.append("id_user", idUser);

      const response = await getMapQuizByIdApi(item.id_quiz, params);

      if (response?.status === 200 && response?.data?.success) {
        const q = response.data.data;

        setSelectedQuiz({
          id: `quiz-${q.id_quiz}`,
          id_quiz: q.id_quiz,
          title: q.judul_quiz || "Kuis",
          desc: q.deskripsi_quiz || "-",
          xp: Number(q.exp_quiz || 0),
          score: Number(q.score || 0),
          status: q.is_unlock ? "mulai" : "preview",
          raw_status: q.status || "-",
          is_unlock: !!q.is_unlock,
          id_modul: q.id_modul,

          totalQuestion: Number(q.totalQuestion || q.total_question || 0),
          accuracy: q.accuracy || 0,
          timeText: q.timeText || q.waktu_penyelesaian || "-",
          review: q.review || [],
        });

        setQuizDetailOpen(true);
      }
    } catch (error) {
      console.log("Gagal mengambil detail quiz:", error);
    } finally {
      setQuizLoading(false);
    }
  };

  const openPuzzleDetail = async (item, type = "drag_drop") => {
    if (item.status === "preview") return;

    if (!item.id_puzzle) {
      console.error(
        "id_puzzle tidak ada. Item ini masih pakai id buatan UI:",
        item,
      );
      return;
    }

    try {
      setPuzzleLoading(true);

      const params = new URLSearchParams();
      const idUser = localStorage.getItem("id_user") || "";

      if (idUser) {
        params.append("id_user", idUser);
      }

      const response = await getMapPuzzleByIdApi(item.id_puzzle, params);

      if (response?.status === 200 && response?.data?.success) {
        const p = response.data.data;

        setSelectedPuzzle({
          id: `puzzle-${p.id_puzzle}`,
          id_progress_puzzle: p.id_progress_puzzle,
          id_puzzle: p.id_puzzle,
          id_modul: p.id_modul,

          title: p.judul_puzzle || "Puzzle",
          judul_puzzle: p.judul_puzzle || "Puzzle",

          desc: p.deskripsi_puzzle || "-",
          deskripsi_puzzle: p.deskripsi_puzzle || "-",

          xp: Number(p.exp_puzzle || 0),
          exp_puzzle: Number(p.exp_puzzle || 0),

          attempt: Number(p.attempt || 0),
          waktu: Number(p.waktu || 0),

          status: p.status || "-",
          raw_status: p.status || "-",
          is_unlock: !!p.is_unlock,

          type: p.tipe_puzzle || "drag_drop",
          tipe_puzzle: p.tipe_puzzle || "drag_drop",

          jawaban: p.jawaban,
          hasil: p.hasil,
          detail: p.detail,
        });
        setPuzzleDetailOpen(true);
      }
    } catch (error) {
      console.log("Gagal mengambil detail puzzle:", error);
    } finally {
      setPuzzleLoading(false);
    }
  };

  const handlePrimaryAction = (item, type) => {
    if (tab === "materi") return openMateri(item);
    if (tab === "kuis") return openQuizDetail(item);
    return openPuzzleDetail(item, type || "drag_drop");
  };

  const closeQuizDetail = () => {
    setQuizDetailOpen(false);
    setSelectedQuiz(null);
  };

  const handleConfirmStartQuiz = async () => {
  if (!selectedQuiz) return;

  const isDone =
    selectedQuiz.raw_status === "done" || selectedQuiz.status === "done";

  setQuizDetailOpen(false);

  if (isDone) {
    try {
      const response = await getNextSoalMahasiswaApi(selectedQuiz.id_quiz);

      const payload = response?.data?.data || {};

      const totalSoal =
        payload.total_soal ||
        payload.progress?.total_soal ||
        selectedQuiz.totalQuestion ||
        0;

      const totalBenar =
        payload.total_benar ||
        payload.progress?.total_benar ||
        0;

      const accuracy =
        totalSoal > 0
          ? Math.round((Number(totalBenar) / Number(totalSoal)) * 100)
          : 0;

      setQuizResultData({
        quiz: selectedQuiz,
        result: {
          score100: Number(payload.score ?? selectedQuiz.score ?? 0),
          xpEarned: Number(payload.exp_earned ?? selectedQuiz.xp ?? 0),
          accuracy,
          timeText: payload.waktu_penyelesaian
            ? "-"
            : selectedQuiz.timeText || "-",
          totalQuestions: Number(totalSoal || 0),
          review: payload.review || [],
        },
      });

      setShowQuizResult(true);
      return;
    } catch (error) {
      console.log("Gagal mengambil preview hasil quiz:", error);

      setQuizResultData({
        quiz: selectedQuiz,
        result: {
          score100: Number(selectedQuiz.score || 0),
          xpEarned: Number(selectedQuiz.xp || selectedQuiz.exp_quiz || 0),
          accuracy: 0,
          timeText: "-",
          totalQuestions: 0,
          review: [],
        },
      });

      setShowQuizResult(true);
      return;
    }
  }

  setQuizTitle(selectedQuiz.title || "Kuis");
  setActiveQuizId(selectedQuiz.id_quiz);
  setQuizXp(Number(selectedQuiz?.xp || 0));
  setQuizOpen(true);
};

  const closePuzzleDetail = () => {
    setPuzzleDetailOpen(false);
    setSelectedPuzzle(null);
  };

  const handleConfirmStartPuzzle = () => {
    if (!selectedPuzzle) return;

    const isDone =
      selectedPuzzle.raw_status === "done" || selectedPuzzle.status === "done";

    setPuzzleDetailOpen(false);

    if (isDone) {
      setPuzzleResultData({
        puzzle: selectedPuzzle,
        result: {
          attempt: Number(selectedPuzzle.attempt || 0),
          xp: Number(selectedPuzzle.xp || selectedPuzzle.exp_puzzle || 0),
          waktu: Number(selectedPuzzle.waktu || 0),
          type: selectedPuzzle.tipe_puzzle || selectedPuzzle.type,
          jawaban: selectedPuzzle.jawaban,
          hasil: selectedPuzzle.hasil,
        },
      });

      setShowPuzzleResult(true);
      return;
    }

    setActivePuzzle(selectedPuzzle);
    setPuzzleType(
      selectedPuzzle.tipe_puzzle || selectedPuzzle.type || "drag_drop",
    );
    setShowPuzzle(true);
  };

  const onStartPuzzle = (item, type = "drag_drop") => {
    if (item.status === "preview") return;

    setActivePuzzle(item);
    setPuzzleType(type);
    setShowPuzzle(true);
  };

  const updateQuizUnlockUI = (finishedQuiz, res) => {
  setLocalModule((prev) => {
    if (!prev?.kuis) return prev;

    const finishedId = finishedQuiz?.id_quiz;

    const currentIndex = prev.kuis.findIndex((item) => {
      return Number(item.id_quiz) === Number(finishedId);
    });

    const nextModule = {
      ...prev,
      kuis: prev.kuis.map((item, index) => {
        const isCurrentQuiz = Number(item.id_quiz) === Number(finishedId);
        const isNextQuiz = currentIndex !== -1 && index === currentIndex + 1;

        if (isCurrentQuiz) {
          return {
            ...item,
            done: true,
            status: "done",
            raw_status: "done",
            is_unlock: true,
            score: res.score100,
            hasil: res,
          };
        }

        if (isNextQuiz) {
          return {
            ...item,
            done: false,
            status: "not done",
            raw_status: "not done",
            is_unlock: true,
          };
        }

        return item;
      }),
    };

    notifyModuleProgressChange(nextModule);

    return nextModule;
  });
};

  const updatePuzzleUnlockUI = (finishedPuzzle, res) => {
  setLocalModule((prev) => {
    if (!prev?.puzzle) return prev;

    const finishedId = finishedPuzzle?.id_puzzle;

    const currentIndex = prev.puzzle.findIndex((item) => {
      return Number(item.id_puzzle) === Number(finishedId);
    });

    const nextModule = {
      ...prev,
      puzzle: prev.puzzle.map((item, index) => {
        const isCurrentPuzzle = Number(item.id_puzzle) === Number(finishedId);
        const isNextPuzzle = currentIndex !== -1 && index === currentIndex + 1;

        if (isCurrentPuzzle) {
          return {
            ...item,
            done: true,
            status: "done",
            raw_status: "done",
            is_unlock: true,
            attempt: res.attempt,
            waktu: res.waktu,
            jawaban: res.jawaban,
            hasil: res.hasil,
          };
        }

        if (isNextPuzzle) {
          return {
            ...item,
            done: false,
            status: "not done",
            raw_status: "not done",
            is_unlock: true,
          };
        }

        return item;
      }),
    };

    notifyModuleProgressChange(nextModule);

    return nextModule;
  });
};

  return (
    <>
      <div style={M.overlay} onMouseDown={onClose}>
        <div style={M.sheet} onMouseDown={(e) => e.stopPropagation()}>
          <div style={M.topBar}>
            <div style={M.breadcrumb}>
              <button style={M.backBtn} onClick={onClose} title="Kembali">
                ←
              </button>
              <span style={M.muted}>Roadmap</span>
              <span style={M.muted}>›</span>
              <span style={M.breadcrumbStrong}>
                {module?.level || "Level"}: {module?.title || "-"}
              </span>
            </div>

            <div style={M.topRight}>
              <div style={M.pillSmall}>⚡ Streak: 5 hari</div>
              <div style={M.circleBtn} title="Tema">
                ☾
              </div>
            </div>
          </div>

          <div style={M.content}>
            <section style={M.hero}>
              <div style={M.heroLeft}>
                <div style={M.heroTags}>
                  <span style={M.tag}>{module?.level || "LEVEL"}</span>
                </div>

                <div style={M.heroTitle}>
                  {module?.heroTitle || module?.title}
                </div>
                <div style={M.heroDesc}>{module?.heroDesc}</div>

                <div style={M.heroProgressWrap}>
                  <div style={M.heroProgressText}>
                    {moduleStats.progressText}
                  </div>
                  <div style={M.progressOuter}>
                    <div
                      style={{
                        ...M.progressInner,
                        width: `${moduleStats.progressValue * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={M.tabs}>
                  <TabButton
                    label="Materi"
                    active={tab === "materi"}
                    onClick={() => setTab("materi")}
                  />
                  <TabButton
                    label="Kuis"
                    active={tab === "kuis"}
                    onClick={() => setTab("kuis")}
                  />
                  <TabButton
                    label="Puzzle"
                    active={tab === "puzzle"}
                    onClick={() => setTab("puzzle")}
                  />
                </div>
              </div>

              <div style={M.heroRight}>
                <div style={M.heroXP}>
                  <div style={M.heroXPTop}>
                    <div>
                      <div style={M.heroXPLabel}>XP Potential</div>
                      <div style={M.heroXPSub}>Reward modul ini</div>
                    </div>

                    <div style={M.heroXPBadge}>🧩</div>
                  </div>

                  <div style={M.heroXPValue}>+{module?.totalXP || 0} XP</div>
                </div>
              </div>
            </section>

            <div style={M.listHeader}>
              <div style={M.sectionTitle}>
                {tab === "materi"
                  ? "Node Materi"
                  : tab === "kuis"
                    ? "Daftar Kuis"
                    : "Daftar Puzzle"}
              </div>

              <div style={M.listHeaderRight}>
                <div style={M.pillMeta}>Total XP {module?.totalXP || 0}</div>
                <div style={M.pillMeta}>
                  Total Aktivitas {moduleStats.totalActivities}
                </div>
              </div>
            </div>

            {(materiLoading && tab === "materi") ||
            (puzzleLoading && tab === "puzzle") ||
            (quizLoading && tab === "kuis") ? (
              <div style={M.empty}>
                Memuat detail{" "}
                {tab === "materi"
                  ? "materi"
                  : tab === "kuis"
                    ? "quiz"
                    : "puzzle"}
                ...
              </div>
            ) : (
              <div style={M.list}>
                {list.length > 0 ? (
                  <NodePathSection
                    list={list}
                    tab={tab}
                    onPrimaryAction={handlePrimaryAction}
                  />
                ) : (
                  <div style={M.empty}>
                    Belum ada{" "}
                    {tab === "materi"
                      ? "materi"
                      : tab === "kuis"
                        ? "kuis"
                        : "puzzle"}{" "}
                    di modul ini.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <MateriFullscreen
        open={materiOpen}
        materi={activeMateri}
        moduleTitle={module?.title}
        onClose={closeMateri}
        onNext={() => closeMateri()}
      />

      <DetailQuizModal
        open={quizDetailOpen}
        quiz={selectedQuiz}
        moduleTitle={module?.title}
        onClose={closeQuizDetail}
        onStart={handleConfirmStartQuiz}
      />

      <DetailPuzzleModal
        open={puzzleDetailOpen}
        puzzle={selectedPuzzle}
        moduleTitle={module?.title}
        onClose={closePuzzleDetail}
        onStart={handleConfirmStartPuzzle}
      />

      <QuizFullscreen
        open={quizOpen}
        quizId={activeQuizId}
        quizTitle={quizTitle}
        quizXp={quizXp}
        onClose={() => setQuizOpen(false)}
        onFinish={(quizResult) => {
          updateQuizUnlockUI(
            {
              id_quiz: activeQuizId,
            },
            quizResult,
          );
        }}
      />

      <PuzzleFullscreen
        open={showPuzzle}
        puzzle={activePuzzle}
        type={activePuzzle?.tipe_puzzle || activePuzzle?.type}
        puzzleTitle={activePuzzle?.title}
        moduleName={module?.title}
        xpPotential={Number(activePuzzle?.xp || 0)}
        secondsTotal={Number(activePuzzle?.waktu || 0) || 5 * 60}
        onClose={() => setShowPuzzle(false)}
        onFinish={(res) => {
          updatePuzzleUnlockUI(activePuzzle, res);

          setPuzzleResultData({
            puzzle: {
              ...activePuzzle,
              raw_status: "done",
              status: "done",
              done: true,
              is_unlock: true,
              attempt: res.attempt,
              waktu: res.waktu,
              jawaban: res.jawaban,
              hasil: res.hasil,
            },
            result: res,
          });

          setShowPuzzle(false);
          setShowPuzzleResult(true);
        }}
      />

      <HasilPuzzle
        open={showPuzzleResult}
        puzzleTitle={puzzleResultData?.puzzle?.title}
        puzzle={puzzleResultData?.puzzle}
        result={puzzleResultData?.result}
        onBackToModule={() => {
          setShowPuzzleResult(false);
          setPuzzleResultData(null);
        }}
      />

      <HasilQuiz
        open={showQuizResult}
        quizTitle={quizResultData?.quiz?.title}
        result={quizResultData?.result}
        questions={quizResultData?.questions || []}
        selectedMap={quizResultData?.selectedMap || {}}
        onBackToModule={() => {
          setShowQuizResult(false);
          setQuizResultData(null);
        }}
      />
    </>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ ...M.tabBtn, ...(active ? M.tabBtnActive : null) }}
    >
      {label}
    </button>
  );
}

const M = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "stretch",
  },

  sheet: {
    width: "100%",
    height: "100%",
    background:
      "radial-gradient(1000px 600px at 60% 20%, rgba(92,255,210,0.10) 0%, rgba(80,90,255,0.10) 25%, rgba(10,12,22,1) 60%)",
    color: "rgba(235,240,255,0.92)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    overflow: "hidden",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },

  breadcrumbStrong: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.95,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  muted: { fontSize: 12, opacity: 0.7 },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
  },

  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  pillSmall: {
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    opacity: 0.9,
  },

  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },

  content: {
    height: "calc(100% - 68px)",
    overflowY: "auto",
    padding: 18,
  },

  hero: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(130,90,255,0.18), rgba(255,255,255,0.03))",
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },

  heroLeft: { minWidth: 0, flex: 1 },

  heroTags: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },

  tag: {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    opacity: 0.9,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  heroDesc: {
    marginTop: 8,
    fontSize: 13,
    opacity: 0.78,
    lineHeight: 1.6,
    maxWidth: 820,
  },

  heroProgressWrap: { marginTop: 12 },

  heroProgressText: {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 8,
  },

  progressOuter: {
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    maxWidth: 720,
  },

  progressInner: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.85), rgba(140,86,255,0.85))",
  },

  tabs: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  tabBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    fontWeight: 650,
    fontSize: 12,
  },

  tabBtnActive: {
    border: "1px solid rgba(120,90,255,0.30)",
    background: "rgba(120,90,255,0.16)",
  },

  heroRight: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    alignSelf: "flex-start",
    minWidth: "unset",
  },

  heroXP: {
    width: 245,
    padding: "15px 12px",
    borderRadius: 16,
    border: "1px solid rgba(140,86,255,0.22)",
    background:
      "linear-gradient(180deg, rgba(22,18,45,0.92), rgba(14,12,30,0.86))",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  heroXPTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  heroXPBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    display: "grid",
    placeItems: "center",
    fontSize: 15,
    border: "1px solid rgba(140,86,255,0.28)",
    background: "rgba(140,86,255,0.14)",
    flexShrink: 0,
  },

  heroXPLabel: {
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.82,
    lineHeight: 1.1,
  },

  heroXPSub: {
    marginTop: 2,
    fontSize: 10,
    opacity: 0.58,
    lineHeight: 1.2,
  },

  heroXPValue: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    color: "rgba(180,120,255,0.98)",
  },

  puzzleBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(120,90,255,0.30)",
    background: "rgba(120,90,255,0.16)",
    display: "grid",
    placeItems: "center",
  },

  listHeader: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    opacity: 0.95,
  },

  listHeaderRight: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  pillMeta: {
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    opacity: 0.9,
  },

  list: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  empty: {
    padding: 14,
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.02)",
    opacity: 0.75,
    textAlign: "center",
  },

  pathWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "24px 0 12px",
  },

  pathInner: {
    width: "min(1000px, calc(100% - 40px))",
    position: "relative",
  },

  pathSvg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    overflow: "visible",
    pointerEvents: "none",
    zIndex: 1,
  },

  pathRowAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    display: "flex",
    minHeight: 88,
    zIndex: 2,
  },

  pathNode: {
    width: 88,
    height: 88,
    borderRadius: 999,
    border: "2px solid rgba(140,86,255,0.45)",
    background: "rgba(140,86,255,0.14)",
    color: "rgba(235,240,255,0.96)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    fontWeight: 900,
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },

  pathNodeDone: {
    border: "2px solid rgba(60,255,201,0.45)",
    background: "rgba(60,255,201,0.14)",
    boxShadow: "0 0 24px rgba(60,255,201,0.14)",
  },

  pathNodeActive: {
    border: "2px solid rgba(140,86,255,0.52)",
    background: "rgba(140,86,255,0.20)",
    boxShadow: "0 0 24px rgba(140,86,255,0.18)",
  },

  pathNodeLocked: {
    border: "2px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.025)",
    opacity: 0.68,
  },

  pathNodeInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },

  pathNodeIndex: {
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1,
  },

  pathNodeType: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
    opacity: 0.8,
    textTransform: "uppercase",
  },

  pathLabelCard: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    minWidth: 170,
    maxWidth: 220,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },

  pathLabelCardLeft: {
    left: 110,
  },

  pathLabelCardRight: {
    right: 110,
    textAlign: "right",
  },

  pathLabelTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(235,240,255,0.96)",
  },

  pathLabelMeta: {
    marginTop: 4,
    fontSize: 11,
    opacity: 0.72,
    lineHeight: 1.5,
  },

  pathPuzzleActions: {
    display: "flex",
    gap: 8,
    marginTop: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },

  pathMiniBtn: {
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid rgba(120,90,255,0.30)",
    background: "rgba(120,90,255,0.16)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 800,
  },

  pathMiniBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
