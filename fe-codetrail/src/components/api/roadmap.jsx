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

export const getMapModulApi = async (params) => {
  try {
    const response = await api.get(`/roadmap?${params.toString()}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: [],
          message: "Gagal mengambil data roadmap modul.",
        },
      }
    );
  }
};