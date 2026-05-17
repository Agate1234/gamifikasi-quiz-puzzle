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

export const getSoalApi = async (params) => {
  try {
    const response = await api.get(`/soal?${params.toString()}`);
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
          message: "Gagal mengambil data soal.",
        },
      }
    );
  }
};

export const getSoalByIdApi = async (id) => {
  try {
    const response = await api.get(`/soal/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail soal",
        },
      }
    );
  }
};

export const createSoalApi = async (payload) => {
  try {
    const response = await api.post("/soal", payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal menambah soal.",
        },
      }
    );
  }
};

export const updateSoalApi = async (id, payload) => {
  try {
    const response = await api.put(`/soal/${id}`, payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal mengubah soal.",
        },
      }
    );
  }
};

export const deleteSoalApi = async (id) => {
  try {
    const response = await api.delete(`/soal/${id}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          message: "Gagal menghapus soal.",
        },
      }
    );
  }
};

export const getNextSoalMahasiswaApi = async (idQuiz) => {
  try {
    const response = await api.get(`/roadmap/quiz-map/quiz/${idQuiz}/next`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil soal berikutnya.",
        },
      }
    );
  }
};

export const submitJawabanMahasiswaApi = async (idQuiz, payload) => {
  try {
    const response = await api.post(
      `/roadmap/quiz-map/quiz/${idQuiz}/submit`,
      payload,
    );
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengirim jawaban quiz.",
        },
      }
    );
  }
};

export const enhancedVisionPreviewApi = async (idQuiz, payload) => {
  try {
    const response = await api.post(
      `/roadmap/quiz-map/quiz/${idQuiz}/enhanced-vision`,
      payload,
    );
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal memakai Enhanced Vision.",
        },
      }
    );
  }
};

export const deductionRevealApi = async (idQuiz, payload) => {
  try {
    const response = await api.post(
      `/roadmap/quiz-map/quiz/${idQuiz}/deduction`,
      payload,
    );
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal memakai Deduction.",
        },
      }
    );
  }
};

export const bodyLanguageAnalysisApi = async (idQuiz, payload) => {
  try {
    const response = await api.post(
      `/roadmap/quiz-map/quiz/${idQuiz}/body-language-analysis`,
      payload,
    );
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal memakai Body Language Analysis.",
        },
      }
    );
  }
};

export const prisonerEscapeMethodApi = async (idQuiz, payload) => {
  try {
    const response = await api.post(
      `/roadmap/quiz-map/quiz/${idQuiz}/prisoner-escape-method`,
      payload,
    );
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal memakai Escape Method.",
        },
      }
    );
  }
};