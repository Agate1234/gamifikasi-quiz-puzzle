import React, { useEffect, useMemo, useState } from "react";
import MateriFullscreen from "./materi/DetailMateri";
import QuizFullscreen, { readActiveQuizSession } from "./quiz/PengerjaanQuiz";
import PuzzleFullscreen from "./puzzle/PengerjaanPuzzle";
import HasilPuzzle from "./puzzle/HasilPuzzle";
import DetailPuzzleModal from "./puzzle/DetailPuzzle";
import { getMapPuzzleByIdApi } from "../../../components/api/puzzlemap";
import { useNavigate } from "react-router-dom";
import {
  getMapMateriByIdApi,
  updateProgressMateriDoneApi,
} from "../../../components/api/materimap";
import HasilQuiz from "./quiz/HasilQuiz";
import DetailQuizModal from "./quiz/DetailQuiz";
import { getMapQuizByIdApi } from "../../../components/api/quizmap";
import { getNextSoalMahasiswaApi } from "../../../components/api/soal";


const decodeLocalValue = (raw) => {
  try {
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    try {
      return JSON.parse(atob(raw));
    } catch {
      return null;
    }
  }
};

const getEncryptedLocal = (key, fallback = "") => {
  const decoded = decodeLocalValue(localStorage.getItem(key));
  return decoded ?? fallback;
};

const getSessionUser = () => {
  const session = decodeLocalValue(localStorage.getItem("session"));
  return session?.data || {};
};

const getSessionValue = (key, fallback = "") => {
  const user = getSessionUser();
  return user?.[key] ?? fallback;
};

function normalizeStatus(value) {
  return String(value || "").toLowerCase().trim();
}

function isProgressDone(item) {
  const status = normalizeStatus(item?.raw_status || item?.status);
  return item?.done === true || status === "done" || status === "selesai";
}

function getPuzzleType(item) {
  return String(item?.tipe_puzzle || item?.type || "drag_drop")
    .toLowerCase()
    .trim();
}

function getNumberId(item, keys = []) {
  for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }

  const rawId = String(item?.id || "").replace(/[^0-9]/g, "");
  const value = Number(rawId);

  return Number.isFinite(value) ? value : 0;
}

function shouldShowQuizTutorByDb(currentQuiz, allQuiz = []) {
  const currentId = getNumberId(currentQuiz, ["id_quiz"]);

  if (!currentQuiz || isProgressDone(currentQuiz)) return false;

  const previousDoneQuiz = (allQuiz || []).some((item) => {
    const itemId = getNumberId(item, ["id_quiz"]);
    if (!itemId || !currentId) return false;

    return itemId < currentId && isProgressDone(item);
  });

  return !previousDoneQuiz;
}

function shouldShowPuzzleTutorByDb(currentPuzzle, allPuzzle = []) {
  const currentId = getNumberId(currentPuzzle, ["id_puzzle"]);
  const currentType = getPuzzleType(currentPuzzle);

  if (!currentPuzzle || isProgressDone(currentPuzzle)) return false;

  const previousDoneSameType = (allPuzzle || []).some((item) => {
    const itemId = getNumberId(item, ["id_puzzle"]);
    if (!itemId || !currentId) return false;

    return (
      itemId < currentId &&
      getPuzzleType(item) === currentType &&
      isProgressDone(item)
    );
  });

  return !previousDoneSameType;
}

