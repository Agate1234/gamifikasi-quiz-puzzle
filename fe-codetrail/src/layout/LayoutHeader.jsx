import React from "react";
import { Layout, Typography, Input, Space, Badge } from "antd";
import { BellOutlined, SearchOutlined } from "@ant-design/icons";

const { Header } = Layout;

export default function LayoutHeader() {
  return (
    <Header
      style={{
        background: "#0B1220",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingInline: 20,
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800, fontSize: 16 }}>
          Dashboard Overview
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Selamat datang, mari gamifikasi pembelajaran hari ini!
        </Typography.Text>
      </div>

      <Space size={12}>
        <Input
          prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />}
          placeholder="Cari mahasiswa atau modul..."
          style={{
            width: 320,
            borderRadius: 14,
          }}
        />
        <Badge dot>
          <BellOutlined style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", cursor: "pointer" }} />
        </Badge>
      </Space>
    </Header>
  );
}
