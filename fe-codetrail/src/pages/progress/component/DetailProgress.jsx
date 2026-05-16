import React, { useMemo, useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Card,
  Space,
  Avatar,
  Tag,
  Select,
} from "antd";
import { ArrowLeftOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";

// ===== helpers =====
function Pill({ children, bg, color = "#E6ECFF" }) {
  return (
    <Tag
      style={{
        borderRadius: 999,
        paddingInline: 10,
        paddingBlock: 2,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: bg,
        color,
        fontWeight: 700,
        marginInlineEnd: 6,
      }}
    >
      {children}
    </Tag>
  );
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function ProgressBar({ percent, tone = "green" }) {
  const color =
    tone === "green"
      ? "rgba(0,201,167,0.95)"
      : tone === "yellow"
      ? "rgba(255,193,7,0.95)"
      : "rgba(255,82,82,0.95)";

  return (
    <div
      style={{
        height: 10,
        width: "100%",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{ height: "100%", width: `${percent}%`, background: color }}
      />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    complete: {
      label: "COMPLETE",
      bg: "rgba(0,201,167,0.18)",
      color: "#BFF8EB",
    },
    incomplete: {
      label: "INCOMPLETE",
      bg: "rgba(255,82,82,0.18)",
      color: "#FFC7C7",
    },
  };
  const cfg = map[status] || { label: status, bg: "rgba(255,255,255,0.10)" };
  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

function ItemRow({ icon, label, status }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.16)",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
      >
        <span style={{ opacity: 0.8 }}>{icon}</span>
        <Typography.Text style={{ color: "rgba(230,236,255,0.86)" }}>
          {label}
        </Typography.Text>
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function ModuleCard({ m, open, onToggle }) {
  const locked = !!m.locked;

  const tone = locked
    ? "locked"
    : m.percent >= 90
    ? "green"
    : m.percent >= 60
    ? "yellow"
    : "red";

  const percentColor =
    tone === "green"
      ? "rgba(0,201,167,0.95)"
      : tone === "yellow"
      ? "rgba(255,193,7,0.95)"
      : tone === "locked"
      ? "rgba(255,255,255,0.25)"
      : "rgba(255,82,82,0.95)";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.18)",
        padding: 14,
        opacity: locked ? 0.75 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
            {m.title}
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{ display: "block", fontSize: 12 }}
          >
            {m.subtitle}
          </Typography.Text>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: "0 0 auto",
          }}
        >
          {locked ? (
            <Pill bg="rgba(255,82,82,0.18)" color="#FFC7C7">
              🔒 LOCKED
            </Pill>
          ) : (
            <Typography.Text style={{ color: percentColor, fontWeight: 900 }}>
              {m.percent}%
            </Typography.Text>
          )}

          <Button
            type="text"
            disabled={locked}
            onClick={() => !locked && onToggle()}
            icon={
              open ? (
                <UpOutlined style={{ color: "rgba(230,236,255,0.65)" }} />
              ) : (
                <DownOutlined style={{ color: "rgba(230,236,255,0.65)" }} />
              )
            }
          />
        </div>
      </div>

      {/* progress */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            height: 10,
            width: "100%",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${locked ? 100 : m.percent}%`,
              background: locked ? "rgba(255,255,255,0.10)" : percentColor,
            }}
          />
        </div>
      </div>

      {/* expand content */}
      {open && !locked && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {m.items.map((it, idx) => (
            <ItemRow
              key={idx}
              icon={it.icon}
              label={it.label}
              status={it.status}
            />
          ))}
        </div>
      )}

      {/* overlay locked */}
      {locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            background: "rgba(0,0,0,0.22)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

/**
 * Fullscreen modal - Detail Progress Mahasiswa
 * Props:
 * open: boolean
 * onClose: fn
 * student?: { name, nim, kelas, statusText }
 */
export default function DetailProgressMahasiswaModal({
  open,
  onClose,
  student,
}) {
  const [filter, setFilter] = useState("all");
  const [openMap, setOpenMap] = useState({ 3: true });

  const data = useMemo(() => {
    const s = student || {
      name: "Andi Saputra",
      nim: "23010045",
      kelas: "Kelas TI-1A",
      statusText: "Active Student",
    };

    const modules = [
      {
        id: 1,
        title: "Modul 1: Pengenalan Algoritma",
        subtitle: "Selesai pada 12 Okt 2023",
        percent: 100,
        items: [
          {
            icon: "📘",
            label: "Materi: Pengantar Algoritma",
            status: "complete",
          },
          { icon: "🧾", label: "Kuis: Logika Dasar", status: "complete" },
          { icon: "🧩", label: "Puzzle: Flowchart Intro", status: "complete" },
        ],
      },
      {
        id: 2,
        title: "Modul 2: Variabel & Tipe Data",
        subtitle: "Selesai pada 15 Okt 2023",
        percent: 100,
        items: [
          { icon: "📘", label: "Materi: Variabel", status: "complete" },
          { icon: "📘", label: "Materi: Tipe Data", status: "complete" },
          { icon: "🧾", label: "Kuis: Variabel Python", status: "complete" },
        ],
      },
      {
        id: 3,
        title: "Modul 3: Operator & Logika",
        subtitle: "Update terakhir 5 menit lalu",
        percent: 66,
        items: [
          {
            icon: "📘",
            label: "Materi: Operator Aritmatika",
            status: "complete",
          },
          {
            icon: "📘",
            label: "Materi: Operator Logika & Perbandingan",
            status: "complete",
          },
          { icon: "🧾", label: "Kuis: Perhitungan Dasar", status: "complete" },
          { icon: "🧾", label: "Kuis: Tabel Kebenaran", status: "complete" },
          {
            icon: "🧾",
            label: "Kuis: Studi Kasus Logika",
            status: "incomplete",
          },
          {
            icon: "🧩",
            label: "Puzzle: Logic Block Stacking",
            status: "incomplete",
          },
        ],
      },
      {
        id: 4,
        title: "Modul 4: Percabangan (Branching)",
        subtitle: "Terkunci",
        percent: 0,
        locked: true,
        items: [
          { icon: "📘", label: "Materi: If-Else", status: "incomplete" },
          { icon: "🧾", label: "Kuis: Branching Dasar", status: "incomplete" },
        ],
      },
    ];

    const done = modules.filter((m) => m.percent >= 100).length;

    return {
      student: s,
      level: 5,
      levelProgress: 75,
      doneText: `${done}/${modules.length} Selesai`,
      modules,
    };
  }, [student]);

  const visibleModules = useMemo(() => {
    if (filter === "complete")
      return data.modules.filter((m) => m.percent === 100);
    if (filter === "progress")
      return data.modules.filter((m) => m.percent > 0 && m.percent < 100);
    if (filter === "incomplete")
      return data.modules.filter((m) => m.percent === 0);
    return data.modules;
  }, [filter, data.modules]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{ top: 0, paddingBottom: 0 }}
      styles={{
        content: {
          height: "100vh",
          borderRadius: 0,
          padding: 0,
          background: "#0B1220",
        },
        body: { height: "100vh", padding: 0 },
        mask: { background: "rgba(0,0,0,0.65)" },
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <Space>
          <Button
            type="text"
            icon={
              <ArrowLeftOutlined style={{ color: "rgba(230,236,255,0.8)" }} />
            }
            onClick={onClose}
            style={{ color: "rgba(230,236,255,0.88)" }}
          >
            Kembali
          </Button>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}
          >
            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
              Detail Progres Mahasiswa
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {data.student.name} • {data.student.nim}
            </Typography.Text>
          </div>
        </Space>

        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 170, borderRadius: 14 }}
          options={[
            { value: "all", label: "Tampilkan Semua" },
            { value: "complete", label: "Selesai" },
            { value: "progress", label: "Sedang Berjalan" },
            { value: "incomplete", label: "Belum Mulai" },
          ]}
        />
      </div>

      {/* Content */}
      <div
        style={{ height: "calc(100vh - 62px)", overflow: "auto", padding: 18 }}
      >
        {/* TOP ROW: profil kiri + level kanan */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 14,
            marginBottom: 14,
            alignItems: "stretch",
          }}
        >
          {/* Profil kiri */}
          <Card
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            bodyStyle={{ padding: 18 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar
                size={54}
                style={{
                  background: "rgba(58,123,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#E6ECFF",
                  fontWeight: 900,
                }}
              >
                {initials(data.student.name)}
              </Avatar>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Title
                  level={4}
                  style={{ margin: 0, color: "#E6ECFF" }}
                >
                  {data.student.name}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Detail progres pembelajaran mahasiswa
                </Typography.Text>
              </div>

              <div style={{ opacity: 0.22, fontSize: 54, paddingRight: 6 }}>
                👤
              </div>
            </div>
          </Card>

          {/* Level kanan */}
          <Card
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            bodyStyle={{ padding: 18 }}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Level Saat Ini
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{ margin: "6px 0 10px", color: "#E6ECFF" }}
            >
              Lvl. {data.level}
            </Typography.Title>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Progress Level {data.level + 1}
              </Typography.Text>
              <Typography.Text
                style={{ color: "rgba(230,236,255,0.75)", fontSize: 12 }}
              >
                {data.levelProgress}%
              </Typography.Text>
            </div>

            <ProgressBar percent={data.levelProgress} tone="green" />
          </Card>
        </div>

        {/* BOTTOM: progres modul full width */}
        <Card
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* header progres */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Space>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(124,92,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                📌
              </span>
              <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
                Riwayat Progres Modul
              </Typography.Text>
            </Space>

            <Pill bg="rgba(255,255,255,0.06)" color="rgba(230,236,255,0.7)">
              {data.doneText}
            </Pill>
          </div>

          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {visibleModules.map((m) => (
              <ModuleCard
                key={m.id}
                m={m}
                open={!!openMap[m.id]}
                onToggle={() =>
                  setOpenMap((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                }
              />
            ))}
          </div>
        </Card>
      </div>
    </Modal>
  );
}