function NodePathSection({ list, tab, onPrimaryAction }) {
  const currentIndex = (list || []).findIndex((item) => {
    const locked = item?.status === "preview" || item?.is_unlock === false;
    return !isProgressDone(item) && !locked;
  });

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
          const isDone = isProgressDone(item);
          const isLocked = item.status === "preview" || item.is_unlock === false;
          const isActive = !isDone && !isLocked;
          const isCurrentFocus = isActive && index === currentIndex;
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
                className={isCurrentFocus ? "codetrail-current-node" : undefined}
                onClick={() => {
                  if (isLocked) return;
                  onPrimaryAction(item);
                }}
                title={item.title}
                style={{
                  ...M.pathNode,
                  ...(isDone ? M.pathNodeDone : {}),
                  ...(isActive ? M.pathNodeActive : {}),
                  ...(isCurrentFocus ? M.pathNodeCurrent : {}),
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
                className={isCurrentFocus ? "codetrail-current-label" : undefined}
                style={{
                  ...M.pathLabelCard,
                  ...(left ? M.pathLabelCardLeft : M.pathLabelCardRight),
                  ...(isCurrentFocus ? M.pathLabelCardCurrent : {}),
                }}
              >
                {isCurrentFocus ? (
                  <div style={M.pathCurrentBadge}>Lanjutkan</div>
                ) : null}

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

const moduleCurrentEffectCss = `
  @keyframes codetrailCurrentPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow:
        0 0 0 0 rgba(60, 255, 201, 0.40),
        0 0 34px rgba(60, 255, 201, 0.28),
        0 0 56px rgba(140, 86, 255, 0.20);
    }
    50% {
      transform: scale(1.07);
      box-shadow:
        0 0 0 14px rgba(60, 255, 201, 0),
        0 0 46px rgba(60, 255, 201, 0.48),
        0 0 78px rgba(140, 86, 255, 0.30);
    }
  }

  @keyframes codetrailCurrentLabelGlow {
    0%, 100% {
      box-shadow:
        0 14px 34px rgba(0,0,0,0.22),
        0 0 22px rgba(60, 255, 201, 0.14);
    }
    50% {
      box-shadow:
        0 18px 42px rgba(0,0,0,0.26),
        0 0 34px rgba(60, 255, 201, 0.26);
    }
  }

  .codetrail-current-node {
    animation: codetrailCurrentPulse 1.9s ease-in-out infinite;
  }

  .codetrail-current-label {
    animation: codetrailCurrentLabelGlow 2.1s ease-in-out infinite;
  }
`;


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
  const [quizWorkTutorActive, setQuizWorkTutorActive] = useState(false);
  const [puzzleWorkTutorActive, setPuzzleWorkTutorActive] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (open) setTab("materi");
  }, [open, module?.id]);

  useEffect(() => {
    setLocalModule(module);
  }, [module]);

  useEffect(() => {
    if (!open || !localModule) return;

    const activeQuizSession = readActiveQuizSession();
    if (!activeQuizSession?.quizId) return;

    const quizInModule = (localModule.kuis || []).find((quiz) => {
      return String(quiz.id_quiz) === String(activeQuizSession.quizId);
    });

    if (!quizInModule) return;

    const quizIsDone =
      quizInModule.raw_status === "done" ||
      quizInModule.raw_status === "selesai" ||
      quizInModule.status === "done" ||
      quizInModule.status === "selesai" ||
      quizInModule.done === true;

    if (quizIsDone) return;

    setQuizDetailOpen(false);
    setShowQuizResult(false);
    setQuizResultData(null);
    setSelectedQuiz(quizInModule);
    setQuizTitle(activeQuizSession.quizTitle || quizInModule.title || "Kuis");
    setActiveQuizId(quizInModule.id_quiz);
    setQuizXp(Number(activeQuizSession.quizXp ?? quizInModule.xp ?? 0));
    setQuizWorkTutorActive(false);
    setQuizOpen(true);
    setTab("kuis");
  }, [open, localModule]);

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

  const list = useMemo(() => {
    if (!localModule) return [];
    if (tab === "kuis") return localModule.kuis || [];
    if (tab === "puzzle") return localModule.puzzle || [];
    return localModule.materi || [];
  }, [tab, localModule]);

  const firstAvailableMateri = useMemo(() => {
    return (localModule?.materi || []).find((item) => item.status !== "preview" && item.is_unlock !== false) || (localModule?.materi || [])[0];
  }, [localModule]);

  const firstAvailableQuiz = useMemo(() => {
    return (localModule?.kuis || []).find((item) => item.status !== "preview" && item.is_unlock !== false) || (localModule?.kuis || [])[0];
  }, [localModule]);

  const firstDoneQuiz = useMemo(() => {
    return (localModule?.kuis || []).find((item) => item.done || item.raw_status === "done" || item.status === "done") || firstAvailableQuiz;
  }, [localModule, firstAvailableQuiz]);

  const firstAvailablePuzzle = useMemo(() => {
    return (localModule?.puzzle || []).find((item) => item.status !== "preview" && item.is_unlock !== false) || (localModule?.puzzle || [])[0];
  }, [localModule]);

  const firstDonePuzzle = useMemo(() => {
    return (localModule?.puzzle || []).find((item) => item.done || item.raw_status === "done" || item.status === "done") || firstAvailablePuzzle;
  }, [localModule, firstAvailablePuzzle]);

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
      const idUser = getEncryptedLocal("ct_id_user", getSessionValue("id_user", localStorage.getItem("id_user") || ""));

      if (idUser) {
        params.append("id_user", idUser);
      }

      const response = await getMapMateriByIdApi(rawId, params);

      if (response?.status === 200 && response?.data?.success) {
        const m = response.data.data;

        setActiveMateri({
          ...m,
          id: `materi-${m.id_materi}`,
          id_progress: m.id_progress,
          id_materi: m.id_materi,
          id_modul: m.id_modul,
          title: m.judul_materi || "Materi",
          judul_materi: m.judul_materi || "Materi",
          desc: m.deskripsi_materi || "-",
          deskripsi_materi: m.deskripsi_materi || "-",
          xp: Number(m.exp_materi || 0),
          exp_materi: Number(m.exp_materi || 0),
          status: m.status || (m.is_unlock ? "not done" : "locked"),
          raw_status: m.status || (m.is_unlock ? "not done" : "locked"),
          is_unlock: !!m.is_unlock,
          done: m.status === "done",
        });
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
      const idUser = getEncryptedLocal("ct_id_user", getSessionValue("id_user", localStorage.getItem("id_user") || ""));
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
          done: q.status === "done" || q.status === "selesai",
          id_modul: q.id_modul,
          id_user: q.id_user,
          id_progress_quiz: q.id_progress_quiz,

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
      const idUser = getEncryptedLocal("ct_id_user", getSessionValue("id_user", localStorage.getItem("id_user") || ""));

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
          done: p.status === "done" || p.status === "selesai",
          id_user: p.id_user,

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
      selectedQuiz.raw_status === "done" ||
      selectedQuiz.raw_status === "selesai" ||
      selectedQuiz.status === "done" ||
      selectedQuiz.status === "selesai" ||
      selectedQuiz.done === true;

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

    const shouldShowWorkTutor = shouldShowQuizTutorByDb(
      selectedQuiz,
      localModule?.allKuis || localModule?.kuis || [],
    );

    setQuizWorkTutorActive(shouldShowWorkTutor);
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
          playWinEffect: false,
          source: "preview",
        },
      });

      setShowPuzzleResult(true);
      return;
    }

    setActivePuzzle(selectedPuzzle);
    setPuzzleType(
      selectedPuzzle.tipe_puzzle || selectedPuzzle.type || "drag_drop",
    );
    const shouldShowWorkTutor = shouldShowPuzzleTutorByDb(
      selectedPuzzle,
      localModule?.allPuzzle || localModule?.puzzle || [],
    );

    setPuzzleWorkTutorActive(shouldShowWorkTutor);
    setShowPuzzle(true);
  };

  const onStartPuzzle = (item, type = "drag_drop") => {
    if (item.status === "preview") return;

    setActivePuzzle(item);
    setPuzzleType(type);
    setPuzzleWorkTutorActive(
      shouldShowPuzzleTutorByDb(item, localModule?.allPuzzle || localModule?.puzzle || []),
    );
    setShowPuzzle(true);
  };


  const updateMateriUnlockUI = (finishedMateri, res = {}) => {
    setLocalModule((prev) => {
      if (!prev?.materi) return prev;

      const finishedId = finishedMateri?.id_materi;

      const currentIndex = prev.materi.findIndex((item) => {
        return Number(item.id_materi) === Number(finishedId);
      });

      const nextModule = {
        ...prev,
        materi: prev.materi.map((item, index) => {
          const isCurrentMateri = Number(item.id_materi) === Number(finishedId);
          const isNextMateri = currentIndex !== -1 && index === currentIndex + 1;

          if (isCurrentMateri) {
            return {
              ...item,
              done: true,
              status: "done",
              raw_status: "done",
              is_unlock: true,
              hasil: res,
            };
          }

          if (isNextMateri) {
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

  const handleFinishMateri = async () => {
    if (!activeMateri) return;

    const isDone =
      activeMateri.raw_status === "done" || activeMateri.status === "done";

    if (isDone) {
      setMateriOpen(false);
      return;
    }

    if (!activeMateri.id_progress) {
      console.error("id_progress materi tidak ada:", activeMateri);
      return;
    }

    try {
      setMateriLoading(true);

      const response = await updateProgressMateriDoneApi(activeMateri.id_progress);

      if (response?.status === 200 && response?.data?.success) {
        const current = response.data.data?.current || {};

        updateMateriUnlockUI(activeMateri, current);

        setActiveMateri((prev) => ({
          ...prev,
          done: true,
          status: "done",
          raw_status: "done",
          is_unlock: true,
        }));

        setMateriOpen(false);
      }
    } catch (error) {
      console.log("Gagal menyelesaikan materi:", error);
    } finally {
      setMateriLoading(false);
    }
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
      allKuis: (prev.allKuis || prev.kuis || []).map((item) => {
        if (Number(item.id_quiz) !== Number(finishedId)) return item;

        return {
          ...item,
          done: true,
          status: "done",
          raw_status: "done",
          is_unlock: true,
          score: res.score100,
          hasil: res,
        };
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
      allPuzzle: (prev.allPuzzle || prev.puzzle || []).map((item) => {
        if (Number(item.id_puzzle) !== Number(finishedId)) return item;

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
      }),
    };

    notifyModuleProgressChange(nextModule);

    return nextModule;
  });
};

  return (
    <>
      <style>{moduleCurrentEffectCss}</style>
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
            <section style={M.hero} data-tutor="module-hero">
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

                <div style={M.tabs} data-tutor="module-tabs">
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
                  ? "Daftar Materi"
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
              <div style={M.list} data-tutor="module-list">
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
        onNext={handleFinishMateri}
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
        tutorActive={quizWorkTutorActive}
        onTutorQuizFinished={() => {
          setQuizWorkTutorActive(false);
        }}
        onFinish={(quizResult) => {
          updateQuizUnlockUI(
            {
              id_quiz: activeQuizId,
            },
            quizResult,
          );

          setQuizOpen(false);
          setQuizResultData({
            quiz: selectedQuiz || {
              id_quiz: activeQuizId,
              title: quizTitle,
              xp: quizXp,
            },
            result: quizResult,
          });
          setShowQuizResult(true);
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
        tutorActive={puzzleWorkTutorActive}
        onTutorPuzzleFinished={() => {
          setPuzzleWorkTutorActive(false);
        }}
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
            result: {
              ...res,
              playWinEffect: true,
              justFinished: true,
              source: "finish",
            },
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
  disabledBackBtn: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(2,6,23,0.78)",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "stretch",
  },

  sheet: {
    width: "100%",
    height: "100%",
    background: "#020617",
    color: "#F8FAFC",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    overflow: "hidden",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "16px 24px",
    borderBottom: "1px solid rgba(148,163,184,0.08)",
    background: "#0F172A",
    backdropFilter: "blur(12px)",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },

  breadcrumbStrong: {
    fontSize: 13,
    fontWeight: 800,
    color: "#F8FAFC",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  muted: {
    fontSize: 12,
    color: "#64748B",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.12)",
    background: "#111827",
    color: "#E2E8F0",
    cursor: "pointer",
    fontSize: 17,
    transition: "all .2s ease",
  },

  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  pillSmall: {
    fontSize: 12,
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#111827",
    color: "#CBD5E1",
    fontWeight: 600,
  },

  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#111827",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    color: "#E2E8F0",
  },

  content: {
    height: "calc(100% - 74px)",
    overflowY: "auto",
    padding: 26,
  },

  hero: {
    borderRadius: 30,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#0F172A",
    padding: 32,
    display: "flex",
    justifyContent: "space-between",
    gap: 28,
    flexWrap: "wrap",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    position: "relative",
    overflow: "hidden",
  },

  heroLeft: {
    minWidth: 0,
    flex: 1,
    zIndex: 2,
  },

  heroTags: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  tag: {
    fontSize: 11,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#1E293B",
    border: "1px solid rgba(148,163,184,0.10)",
    color: "#CBD5E1",
    fontWeight: 700,
    letterSpacing: 0.4,
  },

  heroTitle: {
    fontSize: 40,
    fontWeight: 900,
    lineHeight: 1.05,
    color: "#FFFFFF",
    letterSpacing: "-1px",
  },

  heroDesc: {
    marginTop: 16,
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 1.9,
    maxWidth: 760,
  },

  heroProgressWrap: {
    marginTop: 24,
  },

  heroProgressText: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 10,
    fontWeight: 600,
  },

  progressOuter: {
    height: 12,
    borderRadius: 999,
    background: "#1E293B",
    overflow: "hidden",
    border: "1px solid rgba(148,163,184,0.08)",
    maxWidth: 720,
  },

  progressInner: {
    height: "100%",
    borderRadius: 999,
    background: "#6366F1",
    boxShadow: "0 0 18px rgba(99,102,241,0.45)",
    transition: "width .35s ease",
  },

  tabs: {
    marginTop: 22,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  tabBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#111827",
    color: "#CBD5E1",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    transition: "all .2s ease",
  },

  tabBtnActive: {
    background: "#4F46E5",
    border: "1px solid rgba(99,102,241,0.35)",
    color: "#fff",
    boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
  },

  heroRight: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    zIndex: 2,
  },

  heroXP: {
    width: 270,
    padding: "20px 18px",
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#111827",
    boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  heroXPTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  heroXPBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    border: "1px solid rgba(99,102,241,0.18)",
    background: "#1E293B",
    color: "#A5B4FC",
  },

  heroXPLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#E2E8F0",
  },

  heroXPSub: {
    marginTop: 4,
    fontSize: 11,
    color: "#64748B",
  },

  heroXPValue: {
    fontSize: 34,
    fontWeight: 900,
    color: "#818CF8",
    lineHeight: 1,
  },

  listHeader: {
    marginTop: 28,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#F8FAFC",
    letterSpacing: "-0.4px",
  },

  listHeaderRight: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  pillMeta: {
    fontSize: 12,
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#111827",
    color: "#CBD5E1",
    fontWeight: 600,
  },

  list: {
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  empty: {
    padding: 20,
    borderRadius: 20,
    border: "1px dashed rgba(148,163,184,0.12)",
    background: "#0F172A",
    color: "#64748B",
    textAlign: "center",
    fontSize: 14,
  },

  pathWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "34px 0 24px",
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
    minHeight: 96,
    zIndex: 2,
  },

  pathNode: {
    width: 96,
    height: 96,
    borderRadius: 999,
    border: "2px solid rgba(99,102,241,0.22)",
    background: "#111827",
    color: "#F8FAFC",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    fontWeight: 900,
    boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
    transition: "all .2s ease",
  },

  pathNodeDone: {
    border: "2px solid rgba(34,197,94,0.28)",
    background: "#052E16",
    color: "#BBF7D0",
    boxShadow: "0 0 24px rgba(34,197,94,0.15)",
  },

  pathNodeActive: {
    border: "2px solid rgba(99,102,241,0.40)",
    boxShadow: "0 0 24px rgba(99,102,241,0.18)",
  },

  pathNodeCurrent: {
    border: "2px solid #22C55E",
    background: "#0B1120",
    boxShadow: `
      0 0 0 6px rgba(34,197,94,0.10),
      0 0 26px rgba(34,197,94,0.18)
    `,
  },

  pathNodeLocked: {
    border: "2px solid rgba(148,163,184,0.08)",
    background: "#0F172A",
    opacity: 0.45,
  },

  pathNodeInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },

  pathNodeIndex: {
    fontSize: 25,
    fontWeight: 900,
    lineHeight: 1,
  },

  pathNodeType: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    opacity: 0.8,
    textTransform: "uppercase",
  },

  pathLabelCard: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    minWidth: 200,
    maxWidth: 250,
    padding: "16px 18px",
    borderRadius: 20,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#111827",
    boxShadow: "0 16px 40px rgba(0,0,0,0.30)",
  },

  pathLabelCardCurrent: {
    border: "1px solid rgba(34,197,94,0.22)",
    boxShadow: `
      0 18px 44px rgba(0,0,0,0.35),
      0 0 20px rgba(34,197,94,0.10)
    `,
  },

  pathCurrentBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid rgba(34,197,94,0.14)",
    background: "rgba(34,197,94,0.10)",
    color: "#86EFAC",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  pathLabelCardLeft: {
    left: 125,
  },

  pathLabelCardRight: {
    right: 125,
    textAlign: "right",
  },

  pathLabelTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#F8FAFC",
    lineHeight: 1.4,
  },

  pathLabelMeta: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 1.7,
  },

  pathPuzzleActions: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },

  pathMiniBtn: {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "#1E293B",
    color: "#F8FAFC",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 800,
    transition: "all .2s ease",
  },

  pathMiniBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
};