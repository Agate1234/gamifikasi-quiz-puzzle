import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import HasilQuiz from "./HasilQuiz";
import {
  getNextSoalMahasiswaApi,
  submitJawabanMahasiswaApi,
  enhancedVisionPreviewApi,
  deductionRevealApi,
  bodyLanguageAnalysisApi,
  prisonerEscapeMethodApi,
} from "../../../../components/api/soal";
import { getUserByIdApi } from "../../../../components/api/user";

const ROLE_CONFIGS = {
  assassin: {
    name: "Assassin",
    icon: "🗡️",
    desc: "Cepat, lincah, tajam membaca soal, dan unggul saat mengambil keputusan.",
    skills: [
      {
        key: "heightened_senses",
        name: "Heightened Senses",
        type: "active",
        label: "Aktif",
        desc: "Indra tajam Assassin membantu menyorot keyword penting dan menandai 2 opsi yang salah.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilihan ganda, soal memiliki teks, minimal ada 2 opsi salah, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "shadow_concealment",
        name: "Shadow Concealment",
        type: "active",
        label: "Aktif",
        desc: "Bersembunyi dalam bayangan untuk membaca celah soal, lalu mengunci 1 opsi yang salah.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilihan ganda, minimal ada 1 opsi salah, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "mighty_blow",
        name: "Mighty Blow",
        type: "active",
        label: "Aktif",
        desc: "Menghantam soal dengan serangan penuh. Soal langsung dilewati dan dianggap benar, tetapi waktu quiz berkurang 3 menit.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, waktu masih berjalan, waktu akan berkurang 3 menit, dan tidak bisa dipakai pada soal terakhir.",
      },
    ],
  },

  seer: {
    name: "Seer",
    icon: "🔮",
    desc: "Ahli spiritual yang membaca aura soal, melihat tanda tersembunyi, dan merasakan bahaya jawaban.",
    skills: [
      {
        key: "spirit_vision",
        name: "Spirit Vision",
        type: "active",
        label: "Aktif",
        desc: "Melihat aura soal: keyword penting disorot dan 2 opsi ditandai, yaitu 1 jawaban benar dan 1 pengecoh.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilihan ganda, soal memiliki teks, minimal ada 1 jawaban benar dan 1 pengecoh, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "danger_intuition",
        name: "Fated Revelation",
        type: "active",
        label: "Aktif",
        desc: "Menerima wahyu takdir dan mengunci semua opsi yang salah, sehingga hanya jawaban benar yang tersisa. Maksimal XP quiz menjadi 70%.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, waktu masih berjalan, dan maksimal XP quiz menjadi 70%.",
      },
      {
        key: "spirituality",
        name: "Spiritual Perception",
        type: "passive",
        label: "Pasif",
        desc: "Persepsi spiritual meningkat. Saat menemukan soal sulit, otomatis menambah waktu 10 detik sekali per quiz.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Aktif otomatis 1x per quiz ketika difficulty soal hard/sulit/tinggi.",
      },
    ],
  },

  marauder: {
    name: "Marauder",
    icon: "🔥",
    desc: "Cepat mengambil peluang, membaca nilai tersembunyi, dan mencuri momentum saat quiz.",
    skills: [
      {
        key: "combat_proficiency",
        name: "Combat Proficiency",
        type: "passive",
        label: "Pasif",
        desc: "Terlatih menyerang dengan presisi. Jika menjawab benar pada soal medium atau hard, mendapat bonus XP 1/20 dari total XP quiz.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement: "Aktif otomatis jika jawaban benar pada soal medium/hard.",
      },
      {
        key: "agile_hands",
        name: "Agile Hands",
        type: "active",
        label: "Aktif",
        desc: "Gerakan tangan yang cepat membuat jawaban lebih stabil. Jika jawaban benar saat efek ini aktif, health pulih 10 poin.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, waktu masih berjalan, dan health tidak bisa melebihi 100.",
      },
      {
        key: "superior_observation",
        name: "Loot Instinct",
        type: "active",
        label: "Aktif",
        desc: "Naluri menjarah Marauder membaca nilai tersembunyi. Menandai 2 opsi: 1 jawaban benar dan 1 pengecoh.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilihan ganda, minimal ada 1 jawaban benar dan 1 pengecoh, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "theft",
        name: "Theft",
        type: "active",
        label: "Aktif",
        desc: "Mencuri kesempatan dari soal. Jika jawaban pertama salah, kamu mendapat 1 kesempatan menjawab ulang pada soal yang sama.",
        support: ["pilgan", "true_false"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilgan/true-false, sebelum submit, sudah memilih jawaban, waktu masih berjalan, dan tidak bisa dipakai pada soal terakhir.",
      },
    ],
  },

  spectator: {
    name: "Spectator",
    icon: "👁️",
    desc: "Pengamat tajam yang membaca detail kecil, menganalisis pilihan, dan menarik kesimpulan dari pola soal.",
    skills: [
      {
        key: "enhanced_vision",
        name: "Enhanced Vision",
        type: "active",
        label: "Aktif",
        desc: "Melihat kebenaran dari 1 jawaban yang dipilih. Sistem akan memberi tahu apakah pilihanmu benar atau salah.",
        support: ["pilgan", "true_false"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilgan/true-false, sebelum submit, sudah memilih 1 jawaban, dan waktu masih berjalan.",
      },
      {
        key: "body_language_analysis",
        name: "Body Language Analysis",
        type: "active",
        label: "Aktif",
        desc: "Menganalisis pola pilihan jawaban, lalu menandai 2 opsi: 1 jawaban benar dan 1 pengecoh.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilgan, minimal ada 2 opsi, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "deduction",
        name: "Deduction",
        type: "active",
        label: "Aktif",
        desc: "Menarik kesimpulan kuat dari detail soal. Spectator akan menampilkan jawaban benar, tetapi maksimal XP yang bisa didapat dari quiz ini menjadi 70%.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, waktu masih berjalan, maksimal XP quiz menjadi 70%, dan tidak bisa dipakai pada soal terakhir.",
      },
    ],
  },

  criminal: {
    name: "Criminal",
    icon: "🎭",
    desc: "Tidak menahan diri, bergerak dengan insting tajam, tubuh kuat, dan memanfaatkan celah apa pun untuk menang.",
    skills: [
      {
        key: "criminal_proficiency",
        name: "Criminal Proficiency",
        type: "active",
        label: "Aktif",
        desc: "Menguatkan jawaban yang dipilih dengan naluri kriminal. Jika jawaban benar, mendapat bonus XP 1/10 dari total XP quiz.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, dan waktu masih berjalan.",
      },
      {
        key: "dirty_trick",
        name: "Dirty Trick",
        type: "active",
        label: "Aktif",
        desc: "Melakukan trik kotor untuk mengurangi risiko. Jika jawaban salah, damage hanya setengah. Jika benar, tidak ada bonus tambahan.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, dan waktu masih berjalan.",
      },
      {
        key: "evil_impulse",
        name: "Evil Impulse",
        type: "active",
        label: "Aktif",
        desc: "Mengikuti dorongan jahat untuk mengambil risiko. Jika benar, health pulih 1/5 total health. Jika salah, damage menjadi 2x lipat.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, health minimal 30, dan waktu masih berjalan.",
      },
    ],
  },

  prisoner: {
    name: "Prisoner",
    icon: "⛓️",
    desc: "Terkekang oleh dunia, tetapi mampu membaca celah, menahan tekanan, dan mengubah keterbatasan menjadi kekuatan.",
    skills: [
      {
        key: "escape_method",
        name: "Knowledge: Escape Method",
        type: "active",
        label: "Aktif",
        desc: "Membaca celah pada soal dan menandai 2 opsi yang salah.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilgan, minimal ada 2 opsi salah, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "binding",
        name: "Binding",
        type: "active",
        label: "Aktif",
        desc: "Mengikat tekanan agar pikiran tetap stabil. Jika jawaban benar, Prisoner mendapat tambahan waktu 60 detik. Jika salah, tidak ada efek tambahan.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, dan waktu masih berjalan.",
      },
      {
        key: "caged_endurance",
        name: "Caged Endurance",
        type: "active",
        label: "Aktif",
        desc: "Bertahan saat tubuh mulai melemah. Jika health 50 atau kurang dan jawaban benar, health pulih 35 poin.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, health maksimal 50, sebelum submit, sudah memilih jawaban, dan waktu masih berjalan.",
      },
      {
        key: "suppressed_desire",
        name: "Suppressed Desire",
        type: "active",
        label: "Aktif",
        desc: "Menahan dorongan untuk menjawab terburu-buru. Tombol submit terkunci 15 detik, lalu jika jawaban benar mendapat bonus XP 3/10 dari total XP quiz.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, waktu tersisa minimal 20 detik, dan waktu masih berjalan.",
      },
    ],
  },

  warrior: {
    name: "Warrior",
    icon: "⚔️",
    desc: "Petarung fisik yang kuat, ahli senjata dan armor, tahan tekanan, serta mampu membalas saat serangan pertama gagal.",
    skills: [
      {
        key: "weapon_mastery",
        name: "Weapon Mastery",
        type: "active",
        label: "Aktif",
        desc: "Menggunakan penguasaan senjata untuk menebas 2 jawaban yang salah. Opsi yang terkena tebasan akan dikunci dan tidak bisa dipilih.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilgan, minimal ada 2 opsi salah, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "armor_guard",
        name: "Armor Guard",
        type: "active",
        label: "Aktif",
        desc: "Mengandalkan armor untuk menahan serangan. Jika jawaban salah, damage hanya setengah. Jika benar, tidak ada efek tambahan.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, health minimal 25, dan waktu masih berjalan.",
      },
      {
        key: "battle_instinct",
        name: "Battle Instinct",
        type: "passive",
        label: "Pasif",
        desc: "Naluri bertarung aktif saat kondisi kritis. Jika health 40 atau kurang dan jawaban benar, health pulih 30 poin.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Aktif otomatis jika Warrior menjawab benar saat health maksimal 40.",
      },
      {
        key: "martial_counter",
        name: "Martial Counter",
        type: "active",
        label: "Aktif",
        desc: "Melakukan serangan balik setelah salah membaca gerakan lawan. Jika jawaban salah, kamu boleh memilih ulang dan jawaban salah tadi dikunci.",
        support: ["pilgan", "true_false"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilgan/true-false, sebelum submit, sudah memilih jawaban, waktu masih berjalan, dan tidak bisa dipakai pada soal terakhir.",
      },
    ],
  },

  reader: {
    name: "Reader",
    icon: "📚",
    desc: "Cendekia yang mengandalkan ingatan tajam, pemahaman cepat, kemampuan belajar tinggi, dan ritual pengetahuan untuk menguasai alur quiz.",
    skills: [
      {
        key: "akashic_record",
        name: "Akashic Record",
        type: "active",
        label: "Aktif",
        desc: "Membuka catatan pengetahuan terdalam. Jawaban yang dipilih akan dihitung benar meskipun sebenarnya salah. Jika jawaban asli salah, XP quiz dikurangi 1/5 dari total XP quiz.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, dan waktu masih berjalan.",
      },
      {
        key: "ritualistic_focus",
        name: "Ritualistic Focus",
        type: "active",
        label: "Aktif",
        desc: "Melakukan ritual kecil untuk menstabilkan pikiran. Timer berhenti 10 detik agar bisa membaca soal tanpa tekanan.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, waktu tersisa minimal 15 detik, sebelum submit, dan waktu masih berjalan.",
      },
      {
        key: "learning_adaptation",
        name: "Learning Adaptation",
        type: "passive",
        label: "Pasif",
        desc: "Kemampuan belajar Reader meningkat setelah melakukan kesalahan. Jika jawaban sebelumnya salah, jawaban benar berikutnya memberi bonus XP 1/10 dari total XP quiz.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Aktif otomatis 1x per quiz jika Reader menjawab benar setelah sebelumnya menjawab salah.",
      },
    ],
  },
  hunter: {
    name: "Hunter",
    icon: "🏹",
    desc: "Pemburu tajam yang membaca jejak, menargetkan mangsa, memasang perangkap, menguasai medan, dan mendapat momentum dari buruan sempurna.",
    skills: [
      {
        key: "prey_mark",
        name: "Prey Mark",
        type: "active",
        label: "Aktif",
        desc: "Hunter menandai 2 opsi target. Di antara opsi itu terdapat 1 jawaban benar dan 1 pengecoh. Jika memilih target yang benar, Hunter mendapat bonus XP 2/10 dari total XP quiz. Jika salah, damage menjadi 1.5x.",
        support: ["pilgan"],
        requirement:
          "Bisa dipakai 1x per quiz, hanya untuk pilgan, minimal ada 3 opsi, sebelum submit, pilih salah satu opsi target, dan waktu masih berjalan.",
      },
      {
        key: "trap_setting",
        name: "Trap Setting",
        type: "active",
        label: "Aktif",
        desc: "Hunter memasang perangkap sebelum menjawab. Jika jawaban salah, jawaban salah tadi dikunci dan kamu mendapat 1 kesempatan menjawab ulang pada soal yang sama.",
        support: ["pilgan", "true_false"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, sudah memilih jawaban, waktu masih berjalan, dan tidak bisa dipakai pada soal terakhir.",
      },
      {
        key: "terrain_advantage",
        name: "Terrain Advantage",
        type: "active",
        label: "Aktif",
        desc: "Hunter menguasai medan quiz. Setelah skill dipakai, damage dari 2 jawaban salah berikutnya dikurangi 30%.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Bisa dipakai 1x per quiz, sebelum submit, waktu masih berjalan, dan minimal tersisa 2 soal.",
      },
      {
        key: "perfect_hunt",
        name: "Perfect Hunt",
        type: "passive",
        label: "Pasif",
        desc: "Hunter semakin tajam saat memburu target. Jika menjawab benar 3 kali berturut-turut, mendapat bonus XP 2/10 dari total XP quiz.",
        support: ["pilgan", "true_false", "checkbox"],
        requirement:
          "Aktif otomatis 1x per quiz saat streak benar alami mencapai 3.",
      },
    ],
  },
};

function normalizeQuestionType(soal) {
  if (!soal) return "pilgan";

  const rawType = String(soal.type || soal.tipe_soal || "").toLowerCase();

  if (rawType.includes("checkbox") || rawType.includes("multiple")) {
    return "checkbox";
  }

  if (
    rawType.includes("true") ||
    rawType.includes("false") ||
    rawType.includes("boolean")
  ) {
    return "true_false";
  }

  const answers = soal.jawaban || [];

  const hasTrueFalse =
    answers.length === 2 &&
    answers.every((item) => {
      const text = String(item.jawaban_soal || "").toLowerCase();
      return (
        text === "true" ||
        text === "false" ||
        text === "benar" ||
        text === "salah"
      );
    });

  if (hasTrueFalse) return "true_false";

  return "pilgan";
}

function normalizeGameRole(role) {
  return String(role || "").trim().toLowerCase();
}

function getRoleFromStorage() {
  return normalizeGameRole(localStorage.getItem("game_role"));
}

function getDisplayName() {
  return localStorage.getItem("nama_user") || "Player";
}

function getInitial(name) {
  return String(name || "P")
    .charAt(0)
    .toUpperCase();
}

function getQuestionText(soal) {
  return soal?.question || soal?.pertanyaan || "";
}

function getDifficulty(soal) {
  return String(soal?.difficulty || soal?.difficulty_soal || "-");
}

function getQuestionWordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildHintText(soal, skillName) {
  const question = getQuestionText(soal);
  const questionType = normalizeQuestionType(soal);
  const difficulty = getDifficulty(soal);
  const wordCount = getQuestionWordCount(question);

  if (skillName === "Quick Summary") {
    const words = question.split(/\s+/).filter(Boolean);
    const summary = words.slice(0, Math.min(14, words.length)).join(" ");

    return summary
      ? `Ringkasan: ${summary}${words.length > 14 ? "..." : ""}`
      : "Ringkasan belum tersedia untuk soal ini.";
  }

  if (skillName === "Heightened Senses") {
    if (questionType === "checkbox") {
      return "Heightened Senses: keyword penting sudah disorot. Dua opsi yang salah ikut ditandai sebagai opsi berisiko.";
    }

    if (questionType === "true_false") {
      return "Heightened Senses: keyword penting sudah disorot. Dua opsi yang salah ikut ditandai sebagai opsi berisiko.";
    }

    return "Heightened Senses: keyword penting sudah disorot. Dua opsi yang salah ikut ditandai sebagai opsi berisiko.";
  }

  if (skillName === "Spirit Vision") {
    if (questionType === "checkbox") {
      return "Spirit Vision: keyword penting sudah disorot. Dua opsi aura ditandai: 1 benar dan 1 pengecoh.";
    }

    if (questionType === "true_false") {
      return "Spirit Vision: keyword penting sudah disorot. Dua opsi aura ditandai: 1 benar dan 1 pengecoh.";
    }

    return "Spirit Vision: keyword penting sudah disorot. Dua opsi aura ditandai: 1 benar dan 1 pengecoh.";
  }

  if (questionType === "checkbox") {
    return "Hint: soal checkbox bisa punya lebih dari satu jawaban benar. Periksa semua opsi, jangan hanya memilih satu.";
  }

  if (questionType === "true_false") {
    return "Hint: cek apakah pernyataan pada soal bersifat absolut. Kata seperti selalu, tidak pernah, semua, atau hanya sering jadi kunci.";
  }

  if (String(difficulty).toLowerCase().includes("hard")) {
    return "Hint: soal ini bertipe sulit. Baca ulang kata kunci utama dan bandingkan opsi yang paling spesifik.";
  }

  if (wordCount >= 12) {
    return "Hint: soal cukup panjang. Fokus pada kata kerja, objek utama, dan kondisi yang diminta soal.";
  }

  return "Hint: cari kata kunci utama pada soal, lalu cocokkan dengan opsi yang paling sesuai.";
}

function getImportantWords(text) {
  const stopWords = new Set([
    "yang",
    "dan",
    "atau",
    "dari",
    "untuk",
    "pada",
    "adalah",
    "dalam",
    "dengan",
    "sebuah",
    "suatu",
    "akan",
    "jika",
    "maka",
    "ke",
    "di",
    "ini",
    "itu",
    "apa",
    "bagaimana",
    "mengapa",
    "the",
    "and",
    "for",
    "with",
    "from",
    "what",
    "which",
    "when",
    "where",
    "is",
    "are",
    "to",
    "of",
  ]);

  return String(text || "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => {
      const clean = word.toLowerCase().trim();
      return clean.length >= 5 && !stopWords.has(clean);
    })
    .slice(0, 8);
}

function HighlightedQuestion({ text, enabled }) {
  if (!enabled) return <>{text}</>;

  const importantWords = getImportantWords(text);

  if (importantWords.length < 1) return <>{text}</>;

  const pattern = new RegExp(`(${importantWords.join("|")})`, "gi");
  const parts = String(text || "").split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isImportant = importantWords.some(
          (word) => word.toLowerCase() === part.toLowerCase(),
        );

        if (!isImportant) {
          return (
            <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
          );
        }

        return (
          <mark key={`${part}-${index}`} style={S.keywordMark}>
            {part}
          </mark>
        );
      })}
    </>
  );
}

