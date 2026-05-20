import { login } from "../../components/api/auth";
import { encryptData } from "../../components/global/Formatter";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

const encodeLocalValue = (value) => {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
  } catch {
    return "";
  }
};

const setEncryptedLocal = (key, value) => {
  const encoded = encodeLocalValue(value);

  if (!encoded) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, encoded);
};

const clearOldEncryptedUserStorage = () => {
  [
    "ct_email",
    "ct_id_user",
    "ct_nama_user",
    "ct_game_role",
  ].forEach((key) => localStorage.removeItem(key));
};

const clearQuizRuntimeStorage = () => {
  Object.keys(localStorage)
    .filter(
      (key) =>
        key.startsWith("codetrail_quiz_session_") ||
        key.startsWith("codetrail_active_quiz_session") ||
        key.startsWith("codetrail_completed_quiz_result_") ||
        key.startsWith("codetrail_timeout_result"),
    )
    .forEach((key) => localStorage.removeItem(key));
};

const getDashboardPathByRole = (idRole) => {
  const roleNumber = Number(idRole);

  if (roleNumber === 3) return "/dashboard/roadmap";

  return "/dashboard/home";
};

const handleSignIn = async (values) => {
  const response = await login(values);

  if (response?.status === 200) {
    const token = response?.data?.token;
    const user = response?.data?.data || {};

    clearOldEncryptedUserStorage();
    clearQuizRuntimeStorage();

    localStorage.setItem("token", token || "");

    // Field ini sengaja plaintext lagi supaya file lama seperti Navbar/Profile
    // tetap bisa membaca user aktif tanpa error "User Tidak Ditemukan".
    localStorage.setItem("id_user", user.id_user || "");
    localStorage.setItem("nama_user", user.nama_user || "");
    localStorage.setItem("email", user.email || values?.email || "");
    localStorage.setItem("game_role", user.game_role || "");

    // Hanya id_role yang disamarkan/encoded.
    localStorage.removeItem("role");
    setEncryptedLocal("ct_role", user.id_role || "");

    response.data.auth = true;
    localStorage.setItem("session", encryptData(response?.data));

    NotifToast({
      type: "success",
      message: "Login berhasil",
    });

    window.location.replace(getDashboardPathByRole(user.id_role));
    return;
  }

  NotifAlert({
    icon: "error",
    title: "Gagal",
    message: response?.data?.message || "Terjadi kesalahan saat login.",
  });
};

export default handleSignIn;
