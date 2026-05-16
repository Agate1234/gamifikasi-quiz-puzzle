import React from "react";
import { Typography } from "antd";

export default function LayoutLogo() {
  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Imzaqi LMS
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Admin / Dosen / Mahasiswa
      </Typography.Text>
    </div>
  );
}
