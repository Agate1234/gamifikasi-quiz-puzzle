import React, { useMemo, useState, useEffect } from "react";
import { Modal, Button, Typography, Tag, Space, Card, Input } from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  CheckCircleFilled,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

function DifficultyPill({ difficulty }) {
  const map = {
    easy: { label: "Easy", bg: "rgba(0,201,167,0.18)", color: "#7CFFE1" },
    medium: { label: "Medium", bg: "rgba(255,193,7,0.18)", color: "#FFE8A3" },
    hard: { label: "Hard", bg: "rgba(255,77,79,0.18)", color: "#FFB3B5" },
  };

  const cfg = map[difficulty] || {
    label: difficulty || "-",
    bg: "rgba(255,255,255,0.10)",
    color: "#E6ECFF",
  };

  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

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

function TypePill({ type }) {
  const map = {
    mcq: { label: "Pilihan Ganda", bg: "rgba(124,92,255,0.18)" },
    checkbox: { label: "Checkbox", bg: "rgba(58,123,255,0.18)" },
    tf: { label: "True / False", bg: "rgba(255,149,0,0.18)" },
  };
  const cfg = map[type] || { label: type, bg: "rgba(255,255,255,0.10)" };
  return <Pill bg={cfg.bg}>{cfg.label}</Pill>;
}

function MCQOptionRow({ label, text, correct }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: correct ? "rgba(0,201,167,0.12)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.18)",
          color: "rgba(230,236,255,0.85)",
          fontWeight: 800,
          fontSize: 12,
          flex: "0 0 auto",
        }}
      >
        {label}
      </div>

      <Typography.Text style={{ color: "rgba(230,236,255,0.88)" }}>
        {text}
      </Typography.Text>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {correct && (
          <>
            <CheckCircleFilled style={{ color: "rgb(0,201,167)" }} />
            <Typography.Text
              style={{
                color: "rgba(0,201,167,0.95)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              BENAR
            </Typography.Text>
          </>
        )}
      </div>
    </div>
  );
}

function CheckboxOptionRow({ text, correct }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: correct ? "rgba(0,201,167,0.12)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.18)",
          background: correct ? "rgba(0,201,167,0.35)" : "rgba(0,0,0,0.18)",
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
        }}
      >
        {correct ? (
          <CheckCircleFilled
            style={{ fontSize: 14, color: "rgb(0,201,167)" }}
          />
        ) : null}
      </div>

      <Typography.Text style={{ color: "rgba(230,236,255,0.88)" }}>
        {text}
      </Typography.Text>

      <div style={{ marginLeft: "auto" }}>
        {correct && (
          <Typography.Text
            style={{
              color: "rgba(0,201,167,0.95)",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            BENAR
          </Typography.Text>
        )}
      </div>
    </div>
  );
}

function TFOptionRow({ text, correct }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: correct ? "rgba(0,201,167,0.12)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.18)",
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: correct ? "rgb(0,201,167)" : "transparent",
          }}
        />
      </div>

      <Typography.Text style={{ color: "rgba(230,236,255,0.88)" }}>
        {text}
      </Typography.Text>

      <div style={{ marginLeft: "auto" }}>
        {correct && (
          <Typography.Text
            style={{
              color: "rgba(0,201,167,0.95)",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            BENAR
          </Typography.Text>
        )}
      </div>
    </div>
  );
}

