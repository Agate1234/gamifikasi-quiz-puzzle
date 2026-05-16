import React, { useEffect, useState } from "react";
import ModulePage from "./component/DetailModul";
import { getMapModulApi } from "../../components/api/roadmap";
import { getMapMateriApi } from "../../components/api/materimap";
import { getMapQuizApi } from "../../components/api/quizmap";
import { getMapPuzzleApi } from "../../components/api/puzzlemap";

function normalizeModules(
  apiData = [],
  materiMap = [],
  quizMap = [],
  puzzleMap = [],
) {
  const unlockedItems = apiData.filter((item) => item.is_unlock);
  const firstUnlockedId = unlockedItems[0]?.id_modul ?? null;

  const groupedMateri = materiMap.reduce((acc, item) => {
    const modulId = String(item.id_modul);

    if (!acc[modulId]) acc[modulId] = [];

    acc[modulId].push({
      id: `materi-${item.id_materi}`,
      id_materi: item.id_materi,
      title: item.judul_materi || "Materi",
      desc: item.deskripsi_materi || "-",
      xp: Number(item.exp_materi || 0),
      status: item.is_unlock ? "mulai" : "preview",
      highlight: false,
      done: item.status === "selesai" || item.status === "done",
      is_unlock: !!item.is_unlock,
      raw_status: item.status,
    });

    return acc;
  }, {});

  const groupedQuiz = quizMap.reduce((acc, item) => {
    const modulId = String(item.id_modul);

    if (!acc[modulId]) acc[modulId] = [];

    acc[modulId].push({
      id: `quiz-${item.id_quiz}`,
      id_quiz: item.id_quiz,
      title: item.judul_quiz || "Quiz",
      desc: item.deskripsi_quiz || "-",
      xp: Number(item.exp_quiz || 0),
      score: Number(item.score || 0),
      status: item.is_unlock ? "mulai" : "preview",
      highlight: false,
      done: item.status === "selesai" || item.status === "done",
      is_unlock: !!item.is_unlock,
      raw_status: item.status,
    });

    return acc;
  }, {});

  const groupedPuzzle = puzzleMap.reduce((acc, item) => {
    const modulId = String(item.id_modul);

    if (!acc[modulId]) acc[modulId] = [];

    acc[modulId].push({
      id: `puzzle-${item.id_puzzle}`,
      id_puzzle: item.id_puzzle,
      title: item.judul_puzzle || "Puzzle",
      desc: item.deskripsi_puzzle || "-",
      type: item.tipe_puzzle || "drag_drop",
      tipe_puzzle: item.tipe_puzzle || "drag_drop",
      difficulty: item.difficulty_puzzle || "-",
      xp: Number(item.exp_puzzle || 0),
      attempt: Number(item.attempt || 0),
      waktu: Number(item.waktu || 300),
      status: item.is_unlock ? "mulai" : "preview",
      highlight: false,
      done: item.status === "selesai" || item.status === "done",
      is_unlock: !!item.is_unlock,
      raw_status: item.status,
    });

    return acc;
  }, {});

  return apiData.map((item) => {
    const modulId = String(item.id_modul);

    const materiItems = groupedMateri[modulId] || [];
    const quizItems = groupedQuiz[modulId] || [];
    const puzzleItems = groupedPuzzle[modulId] || [];

    const activities = [
      ...materiItems.map((m, i) => ({
        key: `materi-${m.id_materi ?? i + 1}`,
        label: m.title || `Materi ${i + 1}`,
        done: !!m.done,
        kind: "materi",
      })),

      ...quizItems.map((q, i) => ({
        key: `kuis-${q.id_quiz ?? i + 1}`,
        label: q.title || `Kuis ${i + 1}`,
        done: !!q.done,
        kind: "kuis",
      })),

      ...puzzleItems.map((p, i) => ({
        key: `puzzle-${p.id_puzzle ?? i + 1}`,
        label: p.title || `Puzzle ${i + 1}`,
        done: !!p.done,
        kind: "puzzle",
      })),
    ];

    const isDone = false;
    const isActive = item.is_unlock && item.id_modul === firstUnlockedId;
    const isLocked = !item.is_unlock;

    return {
      id: String(item.id_modul),
      id_modul: item.id_modul,
      title: item.judul_modul,
      level: `Level ${item.level}`,
      levelNumber: Number(item.level || 1),
      xp: Number(item.exp_modul || 0),
      status: isDone ? "done" : isLocked ? "locked" : isActive ? "active" : "active",
      description: item.deskripsi_modul || "-",
      is_unlock: !!item.is_unlock,

      materiCount: materiItems.length,
      kuisCount: quizItems.length,
      puzzleCount: puzzleItems.length,
      activities,

      materi: materiItems,
      kuis: quizItems,
      puzzle: puzzleItems,
    };
  });
}

