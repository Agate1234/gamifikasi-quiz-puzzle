import { login } from "../../components/api/auth";
import { encryptData } from "../../components/global/Formatter";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

const handleSignIn = async (values) => {
  const response = await login(values);

  if (response?.status === 200) {
    const token = response?.data?.token;
    const user = response?.data?.data;

    localStorage.setItem("token", token);

    localStorage.setItem("id_user", user.id_user);
    localStorage.setItem("nama_user", user.nama_user);
    localStorage.setItem("role", user.id_role);

    response.data.auth = true;
    localStorage.setItem("session", encryptData(response?.data));

    NotifToast({
      type: "success",
      message: "Login berhasil",
    });

    if (user.id_role === Number(import.meta.env.VITE_ROLE_VENDOR)) {
      window.location.replace("/dashboard/home-vendor");
    } else {
      window.location.replace("/dashboard/home");
    }
  } else {
    NotifAlert({
      icon: "error",
      title: "Gagal",
      message: response?.data?.message || "Terjadi kesalahan saat login.",
    });
  }
};
export default handleSignIn;