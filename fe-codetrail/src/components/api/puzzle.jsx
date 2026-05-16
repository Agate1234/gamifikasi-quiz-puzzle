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

export const getPuzzlesApi = async (params) => {
  try {
    const response = await api.get(`/puzzle?${params.toString()}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          data: [],
          total: 0,
          paging: {
            page: 1,
            limit: 10,
            total: 0,
            page_total: 1,
          },
          message: "Gagal mengambil data puzzle.",
        },
      }
    );
  }
};

export const getPuzzleByIdApi = async (id) => {
  try {
    const response = await api.get(`/puzzle/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail puzzle",
        },
      }
    );
  }
};

export const createPuzzleApi = async (payload) => {
  try {
    const response = await api.post("/puzzle", payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal menambah puzzle.",
        },
      }
    );
  }
};

export const updatePuzzleApi = async (id, payload) => {
  try {
    const response = await api.put(`/puzzle/${id}`, payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal mengubah puzzle.",
        },
      }
    );
  }
};

export const deletePuzzleApi = async (id) => {
  try {
    const response = await api.delete(`/puzzle/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal menghapus puzzle.",
        },
      }
    );
  }
};