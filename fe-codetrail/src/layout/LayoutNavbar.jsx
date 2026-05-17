import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Form,
  Input,
  Layout,
  Modal,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  TrophyOutlined,
  RiseOutlined,
  LogoutOutlined,
  CodeOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserLevelApi } from "../components/api/level";
import { getUserByIdApi, updateUserApi } from "../components/api/user";

const { Header } = Layout;

const defaultLevelInfo = {
  level: 1,
  total_exp: 0,
  current_level_exp: 0,
  required_exp: 100,
  remaining_exp: 100,
  next_level: 2,
  progress_percent: 0,
};

const ROLE_SKILL_CONFIGS = {
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

const ROLE_META = {
  assassin: { short: "Cepat dan presisi", color: "#ef4444" },
  seer: { short: "Vision dan intuisi", color: "#8b5cf6" },
  marauder: { short: "Risiko tinggi reward tinggi", color: "#f97316" },
  spectator: { short: "Mengamati dan menganalisis", color: "#06b6d4" },
  criminal: { short: "Licik tapi tetap fair", color: "#64748b" },
  prisoner: { short: "Comeback dan bertahan", color: "#a855f7" },
  warrior: { short: "Kuat dan stabil", color: "#22c55e" },
  reader: { short: "Membaca dan memahami", color: "#3b82f6" },
  hunter: { short: "Akurasi dan target", color: "#eab308" },
};

const GAME_ROLES = Object.entries(ROLE_SKILL_CONFIGS).map(([key, value]) => ({
  key,
  name: value.name,
  icon: value.icon,
  short: ROLE_META[key]?.short || value.desc,
  desc: value.desc,
  color: ROLE_META[key]?.color || "#7c5cff",
  skills: (value.skills || []).map((skill) => ({
    ...skill,
    type: skill.label || (skill.type === "active" ? "Aktif" : "Pasif"),
    support: Array.isArray(skill.support)
      ? skill.support
          .map((item) => {
            if (item === "pilgan") return "Pilgan";
            if (item === "true_false") return "True/False";
            if (item === "checkbox") return "Checkbox";
            return item;
          })
          .join(", ")
      : skill.support,
  })),
}));


function getUserName(session) {
  return (
    localStorage.getItem("nama_user") ||
    session?.user?.nama_user ||
    session?.user?.nama ||
    session?.nama_user ||
    session?.nama ||
    "Mahasiswa"
  );
}

function getRoleByKey(key) {
  return GAME_ROLES.find((role) => role.key === key) || null;
}

export default function LayoutNavbar({ session }) {
  const navigate = useNavigate();
  const location = useLocation();

  const userName = getUserName(session);

  const [levelInfo, setLevelInfo] = useState(defaultLevelInfo);
  const [loadingLevel, setLoadingLevel] = useState(true);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [selectedGameRole, setSelectedGameRole] = useState(null);
  const [profileTutorialOpen, setProfileTutorialOpen] = useState(false);
  const [profileTutorialStep, setProfileTutorialStep] = useState(0);
  const [openedFromRoadmapTutorial, setOpenedFromRoadmapTutorial] = useState(false);
  const [appNotif, setAppNotif] = useState(null);

  const [form] = Form.useForm();

  const savedGameRole =
    profile?.game_role || localStorage.getItem("game_role") || null;

  const selectedRoleData = useMemo(
    () => getRoleByKey(selectedGameRole || savedGameRole),
    [selectedGameRole, savedGameRole],
  );

  const isRoleSetupRequired =
    profileOpen && openedFromRoadmapTutorial && !savedGameRole;

  const showAppNotif = ({ type = "info", title, message, onClose }) => {
    setAppNotif({ type, title, message, onClose });
  };

  const closeAppNotif = () => {
    const callback = appNotif?.onClose;
    setAppNotif(null);

    if (typeof callback === "function") {
      callback();
    }
  };

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        setLoadingLevel(true);

        const idUser = localStorage.getItem("id_user");

        if (!idUser) {
          setLevelInfo(defaultLevelInfo);
          return;
        }

        const response = await getUserLevelApi(idUser);

        if (response?.status === 200 && response?.data?.success) {
          setLevelInfo(response.data.data?.level_info || defaultLevelInfo);
        } else {
          setLevelInfo(defaultLevelInfo);
        }
      } catch (error) {
        setLevelInfo(defaultLevelInfo);
      } finally {
        setLoadingLevel(false);
      }
    };

    fetchLevel();
  }, [location.pathname]);

  useEffect(() => {
    const openProfileFromTutorial = () => {
      setOpenedFromRoadmapTutorial(true);
      setProfileTutorialOpen(true);
      setProfileTutorialStep(0);
      openProfileModal();
    };

    window.addEventListener("open-profile-modal", openProfileFromTutorial);

    return () => {
      window.removeEventListener("open-profile-modal", openProfileFromTutorial);
    };
  }, []);

  useEffect(() => {
    if (!profileOpen || !profileTutorialOpen) return;

    const lockedRole = profile?.game_role || localStorage.getItem("game_role");

    if (lockedRole) {
      setProfileTutorialStep(1);
      return;
    }

    if (profileTutorialStep === 0 && selectedGameRole) {
      setProfileTutorialStep(1);
    }
  }, [profileOpen, profileTutorialOpen, profileTutorialStep, selectedGameRole, profile?.game_role]);

  const menus = [
    {
      key: "roadmap",
      label: "Roadmap",
      icon: <BarChartOutlined />,
      path: "/dashboard/roadmap",
    },
    {
      key: "achievement",
      label: "Achievement",
      icon: <TrophyOutlined />,
      path: "/dashboard/achievement",
    },
    {
      key: "leaderboard",
      label: "Leaderboard",
      icon: <RiseOutlined />,
      path: "/dashboard/leaderboard",
    },
  ];

  const isActive = (path) => location.pathname === path;

  const fetchProfile = async () => {
    try {
      const idUser = localStorage.getItem("id_user");

      if (!idUser) return;

      setProfileLoading(true);

      const response = await getUserByIdApi(idUser);

      if (response?.status === 200 && response?.data?.success) {
        const user = response.data.data;

        setProfile(user);
        setSelectedGameRole(user?.game_role || null);

        localStorage.setItem("nama_user", user?.nama_user || "Mahasiswa");
        localStorage.setItem("email", user?.email || "");

        if (user?.game_role) {
          localStorage.setItem("game_role", user.game_role);
        }

        form.setFieldsValue({
          nama_user: user?.nama_user || "",
          email: user?.email || "",
          password: "",
        });
      }
    } catch (error) {
      showAppNotif({
        type: "error",
        title: "Gagal Memuat Profil",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Terjadi kesalahan saat memuat profil.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const openProfileModal = async () => {
    setProfileOpen(true);
    await fetchProfile();
  };

  const closeProfileModal = () => {
    const lockedRole = profile?.game_role || localStorage.getItem("game_role");

    if (openedFromRoadmapTutorial && !lockedRole) {
      showAppNotif({
        type: "error",
        title: "Setup Role Belum Selesai",
        message:
          "Pilih satu role lalu simpan dulu agar skill quiz kamu aktif. Modal ini belum bisa ditutup sebelum role tersimpan.",
      });
      return;
    }

    setProfileOpen(false);
    setProfileTutorialOpen(false);
    setProfileTutorialStep(0);
    setOpenedFromRoadmapTutorial(false);
    setSelectedGameRole(profile?.game_role || localStorage.getItem("game_role"));
    form.setFieldsValue({
      password: "",
    });
  };

  const saveProfile = async () => {
    try {
      const idUser = localStorage.getItem("id_user");

      if (!idUser) {
        showAppNotif({
          type: "error",
          title: "User Tidak Ditemukan",
          message: "Silakan login ulang.",
        });
        return;
      }

      const values = await form.validateFields();

      const payload = {
        nama_user: profile?.nama_user || values.nama_user,
        email: isRoleSetupRequired ? profile?.email || values.email : values.email,
      };

      if (!isRoleSetupRequired && values.password && values.password.trim().length > 0) {
        payload.password = values.password.trim();
      }

      if (!profile?.game_role && selectedGameRole) {
        payload.game_role = selectedGameRole;
      }

      if (!profile?.game_role && !selectedGameRole) {
        showAppNotif({
          type: "error",
          title: "Role Belum Dipilih",
          message:
            "Pilih satu role game dulu agar skill quiz kamu aktif. Role hanya bisa dipilih satu kali.",
        });
        return;
      }

      const runUpdate = async () => {
        try {
          setProfileSaving(true);

          const response = await updateUserApi(idUser, payload);

          if (response?.status === 200 && response?.data?.success) {
            const updatedUser = response.data.data;

            setProfile(updatedUser);

            localStorage.setItem("nama_user", updatedUser?.nama_user || "");
            localStorage.setItem("email", updatedUser?.email || "");

            if (updatedUser?.game_role) {
              localStorage.setItem("game_role", updatedUser.game_role);
            }

            showAppNotif({
              type: "success",
              title: isRoleSetupRequired
                ? "Role Berhasil Dipilih!"
                : "Profil Berhasil Disimpan",
              message: updatedUser?.game_role
                ? `Role kamu: ${getRoleByKey(updatedUser.game_role)?.name || updatedUser.game_role}. Skill role sudah aktif dan bisa dipakai saat quiz.`
                : "Email atau password berhasil diperbarui.",
              onClose: () => {
                setProfileOpen(false);
                setProfileTutorialOpen(false);
                setProfileTutorialStep(0);
                setOpenedFromRoadmapTutorial(false);

                window.dispatchEvent(
                  new CustomEvent("game-role-selected", {
                    detail: {
                      game_role: updatedUser?.game_role || selectedGameRole,
                    },
                  }),
                );

                if (location.pathname !== "/dashboard/roadmap") {
                  navigate("/dashboard/roadmap");
                }
              },
            });
          }
        } catch (error) {
          showAppNotif({
            type: "error",
            title: "Gagal Menyimpan Profil",
            message:
              error?.response?.data?.message ||
              error?.message ||
              "Terjadi kesalahan saat menyimpan profil.",
          });
        } finally {
          setProfileSaving(false);
        }
      };

      await runUpdate();
    } catch (error) {
      if (error?.errorFields) return;

      showAppNotif({
        type: "error",
        title: "Validasi Gagal",
        message: error?.message || "Periksa kembali data profil.",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("token");
    localStorage.removeItem("id_user");
    localStorage.removeItem("nama_user");
    localStorage.removeItem("role");
    localStorage.removeItem("game_role");
    localStorage.removeItem("email");

    navigate("/signin", { replace: true });
  };

  return (
    <>
      <Header style={styles.header}>
        <div style={styles.navWrap}>
          <div
            onClick={() => navigate("/dashboard/roadmap")}
            style={styles.brand}
          >
            <div style={styles.logoBox}>
              <CodeOutlined style={{ color: "#7C5CFF", fontSize: 18 }} />
            </div>

            <div style={styles.brandText}>
              <Typography.Text style={styles.brandTitle}>
                CodeTrail
              </Typography.Text>
              <Typography.Text style={styles.brandSub}>
                Student Learning
              </Typography.Text>
            </div>
          </div>

          <nav style={styles.menuWrap}>
            {menus.map((menu) => {
              const active = isActive(menu.path);

              return (
                <button
                  key={menu.key}
                  onClick={() => navigate(menu.path)}
                  style={{
                    ...styles.menuButton,
                    ...(active ? styles.menuButtonActive : {}),
                  }}
                >
                  {menu.icon}
                  {menu.label}
                </button>
              );
            })}
          </nav>

          <div style={styles.rightWrap}>
            <div style={styles.levelMiniCard}>
              <div style={styles.levelBadge}>
                LV {loadingLevel ? "-" : levelInfo.level}
              </div>

              <div style={styles.levelInfo}>
                <div style={styles.levelXpRow}>
                  <span>
                    {loadingLevel
                      ? "0 / 100 XP"
                      : `${levelInfo.current_level_exp} / ${levelInfo.required_exp} XP`}
                  </span>

                  <span>{loadingLevel ? 0 : levelInfo.progress_percent}%</span>
                </div>

                <div style={styles.levelBarOuter}>
                  <div
                    style={{
                      ...styles.levelBarInner,
                      width: `${loadingLevel ? 0 : levelInfo.progress_percent}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              data-tour="profile-role"
              onClick={openProfileModal}
              style={styles.profileCard}
              title="Klik untuk edit profil dan pilih role"
            >
              <Avatar style={styles.avatar}>
                {userName?.charAt(0)?.toUpperCase() || "M"}
              </Avatar>

              <div style={styles.profileText}>
                <Typography.Text title={userName} style={styles.profileName}>
                  {userName}
                </Typography.Text>
                <Typography.Text style={styles.profileRole}>
                  {savedGameRole
                    ? `${selectedRoleData?.icon || "🎮"} ${selectedRoleData?.name || "Role"}`
                    : "Mahasiswa"}
                </Typography.Text>
              </div>
            </button>

            <button
              onClick={handleLogout}
              style={styles.logoutButton}
              title="Logout"
            >
              <LogoutOutlined style={styles.logoutIcon} />
            </button>
          </div>
        </div>
      </Header>

      <Modal
        open={profileOpen}
        onCancel={closeProfileModal}
        footer={null}
        width={980}
        centered
        maskClosable={!isRoleSetupRequired}
        keyboard={!isRoleSetupRequired}
        closeIcon={
          isRoleSetupRequired ? null : (
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>
              ×
            </span>
          )
        }
        styles={{
          content: {
            padding: 0,
            borderRadius: 22,
            overflow: "hidden",
            background:
              "radial-gradient(900px 480px at 50% 0%, rgba(124,92,255,0.22), rgba(8,12,24,0.98) 58%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.60)",
          },
          header: { display: "none" },
          body: { padding: 0 },
        }}
      >
        <div style={modalStyles.header}>
          <div style={modalStyles.headerLeft}>
            <div style={modalStyles.headerIcon}>
              <UserOutlined />
            </div>

            <div>
              <div style={modalStyles.title}>
                {isRoleSetupRequired ? "Selamat Datang di CodeTrail" : "Profil Mahasiswa"}
              </div>
              <div style={modalStyles.subtitle}>
                {isRoleSetupRequired
                  ? "Sebelum mulai belajar, pilih role game yang akan menemani perjalananmu. Setiap role punya skill berbeda untuk membantu quiz."
                  : "Kelola akun dan lihat role game yang sudah kamu pilih."}
              </div>
            </div>
          </div>

          {savedGameRole ? (
            <div style={modalStyles.roleLockedBadge}>
              <CheckCircleOutlined />
              Role sudah dipilih
            </div>
          ) : (
            <div style={modalStyles.roleWarningBadge}>
              Role hanya bisa dipilih sekali
            </div>
          )}
        </div>

        {isRoleSetupRequired ? (
          <div style={modalStyles.setupIntroCard}>
            <div style={modalStyles.setupIntroIcon}>🚀</div>
            <div>
              <div style={modalStyles.setupIntroTitle}>Mulai perjalananmu sebagai karakter pilihanmu.</div>
              <div style={modalStyles.setupIntroText}>
                Pilih role yang paling cocok dengan gaya belajarmu. Setelah disimpan, role akan mengaktifkan skill khusus di quiz dan tidak bisa diubah lagi.
              </div>
            </div>
          </div>
        ) : null}

        <div style={modalStyles.content}>
          <div style={modalStyles.leftPanel}>
            <div style={modalStyles.sectionTitle}>
              {isRoleSetupRequired ? "Akun Kamu" : "Data Akun"}
            </div>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              disabled={profileLoading}
            >
              <Form.Item
                label={<span style={modalStyles.label}>Nama</span>}
                name="nama_user"
              >
                <Input
                  disabled
                  prefix={<UserOutlined />}
                  style={modalStyles.input}
                />
              </Form.Item>

              <Form.Item
                label={<span style={modalStyles.label}>Email</span>}
                name="email"
                rules={[
                  { required: true, message: "Email wajib diisi" },
                  { type: "email", message: "Format email tidak valid" },
                ]}
              >
                <Input
                  disabled={isRoleSetupRequired}
                  prefix={<MailOutlined />}
                  placeholder={
                    isRoleSetupRequired
                      ? "Email dikunci saat setup role"
                      : "Masukkan email baru"
                  }
                  style={modalStyles.input}
                />
              </Form.Item>

              <Form.Item
                label={<span style={modalStyles.label}>Password Baru</span>}
                name="password"
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value || value.trim().length === 0) {
                        return Promise.resolve();
                      }

                      if (value.trim().length < 6) {
                        return Promise.reject(
                          new Error("Password minimal 6 karakter"),
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password
                  disabled={isRoleSetupRequired}
                  prefix={<LockOutlined />}
                  placeholder={
                    isRoleSetupRequired
                      ? "Password dikunci saat setup role"
                      : "Kosongkan jika tidak ingin mengganti password"
                  }
                  style={modalStyles.input}
                />
              </Form.Item>
            </Form>

            <div style={modalStyles.infoBox}>
              <div style={modalStyles.infoTitle}>Catatan Role</div>
              <div style={modalStyles.infoText}>
                {isRoleSetupRequired
                  ? "Email dan password dikunci dulu pada tahap awal ini. Fokus pilih role terbaikmu, lalu simpan untuk membuka perjalanan belajar."
                  : "Role game akan dipakai untuk skill saat quiz. Setelah dipilih, role tidak bisa diubah lagi."}
              </div>
            </div>
          </div>

          <div style={modalStyles.rightPanel}>
            <div style={modalStyles.sectionTitle}>Pilih Role Game</div>

            <div data-tour="profile-role-grid" style={modalStyles.roleGrid}>
              {GAME_ROLES.map((role) => {
                const active =
                  selectedGameRole === role.key || savedGameRole === role.key;
                const locked = Boolean(savedGameRole);
                const disabled = locked && savedGameRole !== role.key;

                return (
                  <button
                    key={role.key}
                    disabled={disabled}
                    onClick={() => {
                      if (!locked) {
                        setSelectedGameRole(role.key);
                      }
                    }}
                    style={{
                      ...modalStyles.roleCard,
                      ...(active
                        ? {
                            border: `1px solid ${role.color}`,
                            boxShadow: `0 0 22px ${role.color}44`,
                            background: `${role.color}16`,
                          }
                        : {}),
                      ...(disabled ? modalStyles.roleCardDisabled : {}),
                    }}
                  >
                    <div style={modalStyles.roleTop}>
                      <div
                        style={{
                          ...modalStyles.roleIcon,
                          background: `${role.color}22`,
                          border: `1px solid ${role.color}55`,
                        }}
                      >
                        {role.icon}
                      </div>

                      {active && (
                        <CheckCircleOutlined
                          style={{ color: role.color, fontSize: 18 }}
                        />
                      )}
                    </div>

                    <div style={modalStyles.roleName}>{role.name}</div>
                    <div style={modalStyles.roleShort}>{role.short}</div>
                  </button>
                );
              })}
            </div>

            {selectedRoleData ? (
              <div data-tour="profile-skill-preview" style={modalStyles.skillPreview}>
                <div style={modalStyles.skillHeader}>
                  <div style={modalStyles.skillRoleIcon}>
                    {selectedRoleData.icon}
                  </div>

                  <div>
                    <div style={modalStyles.skillRoleName}>
                      {selectedRoleData.name}
                    </div>
                    <div style={modalStyles.skillRoleDesc}>
                      {selectedRoleData.desc}
                    </div>
                  </div>
                </div>

                <div style={modalStyles.skillList}>
                  {selectedRoleData.skills.map((skill) => (
                    <div key={skill.name} style={modalStyles.skillItem}>
                      <div style={modalStyles.skillItemTop}>
                        <span style={modalStyles.skillName}>{skill.name}</span>
                        <span
                          style={{
                            ...modalStyles.skillType,
                            ...(skill.type === "Aktif"
                              ? modalStyles.skillTypeActive
                              : modalStyles.skillTypePassive),
                          }}
                        >
                          {skill.type}
                        </span>
                      </div>

                      <div style={modalStyles.skillDesc}>{skill.desc}</div>
                      <div style={modalStyles.skillSupport}>
                        Bisa dipakai: {skill.support}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={modalStyles.emptyRolePreview}>
                Pilih salah satu role untuk melihat skill-nya.
              </div>
            )}
          </div>
        </div>

        <div style={modalStyles.footer}>
          {!isRoleSetupRequired ? (
            <Button
              onClick={closeProfileModal}
              style={modalStyles.cancelButton}
            >
              Batal
            </Button>
          ) : (
            <div style={modalStyles.lockedSetupText}>
              Setup role wajib diselesaikan dulu.
            </div>
          )}

          <Button
            data-tour="profile-save-button"
            type="primary"
            loading={profileSaving}
            onClick={saveProfile}
            style={modalStyles.saveButton}
          >
            {isRoleSetupRequired ? "Simpan Role & Mulai" : "Simpan Profil"}
          </Button>
        </div>
      </Modal>
      {appNotif ? (
        <PopupNotif
          type={appNotif.type}
          title={appNotif.title}
          message={appNotif.message}
          onClose={closeAppNotif}
        />
      ) : null}

    </>
  );
}


function PopupNotif({ type = "info", title, message, onClose }) {
  const isSuccess = type === "success";

  return (
    <div style={notifStyles.overlay} onMouseDown={(e) => e.stopPropagation()}>
      <div style={notifStyles.card}>
        <div
          style={{
            ...notifStyles.iconCircle,
            ...(isSuccess ? notifStyles.successIcon : notifStyles.errorIcon),
          }}
        >
          {isSuccess ? "✓" : "✕"}
        </div>

        <div style={notifStyles.title}>{title}</div>
        <div style={notifStyles.message}>{message}</div>

        <button
          style={{
            ...notifStyles.button,
            ...(isSuccess ? notifStyles.successBtn : notifStyles.errorBtn),
          }}
          onClick={onClose}
        >
          Oke
        </button>
      </div>
    </div>
  );
}

const notifStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 30000,
    display: "grid",
    placeItems: "center",
    background: "rgba(2, 6, 23, 0.58)",
    backdropFilter: "blur(7px)",
  },
  card: {
    width: "min(420px, calc(100vw - 34px))",
    borderRadius: 26,
    padding: "30px 26px 24px",
    textAlign: "center",
    color: "#eef2ff",
    border: "1px solid rgba(148,163,184,0.25)",
    background:
      "radial-gradient(700px 360px at 50% 0%, rgba(124,92,255,0.20), rgba(9,12,24,0.98) 62%)",
    boxShadow: "0 28px 90px rgba(0,0,0,0.58)",
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 18px",
    fontSize: 44,
    fontWeight: 300,
  },
  successIcon: {
    color: "#65f0b4",
    border: "2px solid rgba(101,240,180,0.58)",
    background: "rgba(16,185,129,0.10)",
  },
  errorIcon: {
    color: "#ff6b9d",
    border: "2px solid rgba(255,107,157,0.55)",
    background: "rgba(244,63,94,0.10)",
  },
  title: {
    fontSize: 22,
    fontWeight: 950,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "rgba(226,232,240,0.78)",
    marginBottom: 22,
  },
  button: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  successBtn: {
    border: "1px solid rgba(34,197,94,0.55)",
    background: "linear-gradient(135deg, rgba(16,185,129,0.72), rgba(34,197,94,0.42))",
  },
  errorBtn: {
    border: "1px solid rgba(244,63,94,0.55)",
    background: "linear-gradient(135deg, rgba(244,63,94,0.52), rgba(190,24,93,0.42))",
  },
};

function ProfileRoleTutorial({ open, step, hasSelectedRole, onNext, onFinish }) {
  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      target: "profile-role-grid",
      icon: "🎭",
      title: "Pilih role game kamu",
      text: "Klik salah satu role yang dikotak. Setelah role dipilih, detail skill-nya akan muncul di bagian bawah.",
      actionText: hasSelectedRole ? "Lanjut lihat skill" : "Klik role yang dikotak",
      forceTarget: true,
    },
    {
      target: "profile-skill-preview",
      icon: "✨",
      title: "Baca detail skill role",
      text: "Di sini kamu bisa melihat daftar skill role, jenis aktif/pasif, efek skill, dan tipe soal yang didukung.",
      actionText: "Oke, lanjut simpan",
      forceTarget: false,
    },
    {
      target: "profile-save-button",
      icon: "💾",
      title: "Simpan profil",
      text: "Tombol Simpan Profil dipakai untuk menyimpan email, password, dan role yang dipilih. Kamu tidak dipaksa klik sekarang. Klik Oke, paham dulu, lalu simpan profil jika sudah yakin.",
      actionText: "Oke, paham",
      forceTarget: false,
      finishOnNext: true,
    },
  ];

  const current = steps[Math.min(step, steps.length - 1)];

  useEffect(() => {
    if (!open || !current) return;

    let timer1 = null;
    let timer2 = null;
    let timer3 = null;

    const getScrollableParents = (element) => {
      const parents = [];
      let parent = element?.parentElement;

      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        const canScroll =
          (overflowY === "auto" || overflowY === "scroll") &&
          parent.scrollHeight > parent.clientHeight;

        if (canScroll) {
          parents.push(parent);
        }

        parent = parent.parentElement;
      }

      return parents;
    };

    const scrollTargetIntoView = () => {
      const target = document.querySelector(`[data-tour="${current.target}"]`);

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      const scrollableParents = getScrollableParents(target);

      scrollableParents.forEach((parent) => {
        const targetRect = target.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const targetCenter = targetRect.top + targetRect.height / 2;
        const parentCenter = parentRect.top + parentRect.height / 2;
        const diff = targetCenter - parentCenter;

        parent.scrollTo({
          top: parent.scrollTop + diff,
          behavior: "smooth",
        });
      });
    };

    const readTargetRect = () => {
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

    scrollTargetIntoView();

    timer1 = setTimeout(readTargetRect, 120);
    timer2 = setTimeout(readTargetRect, 460);
    timer3 = setTimeout(readTargetRect, 780);

    window.addEventListener("resize", readTargetRect);
    window.addEventListener("scroll", readTargetRect, true);

    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      window.removeEventListener("resize", readTargetRect);
      window.removeEventListener("scroll", readTargetRect, true);
    };
  }, [open, step, current]);

  if (!open || !current) return null;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const padding = 8;
  const safeRect = targetRect || {
    top: viewportH / 2 - 120,
    left: viewportW / 2 - 240,
    width: 480,
    height: 220,
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
  const bubbleWidth = 330;
  const bubbleHeight = 315;
  const canPlaceRight = holeRight + bubbleWidth + 18 <= viewportW;
  const canPlaceLeft = spotlight.left - bubbleWidth - 18 >= 18;

  let bubbleLeft = isMobile
    ? 18
    : canPlaceRight
      ? holeRight + 18
      : canPlaceLeft
        ? spotlight.left - bubbleWidth - 18
        : Math.max(18, viewportW - bubbleWidth - 18);

  let bubbleTop = Math.min(
    Math.max(spotlight.top, 18),
    viewportH - bubbleHeight - 18,
  );

  if (isMobile) {
    const below = holeBottom + 14;
    const above = spotlight.top - bubbleHeight - 14;
    bubbleTop =
      below + bubbleHeight <= viewportH ? below : above >= 18 ? above : 18;
  }

  return (
    <div style={profileTourStyles.layer}>
      <div
        style={{
          ...profileTourStyles.dimPart,
          top: 0,
          left: 0,
          width: "100%",
          height: spotlight.top,
        }}
      />
      <div
        style={{
          ...profileTourStyles.dimPart,
          top: spotlight.top,
          left: 0,
          width: spotlight.left,
          height: spotlight.height,
        }}
      />
      <div
        style={{
          ...profileTourStyles.dimPart,
          top: spotlight.top,
          left: holeRight,
          width: Math.max(0, viewportW - holeRight),
          height: spotlight.height,
        }}
      />
      <div
        style={{
          ...profileTourStyles.dimPart,
          top: holeBottom,
          left: 0,
          width: "100%",
          height: Math.max(0, viewportH - holeBottom),
        }}
      />

      <div
        style={{
          ...profileTourStyles.spotlight,
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
      />

      {!current.forceTarget ? (
        <div
          style={{
            ...profileTourStyles.spotlightBlocker,
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-hidden="true"
        />
      ) : null}

      <div
        style={{
          ...profileTourStyles.bubble,
          top: bubbleTop,
          left: bubbleLeft,
          width: isMobile ? "calc(100vw - 36px)" : bubbleWidth,
        }}
      >
        <div style={profileTourStyles.bubbleTop}>
          <div style={profileTourStyles.stepBadge}>{Math.min(step + 1, 3)}/3</div>
        </div>

        <div style={profileTourStyles.icon}>{current.icon}</div>
        <div style={profileTourStyles.title}>{current.title}</div>
        <div style={profileTourStyles.text}>{current.text}</div>

        <div style={profileTourStyles.footer}>
          {current.forceTarget ? (
            <div style={profileTourStyles.forceText}>{current.actionText}</div>
          ) : (
            <button
              style={profileTourStyles.primaryBtn}
              onClick={current.finishOnNext ? onFinish || onNext : onNext}
            >
              {current.actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const profileTourStyles = {
  layer: {
    position: "fixed",
    inset: 0,
    zIndex: 22000,
    pointerEvents: "none",
  },
  dimPart: {
    position: "absolute",
    background: "rgba(2, 6, 23, 0.66)",
    backdropFilter: "blur(3px)",
    pointerEvents: "auto",
  },
  spotlight: {
    position: "absolute",
    borderRadius: 20,
    border: "2px solid rgba(60,255,201,0.95)",
    background: "transparent",
    pointerEvents: "none",
    boxShadow: "0 0 34px rgba(60,255,201,0.70)",
    transition: "all 220ms ease",
  },
  spotlightBlocker: {
    position: "absolute",
    border: "none",
    background: "transparent",
    cursor: "default",
    pointerEvents: "auto",
    zIndex: 1,
  },
  bubble: {
    position: "absolute",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "radial-gradient(700px 360px at 50% 0%, rgba(140,86,255,0.32), rgba(10,12,22,0.98) 62%)",
    color: "#eef2ff",
    padding: 18,
    boxShadow: "0 24px 70px rgba(0,0,0,0.50)",
    pointerEvents: "auto",
    zIndex: 2,
    maxHeight: "calc(100vh - 36px)",
    overflowY: "auto",
  },
  bubbleTop: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: 900,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(60,255,201,0.24)",
    background: "rgba(60,255,201,0.10)",
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    marginBottom: 12,
    border: "1px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.09)",
  },
  title: {
    fontSize: 18,
    fontWeight: 950,
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    lineHeight: 1.65,
    opacity: 0.82,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 16,
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
  },
  forceText: {
    padding: "10px 14px",
    borderRadius: 13,
    border: "1px dashed rgba(60,255,201,0.34)",
    background: "rgba(60,255,201,0.08)",
    color: "rgba(235,240,255,0.88)",
    fontSize: 12,
    fontWeight: 900,
  },
};

const styles = {
  header: {
    height: "auto",
    background:
      "radial-gradient(900px 420px at 55% 0%, #0a2a2a 0%, #070a14 55%, #050611 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "sticky",
    top: 0,
    zIndex: 50,
    lineHeight: 1,
  },

  navWrap: {
    width: "100%",
    maxWidth: 1400,
    minHeight: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: "12px 16px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    flexWrap: "wrap",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    minWidth: 210,
    flexShrink: 0,
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(124,92,255,0.18)",
    border: "1px solid rgba(124,92,255,0.25)",
    flexShrink: 0,
  },

  brandText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  brandTitle: {
    color: "#E6ECFF",
    fontWeight: 850,
    fontSize: 18,
    lineHeight: 1,
  },

  brandSub: {
    color: "rgba(230,236,255,0.55)",
    fontSize: 12,
    lineHeight: 1,
  },

  menuWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 7,
    borderRadius: 999,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    flexWrap: "wrap",
    flex: "0 1 auto",
  },

  menuButton: {
    border: "1px solid transparent",
    background: "transparent",
    color: "rgba(230,236,255,0.72)",
    borderRadius: 999,
    padding: "11px 18px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    whiteSpace: "nowrap",
  },

  menuButtonActive: {
    border: "1px solid rgba(60,255,201,0.34)",
    background:
      "linear-gradient(135deg, rgba(60,255,201,0.16), rgba(140,86,255,0.12))",
    color: "#ffffff",
    boxShadow: "0 0 18px rgba(60,255,201,0.10)",
  },

  rightWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    minWidth: 0,
    flexWrap: "wrap",
    flexShrink: 0,
  },

  levelMiniCard: {
    width: 240,
    height: 46,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(60,255,201,0.18)",
    background: "rgba(255,255,255,0.035)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },

  levelBadge: {
    minWidth: 48,
    height: 30,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(60,255,201,0.22)",
    background: "rgba(60,255,201,0.08)",
    color: "#E6ECFF",
    fontSize: 12,
    fontWeight: 900,
    flexShrink: 0,
  },

  levelInfo: {
    flex: 1,
    minWidth: 0,
  },

  levelXpRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
    color: "rgba(230,236,255,0.72)",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
  },

  levelBarOuter: {
    height: 7,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  levelBarInner: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(60,255,201,0.9), rgba(140,86,255,0.9))",
  },

  profileCard: {
    width: 190,
    height: 46,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    flexShrink: 0,
    cursor: "pointer",
    textAlign: "left",
  },

  avatar: {
    background: "rgba(124,92,255,0.28)",
    flexShrink: 0,
  },

  profileText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
    flex: 1,
  },

  profileName: {
    color: "#E6ECFF",
    fontWeight: 750,
    fontSize: 13,
    lineHeight: 1,
    display: "block",
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  profileRole: {
    color: "rgba(230,236,255,0.55)",
    fontSize: 12,
    lineHeight: 1,
  },

  logoutButton: {
    width: 42,
    height: 42,
    padding: 0,
    borderRadius: 999,
    border: "1px solid rgba(255,95,95,0.35)",
    background: "rgba(255,75,75,0.10)",
    color: "#ffb3b3",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 0 18px rgba(255,75,75,0.06)",
  },

  logoutIcon: {
    color: "#ff8f8f",
    fontSize: 15,
  },
};

const modalStyles = {
  header: {
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(60,255,201,0.10)",
    border: "1px solid rgba(60,255,201,0.22)",
    color: "#3cffc9",
    fontSize: 18,
  },

  title: {
    color: "#E6ECFF",
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.2,
  },

  subtitle: {
    color: "rgba(230,236,255,0.58)",
    fontSize: 12,
    marginTop: 4,
  },

  roleLockedBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 12px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.24)",
    color: "#bbf7d0",
    fontSize: 12,
    fontWeight: 800,
  },

  roleWarningBadge: {
    padding: "9px 12px",
    borderRadius: 999,
    background: "rgba(251,191,36,0.12)",
    border: "1px solid rgba(251,191,36,0.24)",
    color: "#fde68a",
    fontSize: 12,
    fontWeight: 800,
  },

  setupIntroCard: {
    margin: "18px 22px 0",
    padding: "16px 18px",
    borderRadius: 20,
    display: "flex",
    gap: 14,
    alignItems: "center",
    border: "1px solid rgba(124,92,255,0.28)",
    background:
      "linear-gradient(135deg, rgba(124,92,255,0.18), rgba(60,255,201,0.08))",
  },

  setupIntroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 25,
    background: "rgba(124,92,255,0.20)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  setupIntroTitle: {
    color: "#f8fafc",
    fontWeight: 950,
    fontSize: 15,
    marginBottom: 4,
  },

  setupIntroText: {
    color: "rgba(226,232,240,0.76)",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.55,
  },

  content: {
    padding: 20,
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 18,
  },

  leftPanel: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    padding: 16,
  },

  rightPanel: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.025)",
    padding: 16,
  },

  sectionTitle: {
    color: "#E6ECFF",
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 14,
  },

  label: {
    color: "rgba(230,236,255,0.82)",
    fontWeight: 700,
  },

  input: {
    borderRadius: 12,
    background: "rgba(10,16,28,0.55)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#E6ECFF",
  },

  infoBox: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    background: "rgba(60,255,201,0.07)",
    border: "1px solid rgba(60,255,201,0.16)",
  },

  infoTitle: {
    color: "#E6ECFF",
    fontWeight: 900,
    fontSize: 13,
    marginBottom: 6,
  },

  infoText: {
    color: "rgba(230,236,255,0.68)",
    fontSize: 12,
    lineHeight: 1.6,
  },

  roleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },

  roleCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    padding: 12,
    cursor: "pointer",
    textAlign: "left",
    minHeight: 118,
    transition: "all 160ms ease",
  },

  roleCardDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },

  roleTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontSize: 22,
  },

  roleName: {
    color: "#E6ECFF",
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 5,
  },

  roleShort: {
    color: "rgba(230,236,255,0.58)",
    fontSize: 11,
    lineHeight: 1.4,
  },

  skillPreview: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,16,28,0.46)",
    padding: 14,
  },

  skillHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  skillRoleIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  skillRoleName: {
    color: "#E6ECFF",
    fontSize: 15,
    fontWeight: 900,
    marginBottom: 4,
  },

  skillRoleDesc: {
    color: "rgba(230,236,255,0.62)",
    fontSize: 12,
  },

  skillList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  skillItem: {
    borderRadius: 14,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 11,
  },

  skillItemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 7,
  },

  skillName: {
    color: "#E6ECFF",
    fontSize: 12,
    fontWeight: 900,
  },

  skillType: {
    fontSize: 10,
    fontWeight: 900,
    padding: "4px 7px",
    borderRadius: 999,
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

  skillDesc: {
    color: "rgba(230,236,255,0.68)",
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 6,
  },

  skillSupport: {
    color: "rgba(230,236,255,0.42)",
    fontSize: 10,
    lineHeight: 1.4,
  },

  emptyRolePreview: {
    marginTop: 14,
    borderRadius: 16,
    border: "1px dashed rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.025)",
    padding: 18,
    color: "rgba(230,236,255,0.58)",
    fontSize: 13,
    textAlign: "center",
  },

  footer: {
    padding: "14px 20px 18px",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    borderRadius: 12,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.8)",
  },

  saveButton: {
    borderRadius: 12,
    fontWeight: 800,
  },
};