export default function QuizFullscreen({
  open,
  quizId,
  quizTitle,
  quizXp = 0,
  onClose,
  onFinish,
  tutorActive = false,
  onTutorQuizFinished,
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
    total_soal: 20,
    total_dijawab: 0,
    total_benar: 0,
  });
  const [health, setHealth] = useState(INITIAL_HEALTH);
  const [healthBonus, setHealthBonus] = useState(0);
  const [criminalExpBonus, setCriminalExpBonus] = useState(0);

  const [usedSkillKeys, setUsedSkillKeys] = useState({});
  const [skillMessage, setSkillMessage] = useState("");
  const [hintText, setHintText] = useState("");
  const [highlightQuestion, setHighlightQuestion] = useState(false);
  const [lockedOptionIds, setLockedOptionIds] = useState([]);
  const [targetOptionIds, setTargetOptionIds] = useState([]);
  const [activeBackendEffects, setActiveBackendEffects] = useState([]);
  const [terrainAdvantageCharges, setTerrainAdvantageCharges] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [submitDelayLeft, setSubmitDelayLeft] = useState(0);
  const [openSkillKey, setOpenSkillKey] = useState(null);

  const playerName = getDisplayName();
  const playerInitial = getInitial(playerName);

  const [gameRoleKey, setGameRoleKey] = useState(getRoleFromStorage());
  const [roleLoading, setRoleLoading] = useState(false);

  const roleData = ROLE_CONFIGS[gameRoleKey] || null;
  const currentQuestionType = normalizeQuestionType(currentSoal);
  const isMultipleChoice = currentQuestionType === "checkbox";

  const timeText = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const secondsElapsed = QUIZ_TOTAL_SECONDS - secondsLeft;
  const isTimeUp = secondsLeft <= 0;

  const isLastQuestion =
    Number(progressInfo?.nomor_soal || 1) >=
    Number(progressInfo?.total_soal || 1);

  const progress = useMemo(() => {
    if (!progressInfo.total_soal) return 0;

    return Math.min(
      1,
      Number(progressInfo.nomor_soal || 1) /
        Number(progressInfo.total_soal || 1),
    );
  }, [progressInfo]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const syncGameRole = async () => {
      const roleFromStorage = getRoleFromStorage();

      if (roleFromStorage) {
        setGameRoleKey(roleFromStorage);
        return;
      }

      const idUser = localStorage.getItem("id_user");

      if (!idUser) {
        setGameRoleKey("");
        return;
      }

      try {
        setRoleLoading(true);

        const response = await getUserByIdApi(idUser);

        if (cancelled) return;

        if (response?.status === 200 && response?.data?.success) {
          const user = response.data.data;
          const roleFromDb = normalizeGameRole(user?.game_role);

          if (roleFromDb) {
            localStorage.setItem("game_role", roleFromDb);
            setGameRoleKey(roleFromDb);
            return;
          }
        }

        setGameRoleKey("");
      } catch (error) {
        if (!cancelled) {
          setGameRoleKey(getRoleFromStorage());
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    };

    const handleRoleSelected = (event) => {
      const roleFromEvent = normalizeGameRole(event?.detail?.game_role);
      const role = roleFromEvent || getRoleFromStorage();

      if (role) {
        localStorage.setItem("game_role", role);
        setGameRoleKey(role);
      }
    };

    syncGameRole();

    window.addEventListener("game-role-selected", handleRoleSelected);
    window.addEventListener("storage", syncGameRole);
    window.addEventListener("focus", syncGameRole);

    return () => {
      cancelled = true;
      window.removeEventListener("game-role-selected", handleRoleSelected);
      window.removeEventListener("storage", syncGameRole);
      window.removeEventListener("focus", syncGameRole);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setCurrentSoal(null);
    setSelected([]);
    setShowResult(false);
    setResult(null);
    setSecondsLeft(QUIZ_TOTAL_SECONDS);
    setHealth(INITIAL_HEALTH);
    setHealthBonus(0);
    setCriminalExpBonus(0);
    setErrorMessage("");
    setSkillMessage("");
    setHintText("");
    setHighlightQuestion(false);
    setLockedOptionIds([]);
    setTargetOptionIds([]);
    setUsedSkillKeys({});
    setActiveBackendEffects([]);
    setTerrainAdvantageCharges(0);
    setTimerPaused(false);
    setSubmitDelayLeft(0);
    setOpenSkillKey(null);
    setProgressInfo({
      nomor_soal: 1,
      total_soal: 20,
      total_dijawab: 0,
      total_benar: 0,
    });

    if (quizId) {
      fetchNextSoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quizId]);

  useEffect(() => {
    if (!currentSoal) return;

    setSelected([]);
    setSkillMessage("");
    setHintText("");
    setHighlightQuestion(false);
    setLockedOptionIds([]);
    setTargetOptionIds([]);
    setActiveBackendEffects([]);
    setSubmitDelayLeft(0);
    setOpenSkillKey(null);
  }, [currentSoal]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (tutorActive || !showResult) return;
        onClose?.();
      }
    };

    const onPopState = () => {
      if (!showResult) {
        window.history.pushState(null, "", window.location.href);
        setErrorMessage("Selesaikan quiz terlebih dahulu sebelum kembali.");
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open, onClose, tutorActive, showResult]);

  useEffect(() => {
    if (!open || showResult || timerPaused) return;

    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) return 0;
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, showResult, timerPaused]);

  useEffect(() => {
    if (!open || showResult) return;
    if (submitDelayLeft <= 0) return;

    const delayTimer = setInterval(() => {
      setSubmitDelayLeft((value) => {
        if (value <= 1) return 0;
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(delayTimer);
  }, [open, showResult, submitDelayLeft]);

  useEffect(() => {
    if (!open) return;
    if (!currentSoal) return;
    if (showResult) return;
    if (gameRoleKey !== "seer") return;
    if (usedSkillKeys.spirituality) return;

    const difficulty = String(getDifficulty(currentSoal)).toLowerCase();

    const isHardQuestion =
      difficulty.includes("hard") ||
      difficulty.includes("sulit") ||
      difficulty.includes("tinggi");

    if (!isHardQuestion) return;

    setSecondsLeft((prev) => prev + 10);

    setUsedSkillKeys((prev) => ({
      ...prev,
      spirituality: true,
    }));

    setSkillMessage(
      "Spiritual Perception aktif otomatis. Seer merasakan soal sulit dan mendapat tambahan waktu 10 detik.",
    );
  }, [open, currentSoal, showResult, gameRoleKey, usedSkillKeys.spirituality]);

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
          expEarned:
            Number(payload.exp_earned || 0) +
            Number(criminalExpBonus || 0) +
            Number(payload.exp_bonus || 0),
          totalSoal: payload.progress?.total_soal || payload.total_soal || 20,
          totalBenar: payload.progress?.total_benar || payload.total_benar || 0,
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
          total_soal: 20,
          total_dijawab: 0,
          total_benar: 0,
        },
      );

      const baseHealth =
  typeof payload.health_remaining === "number"
    ? Number(payload.health_remaining)
    : INITIAL_HEALTH;

setHealth(Math.min(INITIAL_HEALTH, baseHealth));
    } catch (error) {
      console.error("Gagal mengambil soal:", error);
      setErrorMessage("Terjadi kesalahan saat mengambil soal.");
    } finally {
      setLoading(false);
    }
  };

  const pickOption = (idJawaban) => {
    if (!currentSoal || isTimeUp || lockedOptionIds.includes(idJawaban)) return;

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

  const getSkillRequirementStatus = (skill) => {
    if (roleLoading) {
      return {
        ok: false,
        reason: "Role sedang dimuat.",
      };
    }

    if (!roleData) {
      return {
        ok: false,
        reason: "Role game belum dipilih.",
      };
    }

    if (!currentSoal) {
      return {
        ok: false,
        reason: "Soal belum tersedia.",
      };
    }

    if (skill.type !== "active") {
      return {
        ok: false,
        reason: "Skill pasif aktif otomatis.",
      };
    }

    if (usedSkillKeys[skill.key]) {
      return {
        ok: false,
        reason: "Skill ini sudah dipakai di quiz ini.",
      };
    }

    if (loading || submitting) {
      return {
        ok: false,
        reason: "Tunggu proses selesai.",
      };
    }

    if (isTimeUp) {
      return {
        ok: false,
        reason: "Waktu sudah habis.",
      };
    }

    if (!skill.support.includes(currentQuestionType)) {
      return {
        ok: false,
        reason: "Skill ini tidak mendukung tipe soal sekarang.",
      };
    }

    const answers = currentSoal.jawaban || [];
    const questionText = getQuestionText(currentSoal);
    const answeredCount = Number(progressInfo.total_dijawab || 0);
    const totalSoal = Number(progressInfo.total_soal || 0);

    if (
      [
        "silent_focus",
        "fake_choice",
        "brutal_eliminate",
        "truth_vision",
        "target_lock",
        "spirit_vision",
        "danger_intuition",
        "heightened_senses",
        "shadow_concealment",
        "superior_observation",
        "body_language_analysis",
        "deduction",
        "weapon_mastery",
        "prey_mark",
      ].includes(skill.key) &&
      answers.length < 2
    ) {
      return {
        ok: false,
        reason: "Opsi jawaban belum cukup untuk memakai skill ini.",
      };
    }

    if (skill.key === "brutal_eliminate" && answers.length < 4) {
      return {
        ok: false,
        reason: "Brutal Eliminate butuh minimal 4 opsi jawaban.",
      };
    }

    if (
      skill.key === "quick_summary" &&
      getQuestionWordCount(questionText) < 8
    ) {
      return {
        ok: false,
        reason: "Soal terlalu pendek untuk diringkas.",
      };
    }

    if (
      [
        "deep_reading",
        "eagle_eye",
        "spirit_vision",
        "heightened_senses",
      ].includes(skill.key) &&
      !questionText
    ) {
      return {
        ok: false,
        reason: "Soal tidak memiliki teks yang bisa disorot.",
      };
    }

    if (["slow_thinking", "ritualistic_focus"].includes(skill.key) && secondsLeft < 15) {
      return {
        ok: false,
        reason: "Waktu tersisa minimal 15 detik untuk memakai skill ini.",
      };
    }

    if (skill.key === "akashic_record" && selected.length < 1) {
      return {
        ok: false,
        reason: "Pilih jawaban dulu sebelum memakai Akashic Record.",
      };
    }

    if (skill.key === "risk_raid" && health < 40) {
      return {
        ok: false,
        reason: "Health minimal 40 untuk memakai Risk Raid.",
      };
    }

    if (skill.key === "quick_escape" && health < 30) {
      return {
        ok: false,
        reason: "Health minimal 30 untuk memakai Quick Escape.",
      };
    }

    if (skill.key === "armor_guard" && health < 25) {
      return {
        ok: false,
        reason: "Health minimal 25 untuk memakai Armor Guard.",
      };
    }

    if (skill.key === "escape_penalty" && health < 20) {
      return {
        ok: false,
        reason: "Health minimal 20 untuk memakai Escape Penalty.",
      };
    }

    if (skill.key === "break_free" && health > 70) {
      return {
        ok: false,
        reason: "Break Free hanya bisa dipakai saat health maksimal 70.",
      };
    }

    if (skill.key === "last_chance") {
      const half = Math.max(1, Math.floor(totalSoal / 2));

      if (health > 50) {
        return {
          ok: false,
          reason: "Last Chance hanya bisa dipakai saat health maksimal 50.",
        };
      }

      if (answeredCount < half) {
        return {
          ok: false,
          reason: "Last Chance hanya bisa dipakai setelah setengah quiz.",
        };
      }
    }

    if (["heightened_senses", "shadow_concealment", "spirit_vision"].includes(skill.key)) {
      if (currentQuestionType !== "pilgan") {
        return {
          ok: false,
          reason: `${skill.name} hanya bisa dipakai pada soal pilihan ganda.`,
        };
      }
    }

    if (skill.key === "agile_hands" && selected.length < 1) {
      return {
        ok: false,
        reason: "Pilih jawaban dulu sebelum memakai Agile Hands.",
      };
    }

    if (skill.key === "theft") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (selected.length < 1) {
        return {
          ok: false,
          reason: "Pilih jawaban dulu sebelum memakai Theft.",
        };
      }

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        return {
          ok: false,
          reason: "Theft tidak bisa dipakai pada soal terakhir.",
        };
      }
    }

    if (skill.key === "enhanced_vision") {
      if (!["pilgan", "true_false"].includes(currentQuestionType)) {
        return {
          ok: false,
          reason:
            "Enhanced Vision hanya bisa dipakai pada pilgan atau true/false.",
        };
      }

      if (selected.length !== 1) {
        return {
          ok: false,
          reason: "Pilih 1 jawaban dulu sebelum memakai Enhanced Vision.",
        };
      }
    }

    if (skill.key === "deduction") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        return {
          ok: false,
          reason: "Deduction tidak bisa dipakai pada soal terakhir.",
        };
      }
    }

    if (["armor_guard", "martial_counter"].includes(skill.key) && selected.length < 1) {
      return {
        ok: false,
        reason: `Pilih jawaban dulu sebelum memakai ${skill.name}.`,
      };
    }

    if (skill.key === "martial_counter") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        return {
          ok: false,
          reason: "Martial Counter tidak bisa dipakai pada soal terakhir.",
        };
      }
    }

    if (skill.key === "mighty_blow") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        return {
          ok: false,
          reason: "Mighty Blow tidak bisa dipakai pada soal terakhir.",
        };
      }
    }

    if (["criminal_proficiency", "dirty_trick", "evil_impulse"].includes(skill.key)) {
      const criminalActiveAlready = activeBackendEffects.some((key) =>
        ["criminal_proficiency", "dirty_trick", "evil_impulse"].includes(key),
      );

      if (criminalActiveAlready) {
        return {
          ok: false,
          reason: "Hanya bisa memakai 1 skill aktif Criminal pada 1 soal.",
        };
      }

      if (selected.length < 1) {
        return {
          ok: false,
          reason: `Pilih jawaban dulu sebelum memakai ${skill.name}.`,
        };
      }
    }

    if (skill.key === "evil_impulse" && health < 30) {
      return {
        ok: false,
        reason: "Health minimal 30 untuk memakai Evil Impulse.",
      };
    }

    if (skill.key === "escape_method") {
      if (currentQuestionType !== "pilgan") {
        return {
          ok: false,
          reason: "Escape Method hanya bisa dipakai pada soal pilihan ganda.",
        };
      }

      if (answers.length < 3) {
        return {
          ok: false,
          reason: "Escape Method membutuhkan minimal 3 opsi jawaban.",
        };
      }
    }

    if (skill.key === "weapon_mastery") {
      if (currentQuestionType !== "pilgan") {
        return {
          ok: false,
          reason: "Weapon Mastery hanya bisa dipakai pada soal pilihan ganda.",
        };
      }

      if (answers.length < 3) {
        return {
          ok: false,
          reason: "Weapon Mastery membutuhkan minimal 3 opsi jawaban.",
        };
      }
    }

    if (["binding", "caged_endurance", "suppressed_desire"].includes(skill.key)) {
      if (selected.length < 1) {
        return {
          ok: false,
          reason: `Pilih jawaban dulu sebelum memakai ${skill.name}.`,
        };
      }
    }

    if (skill.key === "caged_endurance" && health > 50) {
      return {
        ok: false,
        reason: "Caged Endurance hanya bisa dipakai saat health maksimal 50.",
      };
    }

    if (skill.key === "suppressed_desire" && secondsLeft < 20) {
      return {
        ok: false,
        reason: "Waktu tersisa minimal 20 detik untuk memakai Suppressed Desire.",
      };
    }

    if (["armor_guard", "martial_counter"].includes(skill.key)) {
      const warriorActiveAlready = activeBackendEffects.some((key) =>
        ["armor_guard", "martial_counter"].includes(key),
      );

      if (warriorActiveAlready) {
        return {
          ok: false,
          reason: "Hanya bisa memakai 1 skill aktif Warrior yang berefek saat submit pada 1 soal.",
        };
      }
    }

    if (skill.key === "prey_mark") {
      if (currentQuestionType !== "pilgan") {
        return {
          ok: false,
          reason: "Prey Mark hanya bisa dipakai pada soal pilihan ganda.",
        };
      }

      if (answers.length < 3) {
        return {
          ok: false,
          reason: "Prey Mark membutuhkan minimal 3 opsi jawaban.",
        };
      }

      if (activeBackendEffects.includes("trap_setting")) {
        return {
          ok: false,
          reason: "Prey Mark tidak bisa digabung dengan Trap Setting pada soal yang sama.",
        };
      }
    }

    if (skill.key === "trap_setting") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (selected.length < 1) {
        return {
          ok: false,
          reason: "Pilih jawaban dulu sebelum memakai Trap Setting.",
        };
      }

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        return {
          ok: false,
          reason: "Trap Setting tidak bisa dipakai pada soal terakhir.",
        };
      }

      if (activeBackendEffects.includes("prey_mark")) {
        return {
          ok: false,
          reason: "Trap Setting tidak bisa digabung dengan Prey Mark pada soal yang sama.",
        };
      }
    }

    if (skill.key === "terrain_advantage") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);
      const remainingAfterCurrent = Math.max(0, totalQuestion - currentNumber);

      if (totalQuestion > 0 && remainingAfterCurrent < 2) {
        return {
          ok: false,
          reason: "Terrain Advantage membutuhkan minimal tersisa 2 soal setelah soal ini.",
        };
      }
    }

    return {
      ok: true,
      reason: "Skill siap dipakai.",
    };
  };

  const markSkillUsed = (skill) => {
    setUsedSkillKeys((prev) => ({
      ...prev,
      [skill.key]: true,
    }));
  };

  const lockUnselectedOptions = (count = 1) => {
    const answers = currentSoal?.jawaban || [];

    const candidates = answers.filter(
      (item) =>
        !selected.includes(item.id_jawaban) &&
        !lockedOptionIds.includes(item.id_jawaban),
    );

    const picked = candidates.slice(0, count).map((item) => item.id_jawaban);

    setLockedOptionIds((prev) => [...new Set([...prev, ...picked])]);

    return picked.length;
  };

  const markTargetOptions = (count = 2) => {
    const answers = currentSoal?.jawaban || [];

    const candidates = answers.filter(
      (item) => !lockedOptionIds.includes(item.id_jawaban),
    );

    const picked = candidates.slice(0, count).map((item) => item.id_jawaban);

    setTargetOptionIds((prev) => [...new Set([...prev, ...picked])]);

    return picked.length;
  };

  const addBackendEffect = (skillKey) => {
    setActiveBackendEffects((prev) => {
      if (prev.includes(skillKey)) return prev;
      return [...prev, skillKey];
    });
  };

  const removeBackendEffect = (skillKey) => {
    setActiveBackendEffects((prev) => prev.filter((key) => key !== skillKey));
  };

  const useSkill = async (skill) => {
    const status = getSkillRequirementStatus(skill);

    if (!status.ok) {
      setSkillMessage(status.reason);
      return;
    }

    if (
      [
        "oracle_hint",
        "future_sight",
        "observe",
        "steal_hint",
        "context_clue",
        "quick_summary",
      ].includes(skill.key)
    ) {
      const hint = buildHintText(currentSoal, skill.name);

      setHintText(hint);
      setSkillMessage(`${skill.name} aktif. Petunjuk ditampilkan.`);
      markSkillUsed(skill);
      return;
    }

    if (["deep_reading", "eagle_eye"].includes(skill.key)) {
      const hint = buildHintText(currentSoal, skill.name);

      setHighlightQuestion(true);
      setHintText(hint);
      setSkillMessage(
        `${skill.name} aktif. Keyword penting pada soal disorot.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "heightened_senses") {
      try {
        setSkillMessage(`${skill.name} sedang menajamkan indra...`);

        const response = await prisonerEscapeMethodApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Heightened Senses gagal menemukan jawaban salah.",
          );
          return;
        }

        const wrongOptionIds = response.data.data?.wrong_option_ids || [];
        const hint = buildHintText(currentSoal, skill.name);

        setHighlightQuestion(true);
        setHintText(hint);
        setTargetOptionIds((prev) => [
          ...new Set([...prev, ...wrongOptionIds]),
        ]);

        setSkillMessage(
          wrongOptionIds.length > 0
            ? `${skill.name} aktif. Keyword disorot dan ${wrongOptionIds.length} opsi salah ditandai.`
            : "Tidak ada opsi salah yang bisa ditandai.",
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Heightened Senses error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Heightened Senses.");
      }

      return;
    }

    if (skill.key === "spirit_vision") {
      try {
        setSkillMessage(`${skill.name} sedang membaca aura jawaban...`);

        const response = await bodyLanguageAnalysisApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Spirit Vision gagal membaca aura jawaban.",
          );
          return;
        }

        const targetIds = response.data.data?.target_option_ids || [];
        const hint = buildHintText(currentSoal, skill.name);

        setHighlightQuestion(true);
        setHintText(hint);
        setTargetOptionIds(targetIds);

        setSkillMessage(
          targetIds.length > 0
            ? `${skill.name} aktif. Keyword disorot dan ${targetIds.length} opsi aura ditandai: 1 benar dan 1 pengecoh.`
            : "Tidak ada opsi aura yang bisa ditandai.",
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Spirit Vision error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Spirit Vision.");
      }

      return;
    }

    if (skill.key === "prey_mark") {
      try {
        setSkillMessage(`${skill.name} sedang melacak target buruan...`);

        const response = await bodyLanguageAnalysisApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Prey Mark gagal membaca jejak target.",
          );
          return;
        }

        const targetIds = response.data.data?.target_option_ids || [];
        const analysisOptions = response.data.data?.analysis_options || [];

        setTargetOptionIds(targetIds);
        addBackendEffect(skill.key);

        setHintText(
          analysisOptions.length > 0
            ? "Prey Mark: 2 opsi target ditandai. Di antara opsi itu terdapat 1 jawaban benar dan 1 pengecoh."
            : "Prey Mark: jejak target tidak ditemukan.",
        );

        setSkillMessage(
          targetIds.length > 0
            ? `${skill.name} aktif. Hunter menandai ${targetIds.length} opsi target. Pilih salah satu target sebelum submit.`
            : "Tidak ada opsi target yang bisa ditandai.",
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Prey Mark error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Prey Mark.");
      }

      return;
    }

    if (["truth_vision", "target_lock"].includes(skill.key)) {
      const totalMarked = markTargetOptions(2);

      setSkillMessage(
        totalMarked > 0
          ? `${skill.name} aktif. ${totalMarked} opsi ditandai untuk diperhatikan.`
          : "Tidak ada opsi yang bisa ditandai.",
      );

      markSkillUsed(skill);
      return;
    }

    if (skill.key === "shadow_concealment") {
      try {
        setSkillMessage(`${skill.name} sedang mencari opsi salah...`);

        const response = await prisonerEscapeMethodApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Shadow Concealment gagal menemukan jawaban salah.",
          );
          return;
        }

        const wrongOptionIds = response.data.data?.wrong_option_ids || [];
        const lockedWrongIds = wrongOptionIds.slice(0, 1);

        setLockedOptionIds((prev) => [
          ...new Set([...prev, ...lockedWrongIds]),
        ]);
        setSelected((prev) =>
          prev.filter((id) => !lockedWrongIds.includes(id)),
        );

        setSkillMessage(
          lockedWrongIds.length > 0
            ? `${skill.name} aktif. Assassin mengunci 1 opsi yang salah.`
            : "Tidak ada opsi salah yang bisa dikunci.",
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Shadow Concealment error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Shadow Concealment.");
      }

      return;
    }

    if (["silent_focus", "fake_choice"].includes(skill.key)) {
      const totalLocked = lockUnselectedOptions(1);

      setSkillMessage(
        totalLocked > 0
          ? `${skill.name} aktif. Seer merasakan bahaya dan 1 opsi berisiko dikunci.`
          : "Tidak ada opsi yang bisa dikunci.",
      );

      markSkillUsed(skill);
      return;
    }

    if (skill.key === "danger_intuition") {
      try {
        setSkillMessage(`${skill.name} sedang membuka wahyu takdir...`);

        const response = await deductionRevealApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Fated Revelation gagal membaca jawaban benar.",
          );
          return;
        }

        const correctAnswers = response.data.data?.jawaban_benar || [];
        const correctIds = correctAnswers.map((item) => item.id_jawaban);
        const answers = currentSoal?.jawaban || [];
        const wrongIds = answers
          .map((item) => item.id_jawaban)
          .filter((id) => !correctIds.includes(id));

        setLockedOptionIds((prev) => [...new Set([...prev, ...wrongIds])]);
        setSelected((prev) => prev.filter((id) => correctIds.includes(id)));
        addBackendEffect(skill.key);

        setHintText(
          correctAnswers.length > 0
            ? `Fated Revelation: semua opsi salah dikunci. Jawaban benar tersisa: ${correctAnswers
                .map((item) => `"${item.jawaban_soal}"`)
                .join(", ")}.`
            : "Fated Revelation: jawaban benar tidak ditemukan.",
        );

        setSkillMessage(
          `${skill.name} aktif. Semua opsi salah dikunci, tetapi maksimal XP quiz ini menjadi 70%.`,
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Fated Revelation error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Fated Revelation.");
      }

      return;
    }

    if (skill.key === "brutal_eliminate") {
      const totalLocked = lockUnselectedOptions(2);

      setSkillMessage(
        totalLocked > 0
          ? `${skill.name} aktif. ${totalLocked} opsi dikunci.`
          : "Tidak ada opsi yang bisa dikunci.",
      );

      markSkillUsed(skill);
      return;
    }

    if (skill.key === "superior_observation") {
      try {
        setSkillMessage(`${skill.name} sedang membaca nilai tersembunyi...`);

        const response = await bodyLanguageAnalysisApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Loot Instinct gagal membaca opsi bernilai.",
          );
          return;
        }

        const targetIds = response.data.data?.target_option_ids || [];

        setTargetOptionIds(targetIds);
        setHintText(
          targetIds.length > 0
            ? "Loot Instinct: 2 opsi ditandai. Di antara opsi itu terdapat 1 jawaban benar dan 1 pengecoh."
            : "Loot Instinct: opsi bernilai tidak ditemukan.",
        );

        setSkillMessage(
          targetIds.length > 0
            ? `${skill.name} aktif. Marauder menandai ${targetIds.length} opsi: 1 benar dan 1 pengecoh.`
            : "Tidak ada opsi yang bisa ditandai.",
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Loot Instinct error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Loot Instinct.");
      }

      return;
    }

    if (skill.key === "agile_hands") {
      addBackendEffect(skill.key);

      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini benar, health akan pulih 10 poin.`,
      );

      markSkillUsed(skill);
      return;
    }

    if (skill.key === "theft") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        setSkillMessage("Theft tidak bisa dipakai pada soal terakhir.");
        return;
      }

      addBackendEffect(skill.key);

      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini salah, kamu akan mendapat 1 kesempatan menjawab ulang pada soal yang sama.`,
      );

      markSkillUsed(skill);
      return;
    }

    if (skill.key === "enhanced_vision") {
      try {
        setSkillMessage(`${skill.name} sedang membaca jawaban yang dipilih...`);

        const response = await enhancedVisionPreviewApi(quizId, {
          id_soal: currentSoal.id,
          jawaban_ids: selected,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message || "Enhanced Vision gagal membaca jawaban.",
          );
          return;
        }

        const isCorrect = response.data.data?.is_right === true;

        setHintText(
          isCorrect
            ? "Enhanced Vision: jawaban yang kamu pilih terlihat BENAR."
            : "Enhanced Vision: jawaban yang kamu pilih terlihat SALAH.",
        );

        setSkillMessage(
          isCorrect
            ? `${skill.name} aktif. Spectator memastikan pilihanmu benar.`
            : `${skill.name} aktif. Spectator melihat pilihanmu salah, kamu masih bisa menggantinya.`,
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Enhanced Vision error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Enhanced Vision.");
      }

      return;
    }

    if (skill.key === "body_language_analysis") {
  try {
    setSkillMessage(`${skill.name} sedang menganalisis pola jawaban...`);

    const response = await bodyLanguageAnalysisApi(quizId, {
      id_soal: currentSoal.id,
    });

    if (response?.status !== 200 || !response?.data?.success) {
      setSkillMessage(
        response?.data?.message ||
          "Body Language Analysis gagal membaca pola jawaban.",
      );
      return;
    }

    const targetIds = response.data.data?.target_option_ids || [];
    const analysisOptions = response.data.data?.analysis_options || [];

    setTargetOptionIds(targetIds);

    setHintText(
      analysisOptions.length > 0
        ? "Body Language Analysis: 2 opsi ditandai. Di antara opsi itu terdapat 1 jawaban benar dan 1 pengecoh."
        : "Body Language Analysis: pola jawaban tidak ditemukan.",
    );

    setSkillMessage(
      targetIds.length > 0
        ? `${skill.name} aktif. Spectator menandai ${targetIds.length} opsi: 1 benar dan 1 pengecoh.`
        : "Tidak ada opsi yang bisa ditandai.",
    );

    markSkillUsed(skill);
  } catch (error) {
    console.error("Body Language Analysis error:", error);
    setSkillMessage("Terjadi kesalahan saat memakai Body Language Analysis.");
  }

  return;
}

    if (skill.key === "deduction") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        setSkillMessage("Deduction tidak bisa dipakai pada soal terakhir.");
        return;
      }

      try {
        setSkillMessage(`${skill.name} sedang menarik kesimpulan...`);

        const response = await deductionRevealApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message || "Deduction gagal membaca jawaban benar.",
          );
          return;
        }

        const correctAnswers = response.data.data?.jawaban_benar || [];
        const correctIds = correctAnswers.map((item) => item.id_jawaban);

        setSelected(correctIds);
        addBackendEffect(skill.key);

        setHintText(
          correctAnswers.length > 0
            ? `Deduction: jawaban benar adalah ${correctAnswers
                .map((item) => `"${item.jawaban_soal}"`)
                .join(", ")}.`
            : "Deduction: jawaban benar tidak ditemukan.",
        );

        setSkillMessage(
          `${skill.name} aktif. Spectator berhasil menyimpulkan jawaban benar. Maksimal XP quiz ini menjadi 70%.`,
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Deduction error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Deduction.");
      }

      return;
    }

    if (skill.key === "mighty_blow") {
      const currentNumber = Number(progressInfo.nomor_soal || 1);
      const totalQuestion = Number(progressInfo.total_soal || 0);

      if (totalQuestion > 0 && currentNumber >= totalQuestion) {
        setSkillMessage("Mighty Blow tidak bisa dipakai pada soal terakhir.");
        return;
      }

      addBackendEffect(skill.key);

      setSkillMessage(
        `${skill.name} aktif. Soal ini langsung dilewati, dihitung benar, dan waktu berkurang 3 menit.`,
      );

      markSkillUsed(skill);
      setSecondsLeft((prev) => Math.max(0, Number(prev || 0) - 180));

      setTimeout(() => {
        handleSubmitJawaban(true, ["mighty_blow"], 180);
      }, 350);

      return;
    }

    if (skill.key === "akashic_record") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jawaban yang kamu pilih akan dihitung benar saat submit. Jika jawaban asli salah, XP quiz dikurangi 1/5 total XP quiz.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (["slow_thinking", "ritualistic_focus"].includes(skill.key)) {
      setTimerPaused(true);
      setSkillMessage(`${skill.name} aktif. Timer berhenti 10 detik.`);
      markSkillUsed(skill);

      setTimeout(() => {
        setTimerPaused(false);
      }, 10000);

      return;
    }

    if (skill.key === "escape_method") {
      try {
        setSkillMessage(`${skill.name} sedang membaca celah jawaban...`);

        const response = await prisonerEscapeMethodApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Escape Method gagal membaca celah jawaban.",
          );
          return;
        }

        const wrongOptionIds = response.data.data?.wrong_option_ids || [];

        setTargetOptionIds((prev) => [
          ...new Set([...prev, ...wrongOptionIds]),
        ]);

        setSkillMessage(
          wrongOptionIds.length > 0
            ? `${skill.name} aktif. Prisoner menandai ${wrongOptionIds.length} opsi yang salah.`
            : "Tidak ada opsi salah yang bisa ditandai.",
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Escape Method error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Escape Method.");
      }

      return;
    }

    if (skill.key === "weapon_mastery") {
      try {
        setSkillMessage(`${skill.name} sedang menebas pilihan yang salah...`);

        const response = await prisonerEscapeMethodApi(quizId, {
          id_soal: currentSoal.id,
        });

        if (response?.status !== 200 || !response?.data?.success) {
          setSkillMessage(
            response?.data?.message ||
              "Weapon Mastery gagal menebas jawaban salah.",
          );
          return;
        }

        const wrongOptionIds = response.data.data?.wrong_option_ids || [];

        setLockedOptionIds((prev) => [
          ...new Set([...prev, ...wrongOptionIds]),
        ]);

        setSelected((prev) =>
          prev.filter((id) => !wrongOptionIds.includes(id)),
        );

        setSkillMessage(
          wrongOptionIds.length > 0
            ? `${skill.name} aktif. Warrior menebas ${wrongOptionIds.length} jawaban salah dan menguncinya.`
            : "Tidak ada jawaban salah yang bisa ditebas.",
        );

        markSkillUsed(skill);
      } catch (error) {
        console.error("Weapon Mastery error:", error);
        setSkillMessage("Terjadi kesalahan saat memakai Weapon Mastery.");
      }

      return;
    }

    if (skill.key === "binding") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini benar, waktu quiz bertambah 60 detik.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "caged_endurance") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini benar, health pulih 35 poin.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "suppressed_desire") {
      addBackendEffect(skill.key);
      setSubmitDelayLeft(15);
      setSkillMessage(
        `${skill.name} aktif. Submit terkunci 15 detik. Jika jawaban ini benar, kamu mendapat bonus XP 3/10 dari total XP quiz.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "criminal_proficiency") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini benar, kamu mendapat bonus XP 1/10 dari total XP quiz.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "dirty_trick") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini salah, damage hanya setengah. Jika benar, tidak ada bonus tambahan.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "evil_impulse") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika benar, health pulih 20 poin. Jika salah, damage menjadi 2x lipat.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "armor_guard") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini salah, damage hanya setengah. Jika benar, tidak ada efek tambahan.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "martial_counter") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini salah, kamu boleh memilih ulang dan jawaban salah tadi akan dikunci.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "trap_setting") {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Jika jawaban ini salah, jawaban salah tadi dikunci dan kamu mendapat 1 kesempatan menjawab ulang.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (skill.key === "terrain_advantage") {
      addBackendEffect(skill.key);
      setTerrainAdvantageCharges(2);
      setSkillMessage(
        `${skill.name} aktif. Damage dari 2 jawaban salah berikutnya dikurangi 30%.`,
      );
      markSkillUsed(skill);
      return;
    }

    if (
      [
        "risk_raid",
        "quick_escape",
        "replay_view",
        "escape_penalty",
        "break_free",
        "last_chance",
        "shield_guard",
        "second_attack",
      ].includes(skill.key)
    ) {
      addBackendEffect(skill.key);
      setSkillMessage(
        `${skill.name} aktif. Efek skill akan dikirim saat jawaban disubmit.`,
      );
      markSkillUsed(skill);
      return;
    }

    setSkillMessage("Skill belum memiliki efek di halaman ini.");
  };

  const buildSkillPayload = (extraEffects = []) => {
    const persistentEffects = [];

    if (terrainAdvantageCharges > 0) {
      persistentEffects.push("terrain_advantage");
    }

    const mergedEffects = [
      ...new Set([
        ...activeBackendEffects,
        ...persistentEffects,
        ...extraEffects,
      ]),
    ];

    return {
      game_role: gameRoleKey || null,
      used_skills: Object.keys(usedSkillKeys).filter(
        (key) => usedSkillKeys[key],
      ),
      active_effects: mergedEffects,
      hint_used: Boolean(hintText),
      question_highlighted: highlightQuestion,
      locked_option_ids: lockedOptionIds,
      target_option_ids: targetOptionIds,
      terrain_advantage_charges: terrainAdvantageCharges,
    };
  };

  const handleSubmitJawaban = async (
    forceSubmit = false,
    forcedEffects = [],
    forcedTimePenaltySeconds = 0,
  ) => {
    const isForcedSubmit = forceSubmit === true;

    if (!currentSoal || submitting || isTimeUp) return;

    if (!isForcedSubmit && selected.length < 1) return;

    try {
      setSubmitting(true);
      setErrorMessage("");

      const response = await submitJawabanMahasiswaApi(quizId, {
        id_soal: currentSoal.id,
        jawaban_ids: isForcedSubmit ? [] : selected,
        skill_data: buildSkillPayload(forcedEffects),
        sisa_waktu_detik: Math.max(
          0,
          Number(secondsLeft || 0) - Number(forcedTimePenaltySeconds || 0),
        ),
      });

      if (response?.status !== 200 || !response?.data?.success) {
        setErrorMessage(response?.data?.message || "Gagal mengirim jawaban.");
        return;
      }

      const payload = response.data.data;

      if (payload?.retry_same_question) {
        const retrySkill = payload?.skill_effect_used || null;
        const wrongLockedIds = payload?.wrong_locked_option_ids || [];

        removeBackendEffect("theft");
        removeBackendEffect("martial_counter");
        removeBackendEffect("trap_setting");

        if (wrongLockedIds.length > 0) {
          setLockedOptionIds((prev) => [
            ...new Set([...prev, ...wrongLockedIds]),
          ]);
        }

        setSelected((prev) =>
          prev.filter((id) => !wrongLockedIds.includes(id)),
        );

        setErrorMessage("");
        setSkillMessage(
          response.data.message ||
            payload?.message ||
            (retrySkill === "martial_counter"
              ? "Martial Counter aktif. Jawaban salah tadi dikunci, pilih jawaban lain."
              : "Theft berhasil. Jawaban pertama salah, tetapi kamu mendapat 1 kesempatan menjawab ulang."),
        );
        return;
      }

      const expBonusEarned = Number(payload.exp_bonus || 0);
      const expPenaltyEarned = Number(payload.exp_penalty || 0);
      const healthBonusEarned = Number(payload.health_bonus || 0);
      const timeBonusEarned = Number(payload.time_bonus || 0);

      if (
        gameRoleKey === "hunter" &&
        terrainAdvantageCharges > 0 &&
        payload.is_right === false
      ) {
        setTerrainAdvantageCharges((prev) => Math.max(0, prev - 1));
      }

      if (expBonusEarned > 0) {
        setCriminalExpBonus((prev) => prev + expBonusEarned);
      }

      if (timeBonusEarned > 0) {
        setSecondsLeft((prev) => prev + timeBonusEarned);
      }

      const effectMessages = [];

      if (response.data.message || payload?.message) {
        effectMessages.push(response.data.message || payload?.message);
      }

      if (expBonusEarned > 0) {
        effectMessages.push(`Bonus XP +${expBonusEarned}.`);
      }

      if (expPenaltyEarned > 0) {
        effectMessages.push(`Penalti XP -${expPenaltyEarned}.`);
      }

      if (payload.deduction_cap_active) {
        effectMessages.push("Deduction cap aktif: maksimal XP quiz 70%.");
      }

      if (healthBonusEarned > 0) {
        effectMessages.push(`Health pulih ${healthBonusEarned} poin.`);
      }

      if (timeBonusEarned > 0) {
        effectMessages.push(`Waktu bertambah ${timeBonusEarned} detik.`);
      }

      if (effectMessages.length > 0) {
        setSkillMessage(effectMessages.join(" "));
      }

      setHealth(
        Math.min(
          INITIAL_HEALTH,
          Number(payload.health_remaining ?? payload.score ?? health),
        ),
      );

      if (payload.finished) {
        const finalResult = buildResultSummary({
          score: payload.score || 0,
          expEarned:
            Number(payload.exp_earned || 0) +
            Number(criminalExpBonus || 0) +
            Number(payload.exp_bonus || 0),
          totalSoal: payload.progress?.total_soal || payload.total_soal || 20,
          totalBenar: payload.progress?.total_benar || payload.total_benar || 0,
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

  const preyMarkActive = activeBackendEffects.includes("prey_mark");
  const preyMarkTargetSelected =
    !preyMarkActive ||
    selected.some((id) => targetOptionIds.includes(id));
  const submitBlocked =
    selected.length < 1 ||
    submitting ||
    isTimeUp ||
    submitDelayLeft > 0 ||
    !preyMarkTargetSelected;

  if (!open) return null;

  return (
    <div style={S.overlay} onMouseDown={showResult ? onClose : undefined}>
      <div style={S.sheet} onMouseDown={(e) => e.stopPropagation()}>
        {showResult ? (
          <HasilQuiz
            open={true}
            quizTitle={quizTitle || "Kuis"}
            result={result}
            questions={[]}
            selectedMap={{}}
            tutorActive={tutorActive}
            onTutorDone={() => {
              onTutorQuizFinished?.();
              if (!onTutorQuizFinished) {
                setShowResult(false);
                onClose?.();
              }
            }}
            onBackToModule={() => {
              setShowResult(false);
              onClose?.();
            }}
          />
        ) : (
          <>
            <div style={S.topbar}>
              <div style={S.topbarLeft}>
                {showResult ? (
                  <button style={S.backIconBtn} onClick={onClose}>
                    ←
                  </button>
                ) : null}

                <div style={S.titleWrap}>
                  <div style={S.eyebrow}>Quiz Adaptive</div>
                  <div style={S.quizTitle}>{quizTitle || "Kuis"}</div>
                </div>
              </div>

              <div style={S.topbarRight} data-tutor="quiz-info-pills">
                <div style={S.topPill}>XP Quiz: +{quizXp}</div>
                <div style={S.topPill}>
                  Soal {progressInfo.nomor_soal || 1}/
                  {progressInfo.total_soal || 10}
                </div>
                <div
                  style={{
                    ...S.topPill,
                    ...(timerPaused ? S.pausePill : {}),
                  }}
                >
                  {timerPaused ? "Timer Pause" : "Timer Aktif"}
                </div>
              </div>
            </div>

            <div style={S.main}>
              <div style={S.mainInner}>
                <div style={S.quizLayoutFrame}>
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
                        <div style={S.avatarMini}>{playerInitial}</div>
                        <div>
                          <div style={S.profileName}>{playerName}</div>
                          <div style={S.profileSub}>Player Quiz</div>
                        </div>
                      </div>

                      <div style={S.hpMiniWrap} data-tutor="quiz-health">
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

                      <div style={S.roleBox} data-tutor="quiz-skills">
                        {roleData ? (
                          <>
                            <div style={S.roleTop}>
                              <div style={S.roleIcon}>{roleData.icon}</div>

                              <div>
                                <div style={S.roleName}>{roleData.name}</div>
                                <div style={S.roleDesc}>{roleData.desc}</div>
                              </div>
                            </div>

                            <div style={S.skillList}>
                              {roleData.skills.map((skill) => {
                                const status = getSkillRequirementStatus(skill);
                                const used = Boolean(usedSkillKeys[skill.key]);
                                const isActiveSkill = skill.type === "active";
                                const isOpen = openSkillKey === skill.key;

                                return (
                                  <div key={skill.key} style={S.skillCard}>
                                    <button
                                      type="button"
                                      style={S.skillHeaderButton}
                                      onClick={() =>
                                        setOpenSkillKey((prev) =>
                                          prev === skill.key ? null : skill.key,
                                        )
                                      }
                                    >
                                      <div style={S.skillHeaderLeft}>
                                        <div style={S.skillName}>
                                          {skill.name}
                                        </div>
                                        <div style={S.skillMiniDesc}>
                                          {skill.desc}
                                        </div>
                                      </div>

                                      <div style={S.skillHeaderRight}>
                                        <span
                                          style={{
                                            ...S.skillTypeBadge,
                                            ...(skill.type === "active"
                                              ? S.skillTypeActive
                                              : S.skillTypePassive),
                                          }}
                                        >
                                          {skill.label}
                                        </span>

                                        <span style={S.chevron}>
                                          {isOpen ? "▲" : "▼"}
                                        </span>
                                      </div>
                                    </button>

                                    {isOpen ? (
                                      <div style={S.skillCollapseBody}>
                                        <div style={S.skillSupport}>
                                          Bisa: {skill.support.join(", ")}
                                        </div>

                                        <div style={S.skillRequirement}>
                                          Syarat: {skill.requirement}
                                        </div>

                                        {isActiveSkill ? (
                                          <button
                                            style={{
                                              ...S.skillButton,
                                              ...(!status.ok || used
                                                ? S.skillButtonDisabled
                                                : {}),
                                            }}
                                            disabled={!status.ok || used}
                                            onClick={() => useSkill(skill)}
                                          >
                                            {used
                                              ? "Sudah Dipakai"
                                              : "Gunakan Skill"}
                                          </button>
                                        ) : (
                                          <div style={S.passiveNote}>
                                            Aktif otomatis
                                          </div>
                                        )}

                                        {isActiveSkill &&
                                        !status.ok &&
                                        !used ? (
                                          <div style={S.skillDisabledReason}>
                                            {status.reason}
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : roleLoading ? (
                          <div style={S.noRoleBox}>
                            <div style={S.noRoleIcon}>⏳</div>
                            <div style={S.noRoleTitle}>Memuat role...</div>
                            <div style={S.noRoleText}>
                              Sistem sedang mengambil role kamu dari profil.
                            </div>
                          </div>
                        ) : (
                          <div style={S.noRoleBox}>
                            <div style={S.noRoleIcon}>🎮</div>
                            <div style={S.noRoleTitle}>Role belum dipilih</div>
                            <div style={S.noRoleText}>
                              Pilih role di profil agar skill quiz muncul.
                            </div>
                          </div>
                        )}
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
                          {!isTimeUp ? (
                            <button
                              style={S.primaryBtn}
                              onClick={fetchNextSoal}
                            >
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
                      <div style={S.card} data-tutor="quiz-question-card">
                        <div style={S.cardTopRow}>
                          <div>
                            <div style={S.questionLabel}>Pertanyaan {progressInfo.nomor_soal || 1} dari {progressInfo.total_soal || 20}</div>
                            <div style={S.typeBadge}>
                              Tipe:{" "}
                              {currentQuestionType === "checkbox"
                                ? "Checkbox"
                                : currentQuestionType === "true_false"
                                  ? "True / False"
                                  : "Pilihan Ganda"}
                            </div>
                          </div>

                          <div style={S.rightBadges}>
                            <div
                              style={{
                                ...S.timerPill,
                                ...(isTimeUp ? S.timerPillDanger : {}),
                                ...(timerPaused ? S.timerPillPaused : {}),
                              }}
                            >
                              <span>{timerPaused ? "⏸" : "⏱"}</span>
                              <span style={{ fontWeight: 900 }}>
                                {timeText}
                              </span>
                            </div>

                            <div style={S.difficultyBadge}>
                              Difficulty: {getDifficulty(currentSoal)}
                            </div>
                          </div>
                        </div>

                        {skillMessage ? (
                          <div style={S.skillMessage}>{skillMessage}</div>
                        ) : null}

                        {hintText ? (
                          <div style={S.hintBox}>
                            <div style={S.hintTitle}>Hint Skill</div>
                            <div style={S.hintText}>{hintText}</div>
                          </div>
                        ) : null}

                        {activeBackendEffects.length > 0 ||
                        terrainAdvantageCharges > 0 ? (
                          <div style={S.activeEffectBox}>
                            Efek aktif untuk submit:{" "}
                            {[
                              ...activeBackendEffects.filter(
                                (key) =>
                                  key !== "terrain_advantage" ||
                                  terrainAdvantageCharges <= 0,
                              ),
                              ...(terrainAdvantageCharges > 0
                                ? [
                                    `terrain_advantage (${terrainAdvantageCharges}x)`,
                                  ]
                                : []),
                            ].join(", ")}
                          </div>
                        ) : null}

                        <div style={S.questionBlock}>
                          <div style={S.qTitle}>
                            <HighlightedQuestion
                              text={getQuestionText(currentSoal)}
                              enabled={highlightQuestion}
                            />
                          </div>
                        </div>

                        <div style={S.options} data-tutor="quiz-options">
                          {(currentSoal.jawaban || []).map((opt) => {
                            const active = isChecked(opt.id_jawaban);
                            const locked = lockedOptionIds.includes(
                              opt.id_jawaban,
                            );
                            const targeted = targetOptionIds.includes(
                              opt.id_jawaban,
                            );

                            return (
                              <button
                                key={opt.id_jawaban}
                                onClick={() => pickOption(opt.id_jawaban)}
                                disabled={isTimeUp || locked}
                                style={{
                                  ...S.optionBtn,
                                  ...(active ? S.optionBtnActive : {}),
                                  ...(targeted ? S.optionBtnTargeted : {}),
                                  ...(isTimeUp || locked
                                    ? S.optionBtnDisabled
                                    : {}),
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

                                  {targeted ? (
                                    <span style={S.optionTag}>
                                      Target skill
                                    </span>
                                  ) : null}

                                  {locked ? (
                                    <span style={S.optionTagDanger}>
                                      Dikunci skill
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div style={S.footerRow}>
                          <button
                            style={{
                              ...S.primaryBtn,
                              ...(submitBlocked ? S.primaryBtnDisabled : {}),
                            }}
                            onClick={() => handleSubmitJawaban()}
                            disabled={submitBlocked}
                          >
                            {isTimeUp
                              ? "Waktu Habis"
                              : submitting
                                ? "Mengirim..."
                                : submitDelayLeft > 0
                                  ? `Tunggu ${submitDelayLeft} detik`
                                  : `${isLastQuestion ? "Submit" : "Selanjutnya"} →`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <InlineWorkTutor
          open={tutorActive && !showResult}
          steps={[
            {
              title: "Info Quiz",
              body: "Di kanan atas ada XP quiz, posisi nomor soal, total soal, dan status timer.",
              target: '[data-tutor="quiz-info-pills"]',
            },
            {
              title: "Health = Skor Akhir",
              body: "Health ini juga menjadi skor akhir kamu. Jawaban salah akan mengurangi health, jadi kerjakan dengan teliti.",
              target: '[data-tutor="quiz-health"]',
            },
            {
              title: "Skill Role",
              body: "Skill aktif bisa dipakai sesuai syarat. Skill pasif akan aktif otomatis saat kondisinya terpenuhi.",
              target: '[data-tutor="quiz-skills"]',
            },
            {
              title: "Card Pertanyaan",
              body: "Di sini kamu membaca nomor soal, tipe soal, difficulty, pertanyaan, dan pilihan jawabannya.",
              target: '[data-tutor="quiz-question-card"]',
            },
            {
              title: "Jawaban dan Submit",
              body: "Pilih jawaban di area ini, lalu klik {isLastQuestion ? 'Submit' : 'Selanjutnya'}. Tombol kembali di quiz dihilangkan supaya tidak bisa keluar sebelum selesai.",
              target: '[data-tutor="quiz-options"]',
            },
          ]}
        />
      </div>
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
    transition: "top 280ms ease, left 280ms ease, bottom 280ms ease, transform 280ms ease",
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


function formatSecondsToTime(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds || 0));
  const mm = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const ss = String(safeSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
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

  const sisaWaktuDetik =
    waktuPenyelesaian !== null && waktuPenyelesaian !== undefined
      ? Number(waktuPenyelesaian)
      : null;

  return {
    correct: totalBenar,
    total: totalSoal,
    score100: score,
    xpEarned: expEarned,
    accuracy,

    // tampilkan sisa waktu, bukan timestamp
    timeText:
      sisaWaktuDetik !== null && !Number.isNaN(sisaWaktuDetik)
        ? formatSecondsToTime(sisaWaktuDetik)
        : timeText,

    secondsElapsed,
    totalQuestions: totalSoal,

    // simpan raw detik
    waktu_penyelesaian: sisaWaktuDetik,

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

  pausePill: {
    border: "1px solid rgba(45,212,191,0.38)",
    background: "rgba(45,212,191,0.12)",
  },

  main: {
    height: "calc(100% - 72px)",
    overflowY: "auto",
    padding: "28px 24px 64px",
  },

  mainInner: {
    width: "min(1440px, 100%)",
    margin: "0 auto",
  },

  quizLayoutFrame: {
    width: "min(100%, 1378px)",
    margin: "0 auto",
  },

  progressWrap: {
    width: "100%",
    marginBottom: 22,
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
    display: "grid",
    gridTemplateColumns: "minmax(280px, 390px) minmax(0, 960px)",
    alignItems: "flex-start",
    gap: 28,
    width: "100%",
  },

  playerColumn: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    alignItems: "flex-start",
  },

  soalColumn: {
    width: "100%",
    minWidth: 0,
  },

  profileHpCard: {
    width: "100%",
    borderRadius: 24,
    border: "1px solid rgba(139,92,246,0.28)",
    background: "rgba(15,23,42,0.58)",
    padding: 20,
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

  roleBox: {
    marginTop: 18,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 16,
  },

  roleTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    background: "rgba(139,92,246,0.14)",
    border: "1px solid rgba(139,92,246,0.30)",
  },

  roleName: {
    fontSize: 16,
    fontWeight: 950,
  },

  roleDesc: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 1.4,
    color: "rgba(238,242,255,0.62)",
  },

  skillList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  skillCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    overflow: "hidden",
  },

  skillHeaderButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#eef2ff",
    cursor: "pointer",
    padding: "12px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
  },

  skillHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },

  skillHeaderRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexShrink: 0,
    alignSelf: "center",
  },

  skillName: {
    fontSize: 13,
    fontWeight: 950,
    color: "#f8fafc",
  },

  skillMiniDesc: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 1.35,
    color: "rgba(238,242,255,0.56)",
  },

  chevron: {
    width: 26,
    height: 26,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(238,242,255,0.78)",
    fontSize: 10,
    fontWeight: 950,
    lineHeight: 1,
  },

  skillCollapseBody: {
    padding: "0 12px 12px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },

  skillTypeBadge: {
    minWidth: 46,
    height: 26,
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 950,
    padding: "0 10px",
    borderRadius: 999,
    lineHeight: 1,
  },

  skillTypeActive: {
    color: "#bae6fd",
    background: "rgba(14,165,233,0.14)",
    border: "1px solid rgba(14,165,233,0.22)",
  },

  skillTypePassive: {
    color: "#bbf7d0",
    background: "rgba(34,197,94,0.14)",
    border: "1px solid rgba(34,197,94,0.22)",
  },

  skillSupport: {
    marginTop: 10,
    fontSize: 10,
    color: "rgba(238,242,255,0.50)",
    lineHeight: 1.35,
  },

  skillRequirement: {
    marginTop: 6,
    fontSize: 10,
    color: "rgba(253,230,138,0.82)",
    lineHeight: 1.4,
  },

  skillButton: {
    marginTop: 9,
    width: "100%",
    border: "1px solid rgba(45,212,191,0.35)",
    background: "rgba(45,212,191,0.12)",
    color: "#ccfbf1",
    borderRadius: 12,
    padding: "9px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
  },

  skillButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  passiveNote: {
    marginTop: 9,
    width: "100%",
    border: "1px solid rgba(34,197,94,0.22)",
    background: "rgba(34,197,94,0.10)",
    color: "#bbf7d0",
    borderRadius: 12,
    padding: "9px 10px",
    fontSize: 12,
    fontWeight: 900,
    textAlign: "center",
  },

  skillDisabledReason: {
    marginTop: 7,
    fontSize: 10,
    color: "rgba(248,113,113,0.90)",
    lineHeight: 1.35,
  },

  noRoleBox: {
    borderRadius: 18,
    border: "1px dashed rgba(255,255,255,0.14)",
    padding: 16,
    textAlign: "center",
    background: "rgba(255,255,255,0.025)",
  },

  noRoleIcon: {
    fontSize: 34,
    marginBottom: 8,
  },

  noRoleTitle: {
    fontWeight: 950,
    marginBottom: 6,
  },

  noRoleText: {
    fontSize: 12,
    color: "rgba(238,242,255,0.62)",
    lineHeight: 1.5,
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

  rightBadges: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  timerPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 110,
    justifyContent: "center",
    padding: "9px 14px",
    borderRadius: 999,
    border: "1px solid rgba(139, 92, 246, 0.30)",
    background: "rgba(139, 92, 246, 0.16)",
    fontSize: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
  },

  timerPillDanger: {
    border: "1px solid rgba(239,68,68,0.38)",
    background: "rgba(239,68,68,0.16)",
  },

  timerPillPaused: {
    border: "1px solid rgba(45,212,191,0.38)",
    background: "rgba(45,212,191,0.14)",
  },

  typeBadge: {
    display: "inline-flex",
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(45,212,191,0.10)",
    border: "1px solid rgba(45,212,191,0.24)",
    color: "rgba(204,251,241,0.95)",
    fontWeight: 800,
  },

  difficultyBadge: {
    fontSize: 12,
    padding: "9px 14px",
    borderRadius: 999,
    background: "rgba(139, 92, 246, 0.14)",
    border: "1px solid rgba(139, 92, 246, 0.30)",
    color: "rgba(238,242,255,0.95)",
    fontWeight: 700,
  },

  skillMessage: {
    marginTop: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    background: "rgba(45,212,191,0.10)",
    border: "1px solid rgba(45,212,191,0.22)",
    color: "#ccfbf1",
    fontSize: 13,
    fontWeight: 750,
    lineHeight: 1.5,
  },

  hintBox: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    background: "rgba(250,204,21,0.10)",
    border: "1px solid rgba(250,204,21,0.22)",
  },

  hintTitle: {
    fontSize: 12,
    fontWeight: 950,
    color: "#fef3c7",
    marginBottom: 6,
  },

  hintText: {
    fontSize: 13,
    color: "rgba(254,243,199,0.90)",
    lineHeight: 1.55,
  },

  activeEffectBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    background: "rgba(139,92,246,0.12)",
    border: "1px solid rgba(139,92,246,0.24)",
    color: "#ddd6fe",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.5,
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

  keywordMark: {
    background: "rgba(250,204,21,0.30)",
    color: "#fef3c7",
    padding: "0 4px",
    borderRadius: 6,
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

  optionBtnTargeted: {
    border: "1px solid rgba(250,204,21,0.42)",
    background: "rgba(250,204,21,0.10)",
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
    flex: 1,
  },

  optionTag: {
    display: "inline-flex",
    marginLeft: 10,
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 950,
    color: "#fef3c7",
    border: "1px solid rgba(250,204,21,0.28)",
    background: "rgba(250,204,21,0.12)",
  },

  optionTagDanger: {
    display: "inline-flex",
    marginLeft: 10,
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 950,
    color: "#fecaca",
    border: "1px solid rgba(248,113,113,0.28)",
    background: "rgba(248,113,113,0.12)",
  },

  footerRow: {
    marginTop: 22,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
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
