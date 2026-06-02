import React from "react";
import {
  Modal,
  Typography,
  Space,
  Row,
  Col,
  Card,
  Empty,
  Button,
  Tag,
} from "antd";
import {
  BookOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
  LinkOutlined,
  FileOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

function renderInlineMarkdown(text = "") {
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          style={{
            padding: "2px 6px",
            borderRadius: 6,
            background: "rgba(124,92,255,0.18)",
            color: "#E6ECFF",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function MarkdownPreview({ value }) {
  const markdown = String(value || "").trim();

  if (!markdown) {
    return (
      <Empty
        description={
          <span style={{ color: "rgba(255,255,255,0.65)" }}>
            Markdown materi belum tersedia.
          </span>
        }
      />
    );
  }

  const lines = markdown.split("\n");
  const elements = [];
  let listBuffer = [];
  let orderedListBuffer = [];
  let codeBuffer = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ marginTop: 0, paddingLeft: 24 }}>
          {listBuffer.map((item, index) => (
            <li key={index}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      listBuffer = [];
    }

    if (orderedListBuffer.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} style={{ marginTop: 0, paddingLeft: 24 }}>
          {orderedListBuffer.map((item, index) => (
            <li key={index}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      );
      orderedListBuffer = [];
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      elements.push(
        <pre
          key={`code-${elements.length}`}
          style={{
            margin: "10px 0",
            padding: 14,
            borderRadius: 14,
            overflowX: "auto",
            background: "rgba(0,0,0,0.34)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#E6ECFF",
          }}
        >
          <code>{codeBuffer.join("\n")}</code>
        </pre>,
      );
      codeBuffer = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushList();

      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }

      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) {
      flushList();
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      orderedListBuffer = [];
      listBuffer.push(unorderedMatch[1]);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      listBuffer = [];
      orderedListBuffer.push(orderedMatch[1]);
      return;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${elements.length}`} style={{ color: "#F5F7FF", margin: "12px 0 8px" }}>
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${elements.length}`} style={{ color: "#F5F7FF", margin: "14px 0 8px" }}>
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${elements.length}`} style={{ color: "#F5F7FF", margin: "14px 0 8px" }}>
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
        </h1>,
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          style={{
            margin: "10px 0",
            padding: "10px 14px",
            borderLeft: "3px solid rgba(124,92,255,0.9)",
            background: "rgba(124,92,255,0.10)",
            color: "rgba(230,236,255,0.84)",
          }}
        >
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
        </blockquote>,
      );
      return;
    }

    elements.push(
      <p key={`p-${elements.length}`} style={{ color: "rgba(230,236,255,0.82)", margin: "8px 0", lineHeight: 1.7 }}>
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  });

  flushList();
  flushCode();

  return <div>{elements}</div>;
}

function MiniInfoCard({ icon, label, value }) {
  return (
    <Card
      bordered={false}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        height: "100%",
        boxShadow: "none",
      }}
      bodyStyle={{ padding: 14 }}
    >
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Space size={8}>
          <span style={{ color: "#8b6cff", fontSize: 14 }}>{icon}</span>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
            {label}
          </Text>
        </Space>
        <Text
          style={{
            color: "#E6ECFF",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.3,
            wordBreak: "break-word",
          }}
        >
          {value || "-"}
        </Text>
      </Space>
    </Card>
  );
}

export default function DetailMateriModal({ open, onClose, materiData }) {
  if (!materiData) return null;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
  const markdownMateri = String(materiData?.markdown_materi || "").trim();
  const hasMarkdown = markdownMateri.length > 0;

  const fileApiUrl = materiData?.id_materi
    ? `${API_BASE_URL}/materi/${materiData.id_materi}/file`
    : null;

  const tipeFile = (materiData?.tipe_file || "").toLowerCase();
  const fileName = String(materiData?.file_materi || "").toLowerCase();

  const isVideo =
    tipeFile.includes("video") ||
    tipeFile.includes("mp4") ||
    fileName.endsWith(".mp4");

  const isPdf = tipeFile.includes("pdf") || fileName.endsWith(".pdf");

  const hasPreviewFile = Boolean(
    !hasMarkdown && materiData?.file_materi && materiData?.id_materi,
  );
  const hasExternalLink = Boolean(!hasMarkdown && materiData?.link);

  const fileTypeLabel = hasMarkdown
    ? "Markdown"
    : isVideo
      ? "Video"
      : isPdf
        ? "PDF"
        : hasPreviewFile
          ? "File"
          : hasExternalLink
            ? "Link"
            : "-";

  const fileTypeIcon = hasMarkdown ? (
    <FileTextOutlined />
  ) : isVideo ? (
    <PlayCircleOutlined />
  ) : isPdf ? (
    <FilePdfOutlined />
  ) : hasExternalLink ? (
    <LinkOutlined />
  ) : (
    <FileOutlined />
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      centered
      closable={false}
      styles={{
        content: {
          background: "#1f1f1f",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        },
        body: {
          padding: 0,
        },
      }}
    >
      <div style={{ padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <Space align="start" size={12}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(124,92,255,0.16)",
                border: "1px solid rgba(124,92,255,0.25)",
                color: "#9b87ff",
                flexShrink: 0,
              }}
            >
              <EyeOutlined />
            </div>

            <div>
              <Text
                style={{
                  display: "block",
                  color: "#F5F7FF",
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: 1.2,
                }}
              >
                Preview Materi
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                }}
              >
                Detail konten materi ini
              </Text>
            </div>
          </Space>

          <Button
            type="text"
            onClick={onClose}
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 18,
              paddingInline: 8,
            }}
          >
            ×
          </Button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <Title
                level={3}
                style={{
                  margin: 0,
                  color: "#F5F7FF",
                  fontSize: 34,
                  lineHeight: 1.1,
                }}
              >
                {materiData?.judul_materi || "-"}
              </Title>

              <Paragraph
                style={{
                  margin: "8px 0 0 0",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 14,
                }}
              >
                {materiData?.deskripsi_materi || "Tidak ada deskripsi materi."}
              </Paragraph>
            </div>

            <Tag
              style={{
                margin: 0,
                borderRadius: 999,
                padding: "6px 12px",
                background: "rgba(23,201,100,0.12)",
                border: "1px solid rgba(23,201,100,0.25)",
                color: "#9EF0B8",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {materiData?.exp_materi || 0} EXP
            </Tag>
          </div>
        </div>

        <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
          <Col xs={24} md={8}>
            <MiniInfoCard
              icon={<BookOutlined />}
              label="Modul Terkait"
              value={materiData?.judul_modul || "-"}
            />
          </Col>
          <Col xs={24} md={8}>
            <MiniInfoCard
              icon={fileTypeIcon}
              label="Tipe Materi"
              value={fileTypeLabel}
            />
          </Col>
          <Col xs={24} md={8}>
            <MiniInfoCard
              icon={<FolderOpenOutlined />}
              label="Nama File"
              value={hasMarkdown ? "-" : materiData?.file_materi || "-"}
            />
          </Col>
        </Row>

        <div
          style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              color: "#F5F7FF",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {hasMarkdown ? "Preview Markdown" : "Preview File"}
          </Text>

          <Space wrap>
            {hasExternalLink && (
              <Button
                icon={<LinkOutlined />}
                href={materiData.link}
                target="_blank"
                style={{
                  borderRadius: 12,
                  background: "transparent",
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "#E6ECFF",
                }}
              >
                Buka Link
              </Button>
            )}

            {hasPreviewFile && (
              <Button
                type="primary"
                icon={<FolderOpenOutlined />}
                href={fileApiUrl}
                target="_blank"
                style={{
                  borderRadius: 12,
                  background: "#7c5cff",
                  borderColor: "#7c5cff",
                  boxShadow: "none",
                }}
              >
                Buka File
              </Button>
            )}
          </Space>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 12,
            minHeight: 360,
          }}
        >
          {hasMarkdown ? (
            <div
              style={{
                minHeight: 320,
                maxHeight: 520,
                overflow: "auto",
                padding: 12,
              }}
            >
              <MarkdownPreview value={markdownMateri} />
            </div>
          ) : hasPreviewFile && isVideo ? (
            <video
              controls
              preload="metadata"
              crossOrigin="anonymous"
              src={fileApiUrl}
              style={{
                width: "100%",
                borderRadius: 14,
                background: "#000",
                maxHeight: 440,
              }}
            />
          ) : hasPreviewFile && isPdf ? (
            <iframe
              src={fileApiUrl}
              title="Preview PDF Materi"
              style={{
                width: "100%",
                height: 460,
                border: "none",
                borderRadius: 14,
                background: "#fff",
              }}
            />
          ) : hasPreviewFile ? (
            <div
              style={{
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Empty
                description={
                  <span style={{ color: "rgba(255,255,255,0.65)" }}>
                    Preview file belum tersedia untuk tipe ini.
                  </span>
                }
              >
                <Button
                  type="primary"
                  icon={<FolderOpenOutlined />}
                  href={fileApiUrl}
                  target="_blank"
                  style={{ borderRadius: 12 }}
                >
                  Download / Buka File
                </Button>
              </Empty>
            </div>
          ) : hasExternalLink ? (
            <iframe
              src={materiData.link}
              title="Preview Link Materi"
              style={{
                width: "100%",
                height: 460,
                border: "none",
                borderRadius: 14,
                background: "#fff",
              }}
            />
          ) : (
            <div
              style={{
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Empty
                description={
                  <span style={{ color: "rgba(255,255,255,0.65)" }}>
                    Materi ini belum memiliki markdown, file, atau link untuk dipreview.
                  </span>
                }
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 18,
          }}
        >
          <Button
            onClick={onClose}
            style={{
              borderRadius: 12,
              background: "transparent",
              borderColor: "rgba(255,255,255,0.14)",
              color: "#E6ECFF",
            }}
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
