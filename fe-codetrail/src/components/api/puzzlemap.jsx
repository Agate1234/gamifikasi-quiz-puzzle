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

export const getMapPuzzleApi = async (params) => {
  try {
    const queryString =
      params && typeof params.toString === "function" && params.toString()
        ? `?${params.toString()}`
        : "";

    const response = await api.get(`/roadmap/puzzle-map${queryString}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          data: [],
          message: "Gagal mengambil data map puzzle.",
        },
      }
    );
  }
};

export const getMapPuzzleByIdApi = async (id, params = null) => {
  try {
    const queryString =
      params && typeof params.toString === "function" && params.toString()
        ? `?${params.toString()}`
        : "";

    const response = await api.get(`/roadmap/puzzle-map/${id}${queryString}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail map puzzle.",
        },
      }
    );
  }
};

export const updatePuzzleAttemptApi = async (
  idProgressPuzzle,
  payload = {},
) => {
  try {
    const response = await api.patch(
      `/roadmap/puzzle-map/${idProgressPuzzle}/attempt`,
      payload,
    );

    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal memperbarui attempt puzzle.",
        },
      }
    );
  }
};

export const runCodeApi = async (payload = {}) => {
  try {
    const response = await api.post("/code-runner/run", payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal menjalankan code runner.",
        },
      }
    );
  }
};

export const savePuzzleProgressApi = async (
  idProgressPuzzle,
  payload = {},
) => {
  try {
    const response = await api.patch(
      `/roadmap/puzzle-map/${idProgressPuzzle}/save-progress`,
      payload,
    );

    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal menyimpan progress puzzle.",
        },
      }
    );
  }
};