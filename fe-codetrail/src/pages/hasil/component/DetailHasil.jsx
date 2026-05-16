import React, { useMemo, useState, useEffect } from "react";
import { Modal, Button, Typography, Card, Space, Avatar, Tag, Input, Segmented } from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

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

function StatusPill({ status }) {
  const map = {
    perfect: { label: "PERFECT", bg: "rgba(0,201,167,0.18)", color: "#BFF8EB" },
    good: { label: "GOOD", bg: "rgba(58,123,255,0.18)", color: "#CFE0FF" },
    ok: { label: "OK", bg: "rgba(255,193,7,0.18)", color: "#FFE8A3" },
    bad: { label: "LOW", bg: "rgba(255,82,82,0.18)", color: "#FFC7C7" },
  };
  const cfg = map[status] || { label: status, bg: "rgba(255,255,255,0.10)" };
  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

function ItemIcon({ type }) {
  const map = {
    quiz: "🧾",
    puzzle: "🧩",
    materi: "📘",
    event: "🎯",
  };
  return <span style={{ opacity: 0.85 }}>{map[type] || "📌"}</span>;
}

function ScoreRow({ item }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "22px 1fr 220px 90px",
        gap: 12,
        alignItems: "center",
        padding: "12px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.16)",
      }}
    >
      <ItemIcon type={item.type} />

      <div style={{ minWidth: 0 }}>
        <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
          {item.title}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
          {item.meta}
        </Typography.Text>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
        {item.badge && <StatusPill status={item.badge} />}
        {item.rightMeta && (
          <Typography.Text style={{ color: "rgba(230,236,255,0.6)", fontSize: 12 }}>
            {item.rightMeta}
          </Typography.Text>
        )}
      </div>

      <Typography.Text style={{ color: "rgba(124,92,255,0.95)", fontWeight: 900, textAlign: "right" }}>
        {item.score} Score
      </Typography.Text>
    </div>
  );
}

