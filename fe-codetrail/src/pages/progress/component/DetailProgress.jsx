import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Card,
  Space,
  Avatar,
  Tag,
  Select,
  Spin,
  Empty,
  message,
} from "antd";
import { ArrowLeftOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { getDetailProgressMahasiswaApi } from "../../../components/api/progressmahasiswa";

const DONE_STATUSES = ["done", "selesai"];

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
        style={{
          height: "100%",
          width: `${percent}%`,
          background: color,
        }}
      />
    </div>
  );
}

function normalizeStatus(status) {
  const normalized = String(status || "not done").toLowerCase();
  return DONE_STATUSES.includes(normalized) ? "complete" : "incomplete";
}

function StatusPill({ status }) {
  const normalized = normalizeStatus(status);

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

  const cfg = map[normalized] || {
    label: status,
    bg: "rgba(255,255,255,0.10)",
  };

  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

function itemIcon(type) {
  if (type === "materi") return "📘";
  if (type === "quiz") return "🧾";
  if (type === "puzzle") return "🧩";
  return "📌";
}

function getModuleLevel(module) {
  return module?.level || module?.id_modul || module?.id || "-";
}

function ItemRow({ item }) {
  const meta = [];

  if (item.type === "quiz" && item.score !== null && item.score !== undefined) {
    meta.push(`Score: ${item.score}`);
  }

  if (item.waktu !== null && item.waktu !== undefined) {
    meta.push(`Waktu: ${item.waktu}s`);
  }

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
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
        }}
      >
        <span style={{ opacity: 0.8 }}>{itemIcon(item.type)}</span>

        <div style={{ minWidth: 0 }}>
          <Typography.Text style={{ color: "rgba(230,236,255,0.86)" }}>
            {item.type?.toUpperCase?.() || "ITEM"}: {item.title || "-"}
          </Typography.Text>

          {meta.length > 0 && (
            <Typography.Text
              type="secondary"
              style={{ display: "block", fontSize: 11 }}
            >
              {meta.join(" • ")}
            </Typography.Text>
          )}
        </div>
      </div>

      <StatusPill status={item.status} />
    </div>
  );
}

function ModuleCard({ m, open, onToggle }) {
  const locked = !!m.locked;
  const percent = Number(m.percent || 0);

  const tone = locked
    ? "locked"
    : percent >= 90
      ? "green"
      : percent >= 60
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
            Modul {getModuleLevel(m)}: {m.title}
          </Typography.Text>

          <Typography.Text
            type="secondary"
            style={{ display: "block", fontSize: 12 }}
          >
            {m.subtitle} • {m.done_items || 0}/{m.total_items || 0} aktivitas
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
              {percent}%
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
              width: `${locked ? 100 : percent}%`,
              background: locked ? "rgba(255,255,255,0.10)" : percentColor,
            }}
          />
        </div>
      </div>

      {open && !locked && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {(m.items || []).length > 0 ? (
            m.items.map((item, idx) => (
              <ItemRow key={`${item.type}-${item.id}-${idx}`} item={item} />
            ))
          ) : (
            <Typography.Text type="secondary">
              Belum ada aktivitas pada modul ini.
            </Typography.Text>
          )}
        </div>
      )}

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

