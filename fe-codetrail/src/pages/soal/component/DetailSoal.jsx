import React from "react";
import {
  Modal,
  Typography,
  Tag,
  Divider,
  Empty,
  Spin,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
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
      }}
    >
      {children}
    </Tag>
  );
}

function TypePill({ type }) {
  const map = {
    checkbox: { label: "Checkbox", bg: "rgba(58,123,255,0.18)" },
    pilgan: { label: "Pilihan Ganda", bg: "rgba(124,92,255,0.18)" },
    true_false: { label: "True / False", bg: "rgba(255,149,0,0.18)" },
  };

  const cfg = map[type] || {
    label: type || "-",
    bg: "rgba(255,255,255,0.10)",
  };

  return <Pill bg={cfg.bg}>{cfg.label}</Pill>;
}

function DiffPill({ diff }) {
  const map = {
    easy: {
      label: "Easy",
      bg: "rgba(0,201,167,0.18)",
      color: "#BFF8EB",
    },
    medium: {
      label: "Medium",
      bg: "rgba(255,193,7,0.18)",
      color: "#FFE8A3",
    },
    hard: {
      label: "Hard",
      bg: "rgba(255,82,82,0.18)",
      color: "#FFC7C7",
    },
  };

  const cfg = map[diff] || {
    label: diff || "-",
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

export default function DetailSoalModal({
  open,
  onClose,
  data,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      centered
      width={760}
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
            <EyeOutlined />
          </div>

          <div>
            <Typography.Text
              style={{
                display: "block",
                color: "#E6ECFF",
                fontWeight: 800,
              }}
            >
              Detail Soal
            </Typography.Text>

            <Typography.Text style={{ color: "rgba(230,236,255,0.55)" }}>
              Lihat pertanyaan, tipe, kesulitan, quiz, dan jawaban benar.
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
                Pertanyaan
              </Typography.Text>

              <Typography.Title
                level={5}
                style={{
                  margin: 0,
                  color: "#E6ECFF",
                  lineHeight: 1.5,
                }}
              >
                {data.question || data.soal || "-"}
              </Typography.Title>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginTop: 14,
              }}
            >
              <InfoBox label="Tipe Soal">
                <TypePill type={data.type || data.tipe_soal} />
              </InfoBox>

              <InfoBox label="Kesulitan">
                <DiffPill diff={data.difficulty} />
              </InfoBox>

              <InfoBox
                label="Quiz"
                value={data.quizTitle || data.judul_quiz || "-"}
              />

              <InfoBox
                label="Modul"
                value={data.module || data.judul_modul || "-"}
              />
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
                Daftar Jawaban
              </Typography.Text>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.jawaban?.length ? (
                  data.jawaban.map((item, index) => (
                    <div
                      key={item.id_jawaban || index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        borderRadius: 14,
                        padding: "12px 14px",
                        background: item.is_true
                          ? "rgba(0,201,167,0.12)"
                          : "rgba(255,255,255,0.035)",
                        border: item.is_true
                          ? "1px solid rgba(0,201,167,0.22)"
                          : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 10,
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(230,236,255,0.8)",
                            fontWeight: 900,
                            flex: "0 0 auto",
                          }}
                        >
                          {index + 1}
                        </div>

                        <Typography.Text
                          style={{
                            color: "#E6ECFF",
                            fontWeight: item.is_true ? 800 : 600,
                          }}
                        >
                          {item.jawaban_soal || "-"}
                        </Typography.Text>
                      </div>

                      {item.is_true ? (
                        <Pill bg="rgba(0,201,167,0.18)" color="#BFF8EB">
                          <CheckOutlined /> Benar
                        </Pill>
                      ) : (
                        <Pill bg="rgba(255,82,82,0.12)" color="#FFC7C7">
                          <CloseOutlined /> Salah
                        </Pill>
                      )}
                    </div>
                  ))
                ) : (
                  <Empty description="Jawaban belum tersedia" />
                )}
              </div>
            </div>
          </>
        ) : (
          <Empty description="Detail soal tidak ditemukan" />
        )}
      </div>
    </Modal>
  );
}