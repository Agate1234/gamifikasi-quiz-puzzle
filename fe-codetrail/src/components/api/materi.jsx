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

export const getMateriApi = async (params) => {
  try {
    const response = await api.get(`/materi?${params.toString()}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: [],
          paging: {
            page: 1,
            limit: 10,
            total: 0,
            page_total: 1,
          },
          message: "Gagal mengambil data materi.",
        },
      }
    );
  }
};

export const getMateriByIdApi = async (id) => {
  try {
    const response = await api.get(`/materi/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail materi.",
        },
      }
    );
  }
};

export const createMateriApi = async (payload) => {
  try {
    const isFormData = payload instanceof FormData;

    const response = await api.post("/materi", payload, {
      headers: isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    });

    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal menambah materi.",
        },
      }
    );
  }
};

export const updateMateriApi = async (id, payload) => {
  try {
    const isFormData = payload instanceof FormData;

    const response = await api.put(`/materi/${id}`, payload, {
      headers: isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    });

    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengubah materi.",
        },
      }
    );
  }
};

export const deleteMateriApi = async (id) => {
  try {
    const response = await api.delete(`/materi/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal menghapus materi.",
        },
      }
    );
  }
};