export default function DetailProgressMahasiswaModal({
  open,
  onClose,
  student,
}) {
  const [filter, setFilter] = useState("all");
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const idUser = student?.id_user || student?.id;

  useEffect(() => {
    if (!open || !idUser) return;

    let mounted = true;

    const fetchDetail = async () => {
      setLoading(true);

      const response = await getDetailProgressMahasiswaApi(idUser);

      if (!mounted) return;

      if (
        response.status >= 200 &&
        response.status < 300 &&
        response.data?.success !== false
      ) {
        const payload = response.data?.data || null;
        setDetail(payload);

        const firstProgress = (payload?.modules || []).find(
          (item) => !item.locked && Number(item.percent || 0) < 100,
        );

        const firstDone = (payload?.modules || []).find((item) => !item.locked);

        const defaultOpen =
          firstProgress?.id_modul ||
          firstProgress?.id ||
          firstDone?.id_modul ||
          firstDone?.id;

        setOpenMap(defaultOpen ? { [defaultOpen]: true } : {});
      } else {
        message.error(
          response.data?.message || "Gagal mengambil detail progress mahasiswa.",
        );
        setDetail(null);
      }

      setLoading(false);
    };

    fetchDetail();

    return () => {
      mounted = false;
    };
  }, [open, idUser]);

  const data = useMemo(() => {
    const fallbackStudent = student || {
      name: "Mahasiswa",
      nim: "-",
      kelas: "-",
    };

    if (!detail) {
      return {
        student: fallbackStudent,
        currentModuleLevel: "-",
        levelProgress: 0,
        doneText: "0/0 Selesai",
        modules: [],
      };
    }

    const s = detail.student || fallbackStudent;
    const summary = detail.summary || {};
    const modules = detail.modules || [];

    const activeModule =
      modules.find(
        (m) =>
          !m.locked &&
          Number(m.percent || 0) > 0 &&
          Number(m.percent || 0) < 100,
      ) ||
      modules.find((m) => !m.locked && Number(m.percent || 0) < 100) ||
      [...modules]
        .reverse()
        .find((m) => !m.locked && Number(m.percent || 0) >= 100) ||
      modules.find((m) => !m.locked) ||
      modules[0];

    return {
      student: s,
      currentModuleLevel: getModuleLevel(activeModule),
      levelProgress: Number(summary.overall_percent || 0),
      doneText:
        summary.done_text ||
        `${summary.done_modules || 0}/${summary.total_modules || 0} Selesai`,
      modules,
    };
  }, [detail, student]);

  const visibleModules = useMemo(() => {
    if (filter === "complete") {
      return data.modules.filter((m) => Number(m.percent || 0) >= 100);
    }

    if (filter === "progress") {
      return data.modules.filter(
        (m) =>
          !m.locked &&
          Number(m.percent || 0) > 0 &&
          Number(m.percent || 0) < 100,
      );
    }

    if (filter === "incomplete") {
      return data.modules.filter((m) => m.locked || Number(m.percent || 0) === 0);
    }

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

          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
            Detail Progres Mahasiswa
          </Typography.Text>
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

      <div
        style={{
          height: "calc(100vh - 62px)",
          overflow: "auto",
          padding: 18,
        }}
      >
        <Spin spinning={loading}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 320px",
              gap: 14,
              marginBottom: 14,
              alignItems: "stretch",
            }}
          >
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
                </div>

                <div style={{ opacity: 0.22, fontSize: 54, paddingRight: 6 }}>
                  👤
                </div>
              </div>
            </Card>

            <Card
              style={{
                borderRadius: 18,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              bodyStyle={{ padding: 18 }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Progress Keseluruhan
              </Typography.Text>

              <Typography.Title
                level={2}
                style={{ margin: "6px 0 10px", color: "#E6ECFF" }}
              >
                {data.levelProgress}%
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
                  Lvl. {data.currentModuleLevel}
                </Typography.Text>

                <Typography.Text
                  style={{ color: "rgba(230,236,255,0.75)", fontSize: 12 }}
                >
                  {data.doneText}
                </Typography.Text>
              </div>

              <ProgressBar
                percent={data.levelProgress}
                tone={
                  data.levelProgress >= 65
                    ? "green"
                    : data.levelProgress >= 40
                      ? "yellow"
                      : "red"
                }
              />
            </Card>
          </div>

          <Card
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            bodyStyle={{ padding: 0 }}
          >
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
              {visibleModules.length > 0 ? (
                visibleModules.map((m) => (
                  <ModuleCard
                    key={m.id_modul || m.id}
                    m={m}
                    open={!!openMap[m.id_modul || m.id]}
                    onToggle={() =>
                      setOpenMap((prev) => ({
                        ...prev,
                        [m.id_modul || m.id]: !prev[m.id_modul || m.id],
                      }))
                    }
                  />
                ))
              ) : (
                <Empty description="Data progress belum tersedia" />
              )}
            </div>
          </Card>
        </Spin>
      </div>
    </Modal>
  );
}