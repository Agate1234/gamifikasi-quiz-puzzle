import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const getUserByIdApi = (idUser) => {
  return axios.get(`${API_URL}/users/${idUser}`, {
    headers: authHeaders(),
  });
};

export const updateUserApi = (idUser, payload) => {
  return axios.put(`${API_URL}/users/${idUser}`, payload, {
    headers: authHeaders(),
  });
};