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

export const getAchievementApi = async (idUser) => {
  try {
    const response = await api.get(`/achievement/${idUser}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: {
            user: null,
            no_badge: [],
            achievements: [],
          },
          message: "Gagal mengambil data achievement.",
        },
      }
    );
  }
};

export const syncAchievementApi = async (idUser) => {
  try {
    const response = await api.post(`/achievement/sync/${idUser}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: {
            current_badges: [],
            new_badges: [],
            stats: null,
          },
          message: "Gagal melakukan sinkronisasi achievement.",
        },
      }
    );
  }
};

export const claimAchievementApi = async (payload = {}) => {
  try {
    const response = await api.post(`/achievement/claim`, payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: {
            user: null,
            no_badge: [],
          },
          message: "Gagal menambahkan badge.",
        },
      }
    );
  }
};