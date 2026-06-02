import React from "react";
import { Modal, Typography, Tag, Avatar, Spin, Empty } from "antd";
import {
  UserOutlined,
  MailOutlined,
  TeamOutlined,
  TrophyOutlined,
  StarOutlined,
  IdcardOutlined,
} from "@ant-design/icons";

function initials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function RolePill({ role }) {
  const normalized = String(role || "").toLowerCase();

  const map = {
    dosen: {
      label: "Dosen",
      bg: "rgba(58,123,255,0.18)",
      color: "#CFE0FF",
    },
    mahasiswa: {
      label: "Mahasiswa",
      bg: "rgba(0,201,167,0.18)",
      color: "#BFF8EB",
    },
    admin: {
      label: "Admin",
      bg: "rgba(124,92,255,0.18)",
      color: "#E6ECFF",
    },
    superadmin: {
      label: "Super Admin",
      bg: "rgba(124,92,255,0.18)",
      color: "#E6ECFF",
    },
  };

  const cfg = map[normalized] || {
    label: role || "-",
    bg: "rgba(255,255,255,0.08)",
    color: "#E6ECFF",
  };

  return (
    <Tag
      style={{
        borderRadius: 999,
        paddingInline: 12,
        paddingBlock: 3,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
      }}
    >
      {cfg.label}
    </Tag>
  );
}

function InfoBox({ icon, label, value, children }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        minHeight: 76,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "rgba(124,92,255,0.95)" }}>{icon}</span>
        <Typography.Text
          style={{
            display: "block",
            color: "rgba(230,236,255,0.52)",
            fontSize: 12,
          }}
        >
          {label}
        </Typography.Text>
      </div>

      <div style={{ marginTop: 7 }}>
        {children || (
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
            {value || "-"}
          </Typography.Text>
        )}
      </div>
    </div>
  );
}

export default function DetailUserModal({
  open,
  onClose,
  userData,
  loading = false,
}) {
  const name = userData?.nama_user || userData?.name || "-";
  const role = userData?.nama_role || userData?.role || "-";

  return (
    <Modal
      open={open}
      footer={null}
      centered
      width={720}
      closable={false}
      maskClosable
      keyboard
      onCancel={onClose}
      styles={{
        mask: {
          background: "rgba(2,6,23,0.72)",
          backdropFilter: "blur(6px)",
        },
        content: {
          padding: 0,
          borderRadius: 18,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(20,30,46,0.98) 0%, rgba(18,27,42,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        },
        body: {
          padding: 0,
          background: "transparent",
        },
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "rgba(124,92,255,0.18)",
              border: "1px solid rgba(124,92,255,0.25)",
              color: "#7C5CFF",
            }}
          >
            <UserOutlined />
          </div>

          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
            Detail User
          </Typography.Text>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.75)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ padding: 18 }}>
        {loading ? (
          <div
            style={{
              minHeight: 260,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Spin />
          </div>
        ) : userData ? (
          <>
            <div
              style={{
                borderRadius: 18,
                padding: 16,
                background:
                  "linear-gradient(135deg, rgba(124,92,255,0.16), rgba(58,123,255,0.08))",
                border: "1px solid rgba(124,92,255,0.18)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <Avatar
                size={58}
                style={{
                  background: "rgba(124,92,255,0.22)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#E6ECFF",
                  fontWeight: 900,
                  fontSize: 20,
                }}
              >
                {initials(name)}
              </Avatar>

              <div style={{ minWidth: 0, flex: 1 }}>
                <Typography.Title
                  level={4}
                  style={{
                    margin: 0,
                    color: "#E6ECFF",
                    lineHeight: 1.3,
                  }}
                >
                  {name}
                </Typography.Title>

                <div style={{ marginTop: 8 }}>
                  <RolePill role={role} />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginTop: 14,
              }}
            >
              <InfoBox
                icon={<IdcardOutlined />}
                label="ID User"
                value={userData.id_user || userData.id}
              />

              <InfoBox icon={<TeamOutlined />} label="Role">
                <RolePill role={role} />
              </InfoBox>

              <InfoBox
                icon={<MailOutlined />}
                label="Email"
                value={userData.email}
              />

              <InfoBox
                icon={<UserOutlined />}
                label="Game Role"
                value={userData.game_role || "Belum memilih"}
              />

              <InfoBox
                icon={<StarOutlined />}
                label="Level"
                value={userData.level ?? 1}
              />

              <InfoBox
                icon={<TrophyOutlined />}
                label="EXP"
                value={Number(userData.exp || 0).toLocaleString("en-US")}
              />
            </div>
          </>
        ) : (
          <Empty description="Detail user tidak ditemukan" />
        )}
      </div>
    </Modal>
  );
}