function moduleCompletion(mod) {
  const total = mod.activities?.length || 0;
  const done = mod.activities?.filter((a) => a.done).length || 0;

  return total === 0 ? 0 : done / total;
}

function isModuleDone(mod) {
  return moduleCompletion(mod) >= 1;
}

function buildActivitiesFromModuleItems(
  materiItems = [],
  quizItems = [],
  puzzleItems = [],
) {
  return [
    ...materiItems.map((m, i) => ({
      key: `materi-${m.id_materi ?? i + 1}`,
      label: m.title || `Materi ${i + 1}`,
      done:
        m.done === true ||
        m.status === "done" ||
        m.status === "selesai" ||
        m.raw_status === "done" ||
        m.raw_status === "selesai",
      kind: "materi",
    })),

    ...quizItems.map((q, i) => ({
      key: `kuis-${q.id_quiz ?? i + 1}`,
      label: q.title || `Kuis ${i + 1}`,
      done:
        q.done === true ||
        q.status === "done" ||
        q.status === "selesai" ||
        q.raw_status === "done" ||
        q.raw_status === "selesai",
      kind: "kuis",
    })),

    ...puzzleItems.map((p, i) => ({
      key: `puzzle-${p.id_puzzle ?? i + 1}`,
      label: p.title || `Puzzle ${i + 1}`,
      done:
        p.done === true ||
        p.status === "done" ||
        p.status === "selesai" ||
        p.raw_status === "done" ||
        p.raw_status === "selesai",
      kind: "puzzle",
    })),
  ];
}