function ModuleAccordion({ m, open, onToggle }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "14px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <div style={{ minWidth: 0 }}>
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
            {m.title}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            {m.countText}
          </Typography.Text>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
          <div style={{ textAlign: "right" }}>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Sub-total Score
            </Typography.Text>
            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
              {m.subtotal} Score
            </Typography.Text>
          </div>

          <Button
            type="text"
            icon={open ? <UpOutlined style={{ color: "rgba(230,236,255,0.7)" }} /> : <DownOutlined style={{ color: "rgba(230,236,255,0.7)" }} />}
          />
        </div>
      </div>

      {/* body */}
      {open && (
        <div style={{ padding: 14, paddingTop: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {m.items.map((it) => (
            <ScoreRow key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PreviewScoreMahasiswaModal({ open, onClose, student }) {
  const [tab, setTab] = useState("Modul & Materi");
  const [q, setQ] = useState("");
  const [openMap, setOpenMap] = useState({ 1: true });

  useEffect(() => {
    if (open) {
      setTab("Modul & Materi");
      setQ("");
      setOpenMap({ 1: true });
    }
  }, [open]);

  const data = useMemo(() => {
    const s = {
  name: student?.name ?? student?.nama ?? "Rina Aulia",
  nim: student?.nim ?? student?.NIM ?? "202301045",
  kelas: student?.kelas ?? student?.class ?? "Kelas TI-1A",
  status: "Mahasiswa Aktif",
  badge: "Top 10 Leaderboard",
  totalScore:
    student?.totalScore ??
    student?.score ??
    student?.total_score ??
    12450,
  lastUpdate: "Last update: 2 hours ago",
};


    const modules = [
      {
        id: 1,
        title: "Modul 1: Pengenalan Algoritma",
        countText: "3 item penilaian",
        subtotal: 350,
        items: [
          {
            id: "m1-1",
            type: "quiz",
            title: "Quiz 1: Logika Dasar",
            meta: "COMPLETED • 12 Oct 2023",
            badge: "perfect",
            rightMeta: "100% Akurasi",
            score: 100,
          },
          {
            id: "m1-2",
            type: "puzzle",
            title: "Puzzle 1: Flowchart Builder",
            meta: "COMPLETED • 13 Oct 2023",
            badge: "good",
            rightMeta: "3 Attempts",
            score: 150,
          },
          {
            id: "m1-3",
            type: "quiz",
            title: "Quiz 2: Variabel & Konstanta",
            meta: "COMPLETED • 15 Oct 2023",
            badge: "ok",
            rightMeta: "80% Akurasi",
            score: 100,
          },
        ],
      },
      {
        id: 2,
        title: "Modul 2: Tipe Data & Operator",
        countText: "4 item penilaian",
        subtotal: 420,
        items: [
          { id: "m2-1", type: "materi", title: "Materi: Tipe Data", meta: "COMPLETED", badge: "good", rightMeta: "", score: 120 },
          { id: "m2-2", type: "quiz", title: "Quiz: Operator Aritmatika", meta: "COMPLETED", badge: "ok", rightMeta: "75% Akurasi", score: 100 },
          { id: "m2-3", type: "quiz", title: "Quiz: Operator Logika", meta: "COMPLETED", badge: "good", rightMeta: "90% Akurasi", score: 120 },
          { id: "m2-4", type: "puzzle", title: "Puzzle: Debug Basic", meta: "COMPLETED", badge: "ok", rightMeta: "2 Attempts", score: 80 },
        ],
      },
      {
        id: 3,
        title: "Modul 3: Percabangan (If-Else)",
        countText: "2 item penilaian",
        subtotal: 200,
        items: [
          { id: "m3-1", type: "materi", title: "Materi: If-Else", meta: "COMPLETED", badge: "good", rightMeta: "", score: 100 },
          { id: "m3-2", type: "quiz", title: "Quiz: Branching Dasar", meta: "COMPLETED", badge: "ok", rightMeta: "70% Akurasi", score: 100 },
        ],
      },
      {
        id: 4,
        title: "Modul 4: Perulangan (Looping)",
        countText: "5 item penilaian",
        subtotal: 550,
        items: [
          { id: "m4-1", type: "materi", title: "Materi: For Loop", meta: "COMPLETED", badge: "good", rightMeta: "", score: 150 },
          { id: "m4-2", type: "materi", title: "Materi: While Loop", meta: "COMPLETED", badge: "ok", rightMeta: "", score: 100 },
          { id: "m4-3", type: "quiz", title: "Quiz: Looping Dasar", meta: "COMPLETED", badge: "ok", rightMeta: "78% Akurasi", score: 100 },
          { id: "m4-4", type: "puzzle", title: "Puzzle: Loop Fixer", meta: "COMPLETED", badge: "good", rightMeta: "1 Attempt", score: 120 },
          { id: "m4-5", type: "quiz", title: "Quiz: Nested Loop", meta: "COMPLETED", badge: "bad", rightMeta: "55% Akurasi", score: 80 },
        ],
      },
    ];

    const events = [
      {
        id: "e1",
        title: "Webinar: Pengenalan Data Science",
        meta: "ATTENDED • 16 Oct 2023",
        score: 250,
      },
      {
        id: "e2",
        title: "Workshop: Menguasai Algoritma",
        meta: "ATTENDED • 19 Nov 2023",
        score: 300,
      },
    ];

    return { student: s, modules, events };
  }, [student]);

  const filteredModules = useMemo(() => {
    if (!q) return data.modules;
    const s = q.toLowerCase();
    return data.modules
      .map((m) => ({
        ...m,
        items: m.items.filter(
          (it) =>
            it.title.toLowerCase().includes(s) ||
            (it.meta || "").toLowerCase().includes(s) ||
            String(it.score).includes(s)
        ),
      }))
      .filter((m) => m.title.toLowerCase().includes(s) || m.items.length > 0);
  }, [data.modules, q]);

  const filteredEvents = useMemo(() => {
    if (!q) return data.events;
    const s = q.toLowerCase();
    return data.events.filter(
      (e) => e.title.toLowerCase().includes(s) || (e.meta || "").toLowerCase().includes(s)
    );
  }, [data.events, q]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{ top: 0, paddingBottom: 0 }}
      styles={{
        content: { height: "100vh", borderRadius: 0, padding: 0, background: "#0B1220" },
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
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ color: "rgba(230,236,255,0.8)" }} />}
          onClick={onClose}
          style={{ color: "rgba(230,236,255,0.88)" }}
        >
          Kembali
        </Button>

        <Input
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />}
          placeholder="Cari data..."
          style={{ width: 320, borderRadius: 14 }}
        />
      </div>

      {/* Content */}
      <div style={{ height: "calc(100vh - 62px)", overflow: "auto", padding: 18 }}>
        {/* Header card */}
        <Card
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 14,
          }}
          bodyStyle={{ padding: 18 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar
              size={54}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#E6ECFF",
                fontWeight: 900,
              }}
            >
              {initials(data.student.name)}
            </Avatar>

            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography.Title level={4} style={{ margin: 0, color: "#E6ECFF" }}>
                {data.student.name}
              </Typography.Title>

              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  🪪 {data.student.nim}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  • {data.student.kelas}
                </Typography.Text>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill bg="rgba(0,201,167,0.18)" color="#BFF8EB">
                  {data.student.status}
                </Pill>
                <Pill bg="rgba(124,92,255,0.18)" color="#E6ECFF">
                  {data.student.badge}
                </Pill>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                TOTAL SCORE
              </Typography.Text>
              <Typography.Title level={3} style={{ margin: "4px 0 0", color: "#E6ECFF" }}>
                {Number(data.student.totalScore ?? data.student.score ?? data.student.total_score ?? 0).toLocaleString("en-US")}
                <span style={{ fontSize: 13, color: "rgba(124,92,255,0.95)", marginLeft: 6 }}>
                  Score
                </span>
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {data.student.lastUpdate}
              </Typography.Text>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div style={{ marginBottom: 12 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { label: "Modul & Materi", value: "Modul & Materi" },
              { label: "Riwayat Event", value: "Riwayat Event" },
            ]}
          />
        </div>

        {/* Body */}
        {tab === "Modul & Materi" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredModules.map((m) => (
              <ModuleAccordion
                key={m.id}
                m={m}
                open={!!openMap[m.id]}
                onToggle={() => setOpenMap((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
              />
            ))}
            {filteredModules.length === 0 && (
              <div style={{ color: "rgba(230,236,255,0.6)", padding: 12 }}>
                Tidak ada data modul yang cocok.
              </div>
            )}
          </div>
        ) : (
          <Card
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredEvents.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "22px 1fr 120px",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(0,0,0,0.16)",
                  }}
                >
                  <ItemIcon type="event" />
                  <div style={{ minWidth: 0 }}>
                    <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
                      {e.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                      {e.meta}
                    </Typography.Text>
                  </div>
                  <Typography.Text style={{ color: "rgba(124,92,255,0.95)", fontWeight: 900, textAlign: "right" }}>
                    {e.score} Score
                  </Typography.Text>
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div style={{ color: "rgba(230,236,255,0.6)", padding: 12 }}>
                  Tidak ada event yang cocok.
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
}
