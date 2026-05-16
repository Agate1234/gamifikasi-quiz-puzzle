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
  TrophyOutlined,
  FileOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

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

  const fileApiUrl = materiData?.id_materi
    ? `http://localhost:5000/api/materi/${materiData.id_materi}/file`
    : null;

  const tipeFile = (materiData?.tipe_file || "").toLowerCase();
  const fileName = String(materiData?.file_materi || "").toLowerCase();

  const isVideo =
    tipeFile.includes("video") ||
    tipeFile.includes("mp4") ||
    fileName.endsWith(".mp4");

  const isPdf = tipeFile.includes("pdf") || fileName.endsWith(".pdf");

  const hasPreviewFile = Boolean(
    materiData?.file_materi && materiData?.id_materi,
  );
  const hasExternalLink = Boolean(materiData?.link);

  const fileTypeLabel = isVideo
    ? "Video"
    : isPdf
      ? "PDF"
      : hasPreviewFile
        ? "File"
        : hasExternalLink
          ? "Link"
          : "-";

  const fileTypeIcon = isVideo ? (
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
              value={materiData?.file_materi || "-"}
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
            Preview File
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
          {hasPreviewFile && isVideo ? (
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
                    Materi ini belum memiliki file atau link untuk dipreview.
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