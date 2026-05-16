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

export const getQuizApi = async (params) => {
  try {
    const response = await api.get(`/quiz?${params.toString()}`);
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
          message: "Gagal mengambil data quiz.",
        },
      }
    );
  }
};

export const getQuizByIdApi = async (id) => {
  try {
    const response = await api.get(`/quiz/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail quiz",
        },
      }
    );
  }
};

export const createQuizApi = async (payload) => {
  try {
    const response = await api.post("/quiz", payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal menambah quiz.",
        },
      }
    );
  }
};

export const updateQuizApi = async (id, payload) => {
  try {
    const response = await api.put(`/quiz/${id}`, payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal mengubah quiz.",
        },
      }
    );
  }
};

export const deleteQuizApi = async (id) => {
  try {
    const response = await api.delete(`/quiz/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal menghapus quiz.",
        },
      }
    );
  }
};