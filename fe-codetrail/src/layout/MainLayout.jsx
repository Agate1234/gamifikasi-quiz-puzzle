import React from "react";
import { Layout } from "antd";
import LayoutSidebar from "./LayoutSidebar.jsx";
import LayoutHeader from "./LayoutHeader.jsx";
import LayoutNavbar from "./LayoutNavbar.jsx";

const { Content } = Layout;

const decodeLocalValue = (raw) => {
  try {
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    try {
      return JSON.parse(atob(raw));
    } catch {
      return null;
    }
  }
};

const getEncryptedLocal = (key, fallback = "") => {
  const decoded = decodeLocalValue(localStorage.getItem(key));
  return decoded ?? fallback;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function getRole(session) {
  const encryptedRole = getEncryptedLocal("ct_role", "");
  const plainRole = localStorage.getItem("role") || "";

  const roleText = String(
    session?.data?.nama_role ||
      session?.data?.kd_role ||
      session?.data?.role ||
      session?.user?.nama_role ||
      session?.user?.kd_role ||
      session?.user?.role ||
      session?.nama_role ||
      session?.kd_role ||
      session?.role ||
      "",
  ).toLowerCase();

  const idRole =
    toNumber(encryptedRole) ||
    toNumber(plainRole) ||
    toNumber(session?.data?.id_role) ||
    toNumber(session?.data?.role_id) ||
    toNumber(session?.user?.id_role) ||
    toNumber(session?.user?.role_id) ||
    toNumber(session?.id_role) ||
    toNumber(session?.role_id);

  if (roleText.includes("mahasiswa") || roleText.includes("mhs")) {
    return "mahasiswa";
  }

  if (roleText.includes("dosen")) return "dosen";
  if (roleText.includes("admin")) return "admin";

  if (idRole === 3) return "mahasiswa";
  if (idRole === 2) return "dosen";
  if (idRole === 1) return "admin";

  return "guest";
}

export default function MainLayout({ children, session }) {
  const role = getRole(session);
  const isMahasiswa = role === "mahasiswa";

  if (isMahasiswa) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#0B1220" }}>
        <LayoutNavbar session={session} />

        <Content
          style={{
            padding: 0,
            background: "#0B1220",
            minHeight: "calc(100vh - 72px)",
          }}
        >
          {children}
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#0B1220" }}>
      <LayoutSidebar session={session} />

      <Layout style={{ background: "#0B1220" }}>
        <LayoutHeader session={session} />

        <Content style={{ padding: 20, background: "#0B1220" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
