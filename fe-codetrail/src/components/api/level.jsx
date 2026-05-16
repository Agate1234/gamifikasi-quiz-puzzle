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

export const getUserLevelApi = async (idUser) => {
  try {
    const response = await api.get(`/level/${idUser}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: {
            user: null,
            level_info: {
              level: 1,
              total_exp: 0,
              current_level_exp: 0,
              required_exp: 100,
              remaining_exp: 100,
              next_level: 2,
              progress_percent: 0,
            },
          },
          message: "Gagal mengambil data level.",
        },
      }
    );
  }
};