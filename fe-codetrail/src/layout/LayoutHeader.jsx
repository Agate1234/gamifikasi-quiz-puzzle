import React from "react";
import { Layout } from "antd";

const { Header } = Layout;

export default function LayoutHeader() {
  return (
    <Header
      style={{
        background: "#0B1220",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: 0,
        height: 45,
        minHeight: 32,
        lineHeight: "32px",
      }}
    />
  );
}