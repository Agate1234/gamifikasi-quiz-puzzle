import React from "react";
import { Modal, Typography, Tag, Divider, Empty, Spin } from "antd";
import {
  AppstoreOutlined,
  CodeOutlined,
  DragOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

function Pill({ children, bg = "rgba(124,92,255,0.18)", color = "#E6ECFF" }) {
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
        marginInlineEnd: 0,
      }}
    >
      {children}
    </Tag>
  );
}

function TypePill({ type }) {
  const map = {
    drag_drop: {
      label: "Drag Drop",
      bg: "rgba(124,92,255,0.18)",
      icon: <DragOutlined />,
    },
    fill_blank: {
      label: "Fill Blank",
      bg: "rgba(58,123,255,0.18)",
      icon: <FileTextOutlined />,
    },
    code: {
      label: "Code",
      bg: "rgba(255,149,0,0.18)",
      icon: <CodeOutlined />,
    },
  };

  const cfg = map[type] || {
    label: type || "-",
    bg: "rgba(255,255,255,0.10)",
    icon: null,
  };

  return (
    <Pill bg={cfg.bg}>
      {cfg.icon} {cfg.label}
    </Pill>
  );
}

function LevelPill({ level }) {
  const map = {
    easy: { label: "Easy", bg: "rgba(0,201,167,0.18)", color: "#BFF8EB" },
    medium: { label: "Medium", bg: "rgba(255,193,7,0.18)", color: "#FFE8A3" },
    hard: { label: "Hard", bg: "rgba(255,82,82,0.18)", color: "#FFC7C7" },
  };

  const cfg = map[level] || {
    label: level || "-",
    bg: "rgba(255,255,255,0.10)",
    color: "#E6ECFF",
  };

  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

function InfoBox({ label, value, children }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        minHeight: 72,
      }}
    >
      <Typography.Text
        style={{
          display: "block",
          color: "rgba(230,236,255,0.52)",
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        {label}
      </Typography.Text>

      {children || (
        <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>
          {value || "-"}
        </Typography.Text>
      )}
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 14,
        borderRadius: 14,
        background: "rgba(10,16,28,0.62)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#E6ECFF",
        fontSize: 12,
        lineHeight: 1.6,
        overflow: "auto",
        whiteSpace: "pre-wrap",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      {children || "-"}
    </pre>
  );
}