export default function RoadmapMahasiswa() {
  const [modules, setModules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalModule, setModalModule] = useState(null);

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        const idUser = localStorage.getItem("id_user") || "";

        if (idUser) {
          params.append("id_user", idUser);
        }

        const [roadmapResponse, materiResponse, quizResponse, puzzleResponse] =
          await Promise.all([
            getMapModulApi(params),
            getMapMateriApi(params),
            getMapQuizApi(params),
            getMapPuzzleApi(params),
          ]);

        if (roadmapResponse?.status === 200 && roadmapResponse?.data?.success) {
          const normalized = normalizeModules(
            roadmapResponse.data.data || [],
            materiResponse?.data?.data || [],
            quizResponse?.data?.data || [],
            puzzleResponse?.data?.data || [],
          );

          setModules(normalized);
          setSelectedId(normalized[0]?.id ?? null);
        } else {
          setModules([]);
          setSelectedId(null);
        }
      } catch (error) {
        console.log("Gagal mengambil roadmap:", error);
        setModules([]);
        setSelectedId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, []);

  useEffect(() => {
    if (loading || modules.length < 1) return;

    const idUser = localStorage.getItem("id_user") || "guest";
    const tutorialKey = `roadmap_tutorial_done_${idUser}`;
    const alreadyDone = localStorage.getItem(tutorialKey) === "true";

    const unlockedModules = modules.filter((mod) => mod.status !== "locked");

    const highestUnlockedLevel = unlockedModules.reduce((max, mod) => {
      return Math.max(max, Number(mod.levelNumber || 1));
    }, 1);

    if (alreadyDone) return;

    if (highestUnlockedLevel >= 2) {
      localStorage.setItem(tutorialKey, "true");
      return;
    }

    setTutorialOpen(true);
    setTutorialStep(0);
  }, [loading, modules]);

  const buildModulePageData = (mod) => {
    const materi = (mod.materi || []).map((item, i) => ({
      ...item,
      highlight: i === 0,
    }));

    const kuis = (mod.kuis || []).map((item) => ({
      ...item,
      highlight: false,
    }));

    const puzzle = (mod.puzzle || []).map((item) => ({
      ...item,
      highlight: false,
    }));

    const activities = buildActivitiesFromModuleItems(materi, kuis, puzzle);
    const totalActivities = activities.length;
    const doneActivities = activities.filter((item) => item.done).length;

    const progressValue =
      totalActivities > 0 ? doneActivities / totalActivities : 0;

    return {
      id: mod.id,
      id_modul: mod.id_modul,
      label: mod.level,
      title: mod.title,
      level: mod.level,
      levelNumber: mod.levelNumber,
      totalActivities,
      totalXP: mod.xp,
      heroTitle: mod.title,
      heroDesc: mod.description,
      progressText: `${doneActivities} dari ${totalActivities} aktivitas terselesaikan`,
      progressValue,
      materi,
      kuis,
      puzzle,
    };
  };

  const openModule = (mod) => {
    setSelectedId(mod.id);
    setModalModule(buildModulePageData(mod));
    setModalOpen(true);
  };

  const closeModule = () => setModalOpen(false);

  const finishTutorial = () => {
    const idUser = localStorage.getItem("id_user") || "guest";
    const tutorialKey = `roadmap_tutorial_done_${idUser}`;

    localStorage.setItem(tutorialKey, "true");
    setTutorialOpen(false);
    setTutorialStep(0);
  };

  const closeTutorialForNow = () => {
    setTutorialOpen(false);
    setTutorialStep(0);
  };

  const handleTutorialTargetClick = () => {
    if (tutorialStep < 2) {
      setTutorialStep((prev) => prev + 1);
      return;
    }

    const firstUnlockedModule =
      modules.find((mod) => mod.status !== "locked") || modules[0];

    finishTutorial();

    if (firstUnlockedModule) {
      openModule(firstUnlockedModule);
    }
  };

  const applyModuleProgressUpdate = (updatedModule) => {
    if (!updatedModule?.id) return;

    setModules((prev) =>
      prev.map((mod) => {
        if (String(mod.id) !== String(updatedModule.id)) return mod;

        const materi = updatedModule.materi || mod.materi || [];
        const kuis = updatedModule.kuis || mod.kuis || [];
        const puzzle = updatedModule.puzzle || mod.puzzle || [];

        const activities = buildActivitiesFromModuleItems(materi, kuis, puzzle);

        const moduleDone =
          activities.length > 0 && activities.every((item) => item.done);

        return {
          ...mod,
          materi,
          kuis,
          puzzle,
          activities,
          status: moduleDone ? "done" : mod.status,
        };
      }),
    );

    setModalModule((prev) => {
      if (!prev || String(prev.id) !== String(updatedModule.id)) return prev;

      const materi = updatedModule.materi || prev.materi || [];
      const kuis = updatedModule.kuis || prev.kuis || [];
      const puzzle = updatedModule.puzzle || prev.puzzle || [];

      const activities = buildActivitiesFromModuleItems(materi, kuis, puzzle);
      const totalActivities = activities.length;
      const doneActivities = activities.filter((item) => item.done).length;

      const progressValue =
        totalActivities > 0 ? doneActivities / totalActivities : 0;

      return {
        ...prev,
        ...updatedModule,
        materi,
        kuis,
        puzzle,
        totalActivities,
        progressText: `${doneActivities} dari ${totalActivities} aktivitas terselesaikan`,
        progressValue,
      };
    });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <main style={styles.main}>
          <div style={styles.loadingBox}>Loading roadmap...</div>
        </main>
      </div>
    );
  }

  const firstUnlockedIndexRaw = modules.findIndex(
    (item) => item.status !== "locked",
  );

  const firstUnlockedIndex =
    firstUnlockedIndexRaw >= 0 ? firstUnlockedIndexRaw : 0;

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes tourGlowPulse {
            0%, 100% {
              box-shadow:
                0 0 26px rgba(60,255,201,0.65),
                inset 0 0 14px rgba(60,255,201,0.12);
            }
            50% {
              box-shadow:
                0 0 44px rgba(60,255,201,0.95),
                inset 0 0 22px rgba(60,255,201,0.18);
            }
          }

          @media (max-width: 760px) {
            .roadmap-row {
              grid-template-columns: 1fr !important;
              min-height: auto !important;
              gap: 14px !important;
            }

            .roadmap-center {
              display: none !important;
            }

            .roadmap-col {
              justify-content: center !important;
            }

            .roadmap-spacer {
              display: none !important;
            }
          }
        `}
      </style>

      <main style={styles.main}>
        <div style={styles.timelineWrap} data-tour="roadmap">
          <div style={styles.timelineLine} />

          <div style={styles.timelineContent}>
            {modules.map((mod, idx) => {
              const left = idx % 2 === 0;
              const completed = isModuleDone(mod);
              const active = mod.status === "active";
              const locked = mod.status === "locked";
              const selected = selectedId === mod.id;
              const isFirstUnlocked = idx === firstUnlockedIndex;

              return (
                <div key={mod.id} className="roadmap-row" style={styles.row}>
                  <div
                    className="roadmap-col"
                    style={{ ...styles.col, justifyContent: "flex-end" }}
                  >
                    {left ? (
                      <ModuleCard
                        mod={mod}
                        selected={selected}
                        tourTarget={
                          isFirstUnlocked ? "first-module" : undefined
                        }
                        onClick={() => {
                          if (mod.status !== "locked") openModule(mod);
                        }}
                      />
                    ) : (
                      <div className="roadmap-spacer" style={styles.spacer} />
                    )}
                  </div>

                  <div className="roadmap-center" style={styles.centerCol}>
                    <div
                      style={{
                        ...styles.node,
                        ...(locked ? styles.nodeLocked : {}),
                        ...(active ? styles.nodeActive : {}),
                        ...(completed ? styles.nodeDone : {}),
                      }}
                      title={
                        locked ? "Terkunci" : completed ? "Selesai" : "Aktif"
                      }
                    >
                      {completed ? "✓" : locked ? "🔒" : "•"}
                    </div>

                    {idx < modules.length - 1 && (
                      <div style={styles.nodeConnector} />
                    )}
                  </div>

                  <div
                    className="roadmap-col"
                    style={{ ...styles.col, justifyContent: "flex-start" }}
                  >
                    {!left ? (
                      <ModuleCard
                        mod={mod}
                        selected={selected}
                        tourTarget={
                          isFirstUnlocked ? "first-module" : undefined
                        }
                        onClick={() => {
                          if (mod.status !== "locked") openModule(mod);
                        }}
                      />
                    ) : (
                      <div className="roadmap-spacer" style={styles.spacer} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <RoadmapSpotlightTutorial
        open={tutorialOpen}
        step={tutorialStep}
        onClose={closeTutorialForNow}
        onSkip={finishTutorial}
        onTargetClick={handleTutorialTargetClick}
      />

      <ModulePage
        open={modalOpen}
        module={modalModule}
        onClose={closeModule}
        onModuleProgressChange={applyModuleProgressUpdate}
      />
    </div>
  );
}

function StatusBadge({ status, done }) {
  const text = done ? "DONE" : status.toUpperCase();

  const style = done
    ? styles.badgeDone
    : status === "active"
      ? styles.badgeActive
      : styles.badgeLocked;

  return <span style={{ ...styles.badge, ...style }}>{text}</span>;
}

function ModuleCard({ mod, selected, onClick, tourTarget }) {
  const done = isModuleDone(mod);
  const completion = Math.round(moduleCompletion(mod) * 100);
  const locked = mod.status === "locked";

  return (
    <div
      data-tour={tourTarget}
      onClick={locked ? undefined : onClick}
      role={locked ? undefined : "button"}
      style={{
        ...styles.card,
        cursor: locked ? "not-allowed" : "pointer",
        ...(selected ? styles.cardSelected : {}),
        ...(locked ? styles.cardLocked : {}),
      }}
      title={locked ? "Modul masih terkunci" : "Klik untuk melihat detail"}
    >
      <div style={styles.cardTop}>
        <div style={styles.cardTitleRow}>
          <div style={styles.cardTitle}>{mod.title}</div>
          <div style={styles.cardXp}>{mod.xp} XP</div>
        </div>

        <div style={styles.cardSub}>
          {mod.level} • <StatusBadge status={mod.status} done={done} />
        </div>
      </div>

      <div style={styles.cardDesc}>{mod.description}</div>

      <div style={styles.cardProgressRow}>
        <div style={styles.cardProgressOuter}>
          <div
            style={{
              ...styles.cardProgressInner,
              width: `${completion}%`,
            }}
          />
        </div>

        <div style={styles.cardProgressText}>{completion}%</div>
      </div>

      <div style={styles.stepsRow}>
        {mod.activities.length > 0 ? (
          mod.activities.map((a) => (
            <div
              key={a.key}
              style={{
                ...styles.step,
                ...(a.done ? styles.stepDone : styles.stepTodo),
              }}
              title={a.label}
            >
              {a.done ? "✓" : "•"}
            </div>
          ))
        ) : (
          <span style={styles.emptyActivityText}>Belum ada isi modul</span>
        )}
      </div>
    </div>
  );
}

function RoadmapSpotlightTutorial({
  open,
  step,
  onClose,
  onSkip,
  onTargetClick,
}) {
  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      target: "roadmap-area",
      icon: "🗺️",
      title: "Ini jalur roadmap belajar",
      text: "Mulai dari modul pertama yang aktif, lalu lanjutkan sampai modul berikutnya terbuka.",
      actionText: "Paham, lanjut",
    },
    {
      target: "first-module",
      icon: "🎯",
      title: "Klik modul yang terbuka",
      text: "Klik modul ini untuk masuk ke detail. Di dalamnya ada materi, kuis, dan puzzle yang harus diselesaikan.",
      actionText: "Klik modul ini",
    },
    {
      target: "first-module",
      icon: "🚀",
      title: "Mulai belajar sekarang",
      text: "Kerjakan aktivitasnya satu per satu. Kalau sudah selesai, progress dan XP kamu akan naik.",
      actionText: "Mulai belajar",
    },
  ];

  const current = steps[step];

  useEffect(() => {
    if (!open || !current) return;

    let timer1 = null;
    let timer2 = null;

    const scrollToFirstModule = () => {
      const firstModule = document.querySelector(`[data-tour="first-module"]`);

      if (!firstModule) {
        setTargetRect(null);
        return;
      }

      const rect = firstModule.getBoundingClientRect();
      const absoluteTop = rect.top + window.pageYOffset;

      window.scrollTo({
        top: Math.max(0, absoluteTop - 165),
        behavior: "smooth",
      });
    };

    const readTargetRect = () => {
      const viewportH = window.innerHeight;

      if (current.target === "roadmap-area") {
        const roadmap = document.querySelector(`[data-tour="roadmap"]`);
        const firstModule = document.querySelector(`[data-tour="first-module"]`);

        if (!roadmap || !firstModule) {
          setTargetRect(null);
          return;
        }

        const roadmapRect = roadmap.getBoundingClientRect();
        const firstRect = firstModule.getBoundingClientRect();

        const top = Math.max(8, firstRect.top - 22);
        const bottom = viewportH - 16;

        setTargetRect({
          top,
          left: roadmapRect.left,
          width: roadmapRect.width,
          height: Math.max(220, bottom - top),
        });

        return;
      }

      const target = document.querySelector(`[data-tour="${current.target}"]`);

      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const updateRect = () => {
      scrollToFirstModule();

      timer1 = setTimeout(readTargetRect, 100);
      timer2 = setTimeout(readTargetRect, 520);
    };

    updateRect();

    window.addEventListener("resize", readTargetRect);
    window.addEventListener("scroll", readTargetRect, true);

    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      window.removeEventListener("resize", readTargetRect);
      window.removeEventListener("scroll", readTargetRect, true);
    };
  }, [open, step, current]);

  if (!open || !current) return null;

  const padding = current.target === "roadmap-area" ? 4 : 10;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const safeRect = targetRect || {
    top: 150,
    left: viewportW / 2 - 500,
    width: 1000,
    height: viewportH - 166,
  };

  const spotlight = {
    top: Math.max(8, safeRect.top - padding),
    left: Math.max(8, safeRect.left - padding),
    width: Math.min(safeRect.width + padding * 2, viewportW - 16),
    height: Math.min(safeRect.height + padding * 2, viewportH - 16),
  };

  const holeRight = spotlight.left + spotlight.width;
  const holeBottom = spotlight.top + spotlight.height;

  const isMobile = viewportW < 760;
  const bubbleWidth = 340;
  const bubbleHeight = 270;

  const canPlaceRight = holeRight + bubbleWidth + 18 <= viewportW;
  const canPlaceLeft = spotlight.left - bubbleWidth - 18 >= 18;

  let bubbleLeft;

  if (isMobile) {
    bubbleLeft = 18;
  } else if (canPlaceRight) {
    bubbleLeft = holeRight + 18;
  } else if (canPlaceLeft) {
    bubbleLeft = spotlight.left - bubbleWidth - 18;
  } else {
    bubbleLeft = Math.max(18, viewportW - bubbleWidth - 18);
  }

  let bubbleTop;

  if (isMobile) {
    const below = holeBottom + 14;
    const above = spotlight.top - bubbleHeight - 14;

    bubbleTop =
      below + bubbleHeight <= viewportH
        ? below
        : above >= 18
          ? above
          : 18;
  } else {
    bubbleTop = Math.min(
      Math.max(spotlight.top, 18),
      viewportH - bubbleHeight - 18,
    );
  }

  return (
    <div style={tourStyles.layer}>
      <div
        style={{
          ...tourStyles.dimPart,
          top: 0,
          left: 0,
          width: "100%",
          height: spotlight.top,
        }}
        onClick={onClose}
      />

      <div
        style={{
          ...tourStyles.dimPart,
          top: spotlight.top,
          left: 0,
          width: spotlight.left,
          height: spotlight.height,
        }}
        onClick={onClose}
      />

      <div
        style={{
          ...tourStyles.dimPart,
          top: spotlight.top,
          left: holeRight,
          width: Math.max(0, viewportW - holeRight),
          height: spotlight.height,
        }}
        onClick={onClose}
      />

      <div
        style={{
          ...tourStyles.dimPart,
          top: holeBottom,
          left: 0,
          width: "100%",
          height: Math.max(0, viewportH - holeBottom),
        }}
        onClick={onClose}
      />

      <div
        style={{
          ...tourStyles.spotlight,
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
      />

      <button
        style={{
          ...tourStyles.clickArea,
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
        onClick={onTargetClick}
        aria-label="Klik bagian tutorial"
      />

      <div
        style={{
          ...tourStyles.bubble,
          top: bubbleTop,
          left: bubbleLeft,
          width: isMobile ? "calc(100vw - 36px)" : bubbleWidth,
        }}
      >
        <div style={tourStyles.bubbleTop}>
          <div style={tourStyles.stepBadge}>
            {step + 1}/{steps.length}
          </div>

          <button style={tourStyles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={tourStyles.icon}>{current.icon}</div>

        <div style={tourStyles.title}>{current.title}</div>
        <div style={tourStyles.text}>{current.text}</div>

        <div style={tourStyles.footer}>
          <button style={tourStyles.skipBtn} onClick={onSkip}>
            Lewati
          </button>

          <button style={tourStyles.primaryBtn} onClick={onTargetClick}>
            {current.actionText}
          </button>
        </div>
      </div>
    </div>
  );
}

const tourStyles = {
  layer: {
    position: "fixed",
    inset: 0,
    zIndex: 16000,
    pointerEvents: "none",
  },

  dimPart: {
    position: "absolute",
    background: "rgba(2, 6, 23, 0.72)",
    backdropFilter: "blur(3px)",
    pointerEvents: "auto",
  },

  spotlight: {
    position: "absolute",
    borderRadius: 22,
    border: "2px solid rgba(60,255,201,0.95)",
    background: "transparent",
    pointerEvents: "none",
    transition: "all 220ms ease",
    animation: "tourGlowPulse 1.4s ease-in-out infinite",
  },

  clickArea: {
    position: "absolute",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    pointerEvents: "auto",
  },

  bubble: {
    position: "absolute",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "radial-gradient(700px 360px at 50% 0%, rgba(140,86,255,0.30), rgba(10,12,22,0.98) 62%)",
    color: "#eef2ff",
    padding: 18,
    boxShadow: "0 24px 70px rgba(0,0,0,0.50)",
    pointerEvents: "auto",
    transition: "all 220ms ease",
  },

  bubbleTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  stepBadge: {
    fontSize: 12,
    fontWeight: 900,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(60,255,201,0.24)",
    background: "rgba(60,255,201,0.10)",
    color: "rgba(235,240,255,0.95)",
  },

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(235,240,255,0.92)",
    cursor: "pointer",
    fontWeight: 900,
  },

  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    fontSize: 30,
    marginBottom: 12,
    border: "1px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.09)",
  },

  title: {
    fontSize: 19,
    fontWeight: 950,
    lineHeight: 1.25,
    marginBottom: 8,
  },

  text: {
    fontSize: 13,
    lineHeight: 1.65,
    opacity: 0.8,
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },

  skipBtn: {
    padding: "10px 12px",
    borderRadius: 13,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "rgba(235,240,255,0.72)",
    cursor: "pointer",
    fontWeight: 800,
  },

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 13,
    border: "1px solid rgba(60,255,201,0.34)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.92), rgba(140,86,255,0.90))",
    color: "#07111f",
    cursor: "pointer",
    fontWeight: 950,
    boxShadow: "0 14px 28px rgba(60,255,201,0.13)",
  },
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 60% 30%, #0a2a2a 0%, #070a14 55%, #050611 100%)",
    color: "#d7defa",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },

  main: {
    padding: 18,
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  loadingBox: {
    padding: 18,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#d7defa",
    fontSize: 14,
    fontWeight: 700,
  },

  timelineWrap: {
    position: "relative",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    overflow: "hidden",
    padding: 14,
  },

  timelineLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 2,
    transform: "translateX(-1px)",
    background:
      "linear-gradient(180deg, rgba(60,255,201,0) 0%, rgba(60,255,201,0.6) 25%, rgba(140,86,255,0.7) 65%, rgba(140,86,255,0) 100%)",
    opacity: 0.6,
  },

  timelineContent: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 84px 1fr",
    alignItems: "center",
    minHeight: 180,
  },

  col: {
    display: "flex",
  },

  spacer: {
    width: "100%",
    height: 1,
  },

  centerCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },

  node: {
    width: 40,
    height: 40,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(60,255,201,0.35)",
    background: "rgba(60,255,201,0.10)",
    boxShadow: "0 0 20px rgba(60,255,201,0.15)",
    color: "#d7defa",
    fontWeight: 800,
  },

  nodeConnector: {
    width: 2,
    height: 110,
    background: "rgba(255,255,255,0.10)",
  },

  nodeLocked: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "none",
    opacity: 0.8,
  },

  nodeActive: {
    border: "1px solid rgba(60,255,201,0.45)",
    background: "rgba(60,255,201,0.12)",
  },

  nodeDone: {
    border: "1px solid rgba(60,255,201,0.55)",
    background: "rgba(60,255,201,0.14)",
  },

  card: {
    width: "min(460px, 100%)",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    transition: "transform 120ms ease, border-color 120ms ease",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },

  cardSelected: {
    border: "1px solid rgba(60,255,201,0.30)",
  },

  cardLocked: {
    opacity: 0.65,
  },

  cardTop: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 10,
  },

  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 750,
  },

  cardXp: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(140,86,255,0.14)",
    border: "1px solid rgba(140,86,255,0.22)",
  },

  cardSub: {
    fontSize: 12,
    opacity: 0.85,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  cardDesc: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 1.5,
    marginBottom: 12,
  },

  cardProgressRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  cardProgressOuter: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  cardProgressInner: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.85), rgba(140,86,255,0.85))",
  },

  cardProgressText: {
    fontSize: 12,
    opacity: 0.8,
    width: 48,
    textAlign: "right",
  },

  stepsRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },

  emptyActivityText: {
    fontSize: 12,
    opacity: 0.6,
  },

  step: {
    width: 26,
    height: 26,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    fontWeight: 800,
  },

  stepDone: {
    border: "1px solid rgba(60,255,201,0.30)",
    background: "rgba(60,255,201,0.10)",
  },

  stepTodo: {},

  badge: {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    letterSpacing: 0.6,
  },

  badgeActive: {
    border: "1px solid rgba(60,255,201,0.25)",
    background: "rgba(60,255,201,0.10)",
  },

  badgeLocked: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    opacity: 0.9,
  },

  badgeDone: {
    border: "1px solid rgba(140,86,255,0.30)",
    background: "rgba(140,86,255,0.12)",
  },
};