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

export const getHasilMahasiswaApi = async (params) => {
  try {
    const query =
      params instanceof URLSearchParams
        ? params
        : new URLSearchParams(params);

    const response = await api.get(`/hasil-mahasiswa?${query.toString()}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: [],
          total: 0,
          paging: {
            page: 1,
            limit: 10,
            total: 0,
            page_total: 1,
          },
          message: "Gagal mengambil data hasil mahasiswa.",
        },
      }
    );
  }
};

export const getDetailHasilMahasiswaApi = async (idUser) => {
  try {
    const response = await api.get(`/hasil-mahasiswa/${idUser}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail hasil mahasiswa.",
        },
      }
    );
  }
};