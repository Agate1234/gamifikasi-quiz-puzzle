import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  Button,
  Typography,
  Card,
  Avatar,
  Tag,
  Input,
  Segmented,
  Spin,
  Empty,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { getDetailHasilMahasiswaApi } from "../../../components/api/hasilmahassiwa";

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
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function StatusPill({ status }) {
  const map = {
    perfect: { label: "PERFECT", bg: "rgba(0,201,167,0.18)", color: "#BFF8EB" },
    good: { label: "GOOD", bg: "rgba(58,123,255,0.18)", color: "#CFE0FF" },
    ok: { label: "OK", bg: "rgba(255,193,7,0.18)", color: "#FFE8A3" },
    bad: { label: "LOW", bg: "rgba(255,82,82,0.18)", color: "#FFC7C7" },
  };

  const cfg = map[status] || { label: status || "-", bg: "rgba(255,255,255,0.10)" };

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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        {item.badge && <StatusPill status={item.badge} />}
        {item.rightMeta && (
          <Typography.Text style={{ color: "rgba(230,236,255,0.6)", fontSize: 12 }}>
            {item.rightMeta}
          </Typography.Text>
        )}
      </div>

      <Typography.Text
        style={{
          color: "rgba(124,92,255,0.95)",
          fontWeight: 900,
          textAlign: "right",
        }}
      >
        {Number(item.score || 0).toLocaleString("en-US")} Score
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: "0 0 auto",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Sub-total Score
            </Typography.Text>
            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
              {Number(m.subtotal || 0).toLocaleString("en-US")} Score
            </Typography.Text>
          </div>

          <Button
            type="text"
            icon={
              open ? (
                <UpOutlined style={{ color: "rgba(230,236,255,0.7)" }} />
              ) : (
                <DownOutlined style={{ color: "rgba(230,236,255,0.7)" }} />
              )
            }
          />
        </div>
      </div>

      {open && (
        <div
          style={{
            padding: 14,
            paddingTop: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {(m.items || []).length > 0 ? (
            m.items.map((it) => <ScoreRow key={it.id} item={it} />)
          ) : (
            <Empty description="Belum ada item hasil" />
          )}
        </div>
      )}
    </div>
  );
}

export default function PreviewScoreMahasiswaModal({ open, onClose, student }) {
  const [tab, setTab] = useState("Modul & Materi");
  const [q, setQ] = useState("");
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const idUser = student?.id_user || student?.id;

  useEffect(() => {
    if (!open) return;

    setTab("Modul & Materi");
    setQ("");
    setOpenMap({});

    if (!idUser) return;

    let mounted = true;

    const fetchDetail = async () => {
      setLoading(true);

      const response = await getDetailHasilMahasiswaApi(idUser);

      if (!mounted) return;

      if (
        response.status >= 200 &&
        response.status < 300 &&
        response.data?.success !== false
      ) {
        const payload = response.data?.data || null;
        setDetail(payload);

        const firstModule = payload?.modules?.[0];
        if (firstModule?.id) {
          setOpenMap({ [firstModule.id]: true });
        }
      } else {
        setDetail(null);
        message.error(response.data?.message || "Gagal mengambil detail hasil mahasiswa.");
      }

      setLoading(false);
    };

    fetchDetail();

    return () => {
      mounted = false;
    };
  }, [open, idUser]);

  const data = useMemo(() => {
    const fallbackStudent = {
      name: student?.name ?? student?.nama ?? student?.nama_user ?? "Mahasiswa",
      nim: student?.nim ?? student?.NIM ?? "-",
      kelas: student?.kelas ?? student?.class ?? "-",
      status: "Mahasiswa Aktif",
      badge: `Level ${student?.level || 1}`,
      totalScore:
        student?.totalScore ??
        student?.score ??
        student?.total_score ??
        student?.xp ??
        0,
      lastUpdate: "Last update: realtime",
    };

    if (!detail) {
      return {
        student: fallbackStudent,
        modules: [],
        events: [],
      };
    }

    return {
      student: {
        ...fallbackStudent,
        ...(detail.student || {}),
      },
      modules: detail.modules || [],
      events: detail.events || [],
    };
  }, [detail, student]);

  const filteredModules = useMemo(() => {
    if (!q) return data.modules;

    const s = q.toLowerCase();

    return data.modules
      .map((m) => ({
        ...m,
        items: (m.items || []).filter(
          (it) =>
            String(it.title || "").toLowerCase().includes(s) ||
            String(it.meta || "").toLowerCase().includes(s) ||
            String(it.score || "").includes(s),
        ),
      }))
      .filter(
        (m) =>
          String(m.title || "").toLowerCase().includes(s) ||
          (m.items || []).length > 0,
      );
  }, [data.modules, q]);

  const filteredEvents = useMemo(() => {
    if (!q) return data.events;

    const s = q.toLowerCase();

    return data.events.filter(
      (e) =>
        String(e.title || "").toLowerCase().includes(s) ||
        String(e.meta || "").toLowerCase().includes(s),
    );
  }, [data.events, q]);

  const totalScore =
    data.student.totalScore ??
    data.student.total_score ??
    data.student.score ??
    data.student.xp ??
    0;

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

      <div style={{ height: "calc(100vh - 62px)", overflow: "auto", padding: 18 }}>
        <Spin spinning={loading}>
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
                    {data.student.status || "Mahasiswa Aktif"}
                  </Pill>
                  <Pill bg="rgba(124,92,255,0.18)" color="#E6ECFF">
                    {data.student.badge || `Level ${data.student.level || 1}`}
                  </Pill>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  TOTAL SCORE
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: "4px 0 0", color: "#E6ECFF" }}>
                  {Number(totalScore || 0).toLocaleString("en-US")}
                  <span
                    style={{
                      fontSize: 13,
                      color: "rgba(124,92,255,0.95)",
                      marginLeft: 6,
                    }}
                  >
                    Score
                  </span>
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {data.student.lastUpdate || "Last update: realtime"}
                </Typography.Text>
              </div>
            </div>
          </Card>

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

          {tab === "Modul & Materi" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredModules.map((m) => (
                <ModuleAccordion
                  key={m.id}
                  m={m}
                  open={!!openMap[m.id]}
                  onToggle={() =>
                    setOpenMap((prev) => ({
                      ...prev,
                      [m.id]: !prev[m.id],
                    }))
                  }
                />
              ))}

              {filteredModules.length === 0 && (
                <Empty description="Tidak ada data modul yang cocok." />
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
                      <Typography.Text
                        type="secondary"
                        style={{ display: "block", fontSize: 12 }}
                      >
                        {e.meta}
                      </Typography.Text>
                    </div>
                    <Typography.Text
                      style={{
                        color: "rgba(124,92,255,0.95)",
                        fontWeight: 900,
                        textAlign: "right",
                      }}
                    >
                      {Number(e.score || 0).toLocaleString("en-US")} Score
                    </Typography.Text>
                  </div>
                ))}

                {filteredEvents.length === 0 && (
                  <Empty description="Tidak ada event yang cocok." />
                )}
              </div>
            </Card>
          )}
        </Spin>
      </div>
    </Modal>
  );
}