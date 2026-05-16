import React from "react";
import { Layout } from "antd";
import LayoutSidebar from "./LayoutSidebar.jsx";
import LayoutHeader from "./LayoutHeader.jsx";
import LayoutNavbar from "./LayoutNavbar.jsx";

const { Content } = Layout;

function getRole(session) {
  const localRole = localStorage.getItem("role");

  const role =
    localRole ||
    session?.user?.kd_role ||
    session?.user?.nama_role ||
    session?.user?.role ||
    session?.kd_role ||
    session?.nama_role ||
    session?.role ||
    "";

  const roleText = String(role).toLowerCase();

  const idRole =
    Number(localRole) ||
    Number(session?.user?.id_role) ||
    Number(session?.id_role) ||
    Number(session?.role_id) ||
    Number(session?.user?.role_id);

  if (roleText.includes("mahasiswa")) return "mahasiswa";
  if (roleText.includes("dosen")) return "dosen";
  if (roleText.includes("admin")) return "admin";

  if (Number(idRole) === 3) return "mahasiswa";
  if (Number(idRole) === 2) return "dosen";
  if (Number(idRole) === 1) return "admin";

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