export default function PreviewQuizHardcore({ open, onClose, quiz }) {
  const [pageIdx, setPageIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setPageIdx(0);
    }
  }, [open, quiz?.id]);

  const data = useMemo(() => {
    return {
      title: quiz?.title || "-",
      module: quiz?.module || "-",
      xp: quiz?.exp ?? 0,
      totalQuestion: quiz?.totalQuestion ?? quiz?.questions?.length ?? 0,
      desc: quiz?.desc || "-",
      questions: quiz?.questions || [],
    };
  }, [quiz]);

  const filteredQuestions = useMemo(() => {
    return data.questions || [];
  }, [data.questions]);

  useEffect(() => {
    if (pageIdx > Math.max(0, filteredQuestions.length - 1)) {
      setPageIdx(0);
    }
  }, [filteredQuestions.length, pageIdx]);

  const current = filteredQuestions[pageIdx];
  const canPrev = pageIdx > 0;
  const canNext = pageIdx < filteredQuestions.length - 1;

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
          borderBottom: "none",
          background: "transparent",
        }}
      >
        <Button
          type="text"
          icon={
            <ArrowLeftOutlined style={{ color: "rgba(230,236,255,0.8)" }} />
          }
          onClick={onClose}
          style={{ color: "rgba(230,236,255,0.88)" }}
        >
          Kembali ke Daftar Kuis
        </Button>
      </div>

      <div
        style={{ height: "calc(100vh - 62px)", overflow: "auto", padding: 18 }}
      >
        <Card
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 14,
          }}
          bodyStyle={{ padding: 18 }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Pill bg="rgba(255,193,7,0.14)" color="#FFE8A3">
                  ⚡ {data.xp} XP
                </Pill>
              </div>

              <Typography.Title
                level={3}
                style={{ margin: "10px 0 6px", color: "#E6ECFF" }}
              >
                {data.title}
              </Typography.Title>

              <Typography.Text
                style={{ color: "rgba(230,236,255,0.72)", display: "block" }}
              >
                <span style={{ marginRight: 8 }}>📚</span>
                Modul:{" "}
                <b style={{ color: "rgba(230,236,255,0.88)" }}>{data.module}</b>
              </Typography.Text>

              <Typography.Paragraph
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "rgba(230,236,255,0.65)",
                }}
              >
                {data.desc}
              </Typography.Paragraph>
            </div>

            <div
              style={{
                width: 170,
                borderRadius: 16,
                padding: 14,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Typography.Text
                style={{
                  color: "rgba(230,236,255,0.65)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                }}
              >
                TOTAL SOAL
              </Typography.Text>
              <Typography.Title
                level={2}
                style={{ margin: "6px 0 0", color: "#E6ECFF" }}
              >
                {data.totalQuestion}
              </Typography.Title>
            </div>
          </div>
        </Card>

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
                🧾
              </span>
              <Typography.Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
                Daftar Soal & Jawaban
              </Typography.Text>
            </Space>

            <Typography.Text
              style={{ color: "rgba(230,236,255,0.55)", fontSize: 12 }}
            >
              Menampilkan {filteredQuestions.length} soal
            </Typography.Text>
          </div>

          <div style={{ padding: 16 }}>
            {!current ? (
              <div style={{ padding: 18, color: "rgba(230,236,255,0.6)" }}>
                Tidak ada soal untuk quiz ini.
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(0,0,0,0.18)",
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <Typography.Text
                      style={{
                        color: "rgba(230,236,255,0.55)",
                        fontSize: 12,
                        fontWeight: 800,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      {String(pageIdx + 1).padStart(2, "0")} /{" "}
                      {String(filteredQuestions.length).padStart(2, "0")}
                    </Typography.Text>

                    <Typography.Text
                      style={{ color: "#E6ECFF", fontWeight: 800 }}
                    >
                      {current.question}
                    </Typography.Text>
                  </div>

                  <Space size={8} wrap>
                    <TypePill type={current.type} />
                    <DifficultyPill difficulty={current.difficulty} />
                  </Space>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {current.type === "mcq" &&
                    (current.options || []).map((op, idx) => (
                      <MCQOptionRow
                        key={op.id || idx}
                        label={op.label || String.fromCharCode(65 + idx)}
                        text={op.text}
                        correct={op.correct}
                      />
                    ))}

                  {current.type === "checkbox" &&
                    (current.options || []).map((op, idx) => (
                      <CheckboxOptionRow
                        key={op.id || idx}
                        text={op.text}
                        correct={op.correct}
                      />
                    ))}

                  {current.type === "tf" &&
                    (current.options || []).map((op, idx) => (
                      <TFOptionRow
                        key={op.id || idx}
                        text={op.text}
                        correct={op.correct}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(230,236,255,0.55)",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>
              Menampilkan {filteredQuestions.length === 0 ? 0 : pageIdx + 1}{" "}
              dari {filteredQuestions.length} soal
            </span>

            <Space>
              <Button
                size="small"
                icon={<LeftOutlined />}
                disabled={!canPrev}
                onClick={() => setPageIdx((x) => Math.max(0, x - 1))}
              >
                Prev
              </Button>
              <Button
                size="small"
                icon={<RightOutlined />}
                disabled={!canNext}
                onClick={() =>
                  setPageIdx((x) =>
                    Math.min(filteredQuestions.length - 1, x + 1),
                  )
                }
              >
                Next
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
