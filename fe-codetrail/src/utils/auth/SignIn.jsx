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

const clearPlainUserStorage = () => {
  ["email", "id_user", "nama_user", "role", "game_role"].forEach((key) =>
    localStorage.removeItem(key),
  );
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

    clearPlainUserStorage();
    clearQuizRuntimeStorage();

    localStorage.setItem("token", token || "");

    response.data.auth = true;
    localStorage.setItem("session", encryptData(response?.data));

    setEncryptedLocal("ct_email", user.email || values?.email || "");
    setEncryptedLocal("ct_id_user", user.id_user || "");
    setEncryptedLocal("ct_nama_user", user.nama_user || "");
    setEncryptedLocal("ct_role", user.id_role || "");
    setEncryptedLocal("ct_game_role", user.game_role || "");

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
