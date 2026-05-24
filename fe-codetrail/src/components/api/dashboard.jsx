import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  let rawToken = localStorage.getItem("token");

  if (rawToken) {
    try {
      rawToken = JSON.parse(rawToken);
    } catch {
      rawToken = rawToken.replace(/^"(.*)"$/, "$1");
    }

    const cleanedToken = String(rawToken)
      .replace(/^Bearer\s+/i, "")
      .trim();

    config.headers.Authorization = `Bearer ${cleanedToken}`;
  }

  return config;
});

export const getDashboardApi = async () => {
  try {
    const response = await api.get("/dashboard");
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil data dashboard.",
          data: {
            stats: {
              total_mahasiswa: 0,
              total_event: 0,
              puzzle_pending: 0,
              rata_rata_nilai: 0,
              total_quiz_selesai: 0,
              total_puzzle_selesai: 0,
              total_materi_selesai: 0,
            },
            weekly_activity: [],
            recent_activity: [],
            top_students: [],
          },
        },
      }
    );
  }
};