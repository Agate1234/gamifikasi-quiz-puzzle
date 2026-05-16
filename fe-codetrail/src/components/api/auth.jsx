import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (payload) => {
  try {
    const response = await api.post("/auth/login", payload);
    return response;
  } catch (error) {
    return error.response || {
      status: 500,
      data: {
        message: "Terjadi kesalahan pada server.",
      },
    };
  }
};