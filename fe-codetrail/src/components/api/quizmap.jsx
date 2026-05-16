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

export const getMapQuizApi = async (params) => {
  try {
    const response = await api.get(`/roadmap/quiz-map?${params.toString()}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: [],
          message: "Gagal mengambil data map quiz.",
        },
      }
    );
  }
};

export const getMapQuizByIdApi = async (id, params = null) => {
  try {
    const queryString =
      params && typeof params.toString === "function" && params.toString()
        ? `?${params.toString()}`
        : "";

    const response = await api.get(`/roadmap/quiz-map/${id}${queryString}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail map quiz.",
        },
      }
    );
  }
};