function renderJson(value) {
  if (value === null || value === undefined || value === "") return "-";

  try {
    if (typeof value === "string") {
      return JSON.stringify(JSON.parse(value), null, 2);
    }

    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderSpecificPreview(data) {
  const type = data?.tipe_puzzle;

  if (type === "drag_drop") {
    const items = Array.isArray(data?.items) ? data.items : [];

    return (
      <div>
        <Typography.Text
          style={{
            display: "block",
            color: "#E6ECFF",
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          Items Drag Drop
        </Typography.Text>

        {items.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, index) => (
              <div
                key={`${item}-${index}`}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  borderRadius: 14,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(124,92,255,0.16)",
                    color: "#CDBBFF",
                    fontWeight: 900,
                    flex: "0 0 auto",
                  }}
                >
                  {index + 1}
                </div>

                <Typography.Text style={{ color: "#E6ECFF", fontWeight: 600 }}>
                  {String(item)}
                </Typography.Text>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Items belum tersedia" />
        )}
      </div>
    );
  }

  if (type === "fill_blank") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <Typography.Text
            style={{
              display: "block",
              color: "#E6ECFF",
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Template Text
          </Typography.Text>
          <CodeBlock>{data?.template_text}</CodeBlock>
        </div>

        <div>
          <Typography.Text
            style={{
              display: "block",
              color: "#E6ECFF",
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Expected Answers
          </Typography.Text>
          <CodeBlock>{renderJson(data?.expected_answers)}</CodeBlock>
        </div>
      </div>
    );
  }

  if (type === "code") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <InfoBox label="Language" value={data?.language} />
          <InfoBox label="Function Name" value={data?.function_name} />
          <InfoBox label="Time Limit" value={`${data?.time_limit_ms || 1000} ms`} />
          <InfoBox label="Memory Limit" value={`${data?.memory_limit_mb || 128} MB`} />
        </div>

        <div>
          <Typography.Text
            style={{
              display: "block",
              color: "#E6ECFF",
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Starter Code
          </Typography.Text>
          <CodeBlock>{data?.starter_code}</CodeBlock>
        </div>

        <div>
          <Typography.Text
            style={{
              display: "block",
              color: "#E6ECFF",
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Reference Solution
          </Typography.Text>
          <CodeBlock>{data?.reference_solution}</CodeBlock>
        </div>

        <div>
          <Typography.Text
            style={{
              display: "block",
              color: "#E6ECFF",
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Testcases
          </Typography.Text>
          <CodeBlock>{renderJson(data?.testcases)}</CodeBlock>
        </div>
      </div>
    );
  }

  return <Empty description="Preview puzzle tidak tersedia" />;
}

export default function DetailPuzzleModal({
  open,
  onClose,
  data,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      centered
      width={820}
      footer={null}
      closable={false}
      onCancel={onClose}
      styles={{
        mask: {
          background: "rgba(2,6,23,0.72)",
          backdropFilter: "blur(6px)",
        },
        content: {
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(17,24,39,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          boxShadow: "0 20px 70px rgba(0,0,0,0.50)",
          padding: 0,
          overflow: "hidden",
        },
        body: {
          padding: 0,
          background: "transparent",
        },
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "rgba(124,92,255,0.18)",
              border: "1px solid rgba(124,92,255,0.25)",
              color: "#A992FF",
            }}
          >
            <AppstoreOutlined />
          </div>

          <div>
            <Typography.Text
              style={{
                display: "block",
                color: "#E6ECFF",
                fontWeight: 800,
              }}
            >
              Preview Puzzle
            </Typography.Text>

            <Typography.Text style={{ color: "rgba(230,236,255,0.55)" }}>
              Lihat detail puzzle, instruksi, dan konten berdasarkan tipe.
            </Typography.Text>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
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
              minHeight: 280,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Spin />
          </div>
        ) : data ? (
          <>
            <div
              style={{
                borderRadius: 18,
                padding: 16,
                background:
                  "linear-gradient(135deg, rgba(124,92,255,0.16), rgba(58,123,255,0.08))",
                border: "1px solid rgba(124,92,255,0.18)",
              }}
            >
              <Typography.Text
                style={{
                  display: "block",
                  color: "rgba(230,236,255,0.58)",
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                Judul Puzzle
              </Typography.Text>

              <Typography.Title
                level={5}
                style={{
                  margin: 0,
                  color: "#E6ECFF",
                  lineHeight: 1.5,
                }}
              >
                {data?.judul_puzzle || data?.title || "-"}
              </Typography.Title>

              {data?.deskripsi_puzzle || data?.desc ? (
                <Typography.Text
                  style={{
                    display: "block",
                    marginTop: 8,
                    color: "rgba(230,236,255,0.72)",
                    lineHeight: 1.6,
                  }}
                >
                  {data?.deskripsi_puzzle || data?.desc}
                </Typography.Text>
              ) : null}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginTop: 14,
              }}
            >
              <InfoBox label="Tipe Puzzle">
                <TypePill type={data?.tipe_puzzle} />
              </InfoBox>

              <InfoBox label="Kesulitan">
                <LevelPill level={data?.difficulty_puzzle || data?.level} />
              </InfoBox>

              <InfoBox label="Modul" value={data?.judul_modul || data?.module} />

              <InfoBox label="XP Reward" value={`${data?.exp_puzzle ?? data?.xp ?? 0} XP`} />
            </div>

            <Divider style={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <div>
              <Typography.Text
                style={{
                  display: "block",
                  color: "#E6ECFF",
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                Instruksi
              </Typography.Text>

              <div
                style={{
                  borderRadius: 14,
                  padding: 14,
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(230,236,255,0.82)",
                  lineHeight: 1.7,
                }}
              >
                {data?.drag_drop_instruksi ||
                  data?.fill_blank_instruksi ||
                  data?.code_instruksi ||
                  data?.instruksi ||
                  "-"}
              </div>
            </div>

            <Divider style={{ borderColor: "rgba(255,255,255,0.08)" }} />

            {renderSpecificPreview(data)}
          </>
        ) : (
          <Empty description="Detail puzzle tidak ditemukan" />
        )}
      </div>
    </Modal>
  );
}
