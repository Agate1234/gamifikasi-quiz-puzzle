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

const normalizeRole = (item) => {
  const roleName = String(item?.nama_role || item?.kd_role || "").toLowerCase();

  if (Number(item?.id_role) === 3 || roleName.includes("mahasiswa")) {
    return "mahasiswa";
  }

  if (Number(item?.id_role) === 2 || roleName.includes("dosen")) {
    return "dosen";
  }

  if (Number(item?.id_role) === 1 || roleName.includes("admin")) {
    return "admin";
  }

  return roleName || "-";
};

const normalizeUser = (item) => {
  return {
    ...item,
    id: item.id_user,
    name: item.nama_user || item.nama || item.email || `User ${item.id_user}`,
    email: item.email || "-",
    role: normalizeRole(item),
  };
};

export const getUsersApi = async (params) => {
  try {
    const query =
      params instanceof URLSearchParams
        ? params
        : new URLSearchParams(params || {});

    const q = String(query.get("q") || "").toLowerCase();
    const role = String(query.get("role") || "").toLowerCase();
    const page = Number(query.get("page") || 1);
    const limit = Number(query.get("limit") || 10);

    const response = await api.get("/users");

    const rawData = Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    let filtered = rawData.map(normalizeUser);

    if (q) {
      filtered = filtered.filter((item) => {
        return (
          String(item.name || "").toLowerCase().includes(q) ||
          String(item.email || "").toLowerCase().includes(q) ||
          String(item.id_user || "").toLowerCase().includes(q)
        );
      });
    }

    if (role) {
      filtered = filtered.filter(
        (item) => String(item.role || "").toLowerCase() === role,
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      status: response.status,
      data: {
        success: true,
        data: filtered.slice(start, end),
        total,
        paging: {
          page,
          limit,
          total,
          page_total: Math.max(1, Math.ceil(total / limit)),
        },
      },
    };
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
          message: "Gagal mengambil data user.",
        },
      }
    );
  }
};

export const getUserByIdApi = async (idUser) => {
  try {
    const response = await api.get(`/users/${idUser}`);

    return {
      ...response,
      data: {
        ...response.data,
        data: response.data?.data ? normalizeUser(response.data.data) : null,
      },
    };
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengambil detail user.",
        },
      }
    );
  }
};

export const createUserApi = async (payload) => {
  try {
    const response = await api.post("/users", payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal menambahkan user.",
        },
      }
    );
  }
};

export const updateUserApi = async (idUser, payload) => {
  try {
    const response = await api.put(`/users/${idUser}`, payload);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal mengubah user.",
        },
      }
    );
  }
};

export const deleteUserApi = async (idUser) => {
  try {
    const response = await api.delete(`/users/${idUser}`);
    return response;
  } catch (error) {
    return (
      error.response || {
        status: 500,
        data: {
          success: false,
          message: "Gagal menghapus user.",
        },
      }
    );
  }
};