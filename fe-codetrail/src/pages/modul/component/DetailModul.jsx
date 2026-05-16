import React, { useEffect, useState } from "react";
import { Modal, Typography, Row, Col, Card, List, Button, Collapse } from "antd";
import {
  BookOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
  QuestionCircleOutlined,
  ToolOutlined,
  DownOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

function StatBox({ icon, value, label }) {
  return (
    <Card
      style={{
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      styles={{ body: { padding: 14 } }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "rgba(124,92,255,0.14)",
            border: "1px solid rgba(124,92,255,0.22)",
            color: "#7C5CFF",
          }}
        >
          {icon}
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ color: "#E6ECFF", fontWeight: 900, fontSize: 18 }}>{value}</div>
          <Text type="secondary" style={{ fontSize: 11, letterSpacing: 0.6 }}>
            {label.toUpperCase()}
          </Text>
        </div>
      </div>
    </Card>
  );
}

function ExpBadge({ point, label = "Poin" }) {
  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: "#B7F7D8",
        background: "rgba(52, 211, 153, 0.16)",
        border: "1px solid rgba(52, 211, 153, 0.28)",
        whiteSpace: "nowrap",
      }}
    >
      {Number(point || 0)} {label}
    </span>
  );
}

function ItemRow({ icon, title, meta, right }) {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "rgba(124,92,255,0.12)",
            border: "1px solid rgba(124,92,255,0.2)",
            color: "#7C5CFF",
            flex: "0 0 auto",
          }}
        >
          {icon}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              color: "#E6ECFF",
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>

          {meta ? (
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {meta}
            </Text>
          ) : null}
        </div>
      </div>

      {right ? <div style={{ flex: "0 0 auto" }}>{right}</div> : null}
    </div>
  );
}

export default function PreviewModuleModal({ open, onClose, moduleData }) {
  const data = moduleData || {
    title: "Algoritma Dasar",
    desc: "Pengenalan dasar logika pemrograman dan flowchart.",
    exp_modul: 500,
    stats: { materi: 8, quiz: 5, puzzle: 2 },
    materi: [
      { id: 1, type: "pdf", title: "materi 1", point: 25 },
      { id: 2, type: "video", title: "materi 2", point: 30 },
    ],
    quiz: [
      { id: 1, title: "quiz 1", point: 100 },
      { id: 2, title: "quiz 2", point: 100 },
    ],
    puzzle: [
      { id: 1, title: "Susun query create table users", meta: "drag drop • medium", point: 25 },
      { id: 2, title: "Lengkapi fungsi normalizeItems", meta: "fill blank • easy", point: 20 },
      { id: 3, title: "Buat fungsi add", meta: "code • easy", point: 30 },
    ],
  };

  const [activeKeys, setActiveKeys] = useState([""]);

  useEffect(() => {
    if (open) {
      setActiveKeys([""]);
    }
  }, [open, data?.id]);

  const iconForMateri = (type) => {
    if (type === "pdf") return <FilePdfOutlined />;
    if (type === "video") return <PlayCircleOutlined />;
    return <FileTextOutlined />;
  };

  const collapseStyle = {
    background: "transparent",
    border: "none",
  };

  const panelStyle = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    marginBottom: 10,
    overflow: "hidden",
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={620}
      destroyOnHidden
      closeIcon={<span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>×</span>}
      styles={{
        content: {
          padding: 0,
          borderRadius: 14,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(20,30,46,0.98) 0%, rgba(23,33,50,0.98) 55%, rgba(18,27,42,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        },
        header: { display: "none" },
        body: { padding: 0, background: "transparent" },
      }}
    >
      <div style={{ padding: "14px 16px", background: "transparent" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "rgba(124,92,255,0.18)",
              border: "1px solid rgba(124,92,255,0.25)",
              color: "#7C5CFF",
            }}
          >
            <BookOutlined />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>Preview Modul</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Detail konten dalam modul ini
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: "#E6ECFF", fontSize: 20, fontWeight: 900 }}>
              {data.title}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data.desc}
            </Text>
          </div>

          <div style={{ flex: "0 0 auto" }}>
            <ExpBadge point={data.exp_modul ?? data.xp ?? 0} label="EXP" />
          </div>
        </div>

        <div style={{ height: 14 }} />

        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <StatBox icon={<FileTextOutlined />} value={data.stats?.materi ?? 0} label="Materi" />
          </Col>
          <Col xs={24} md={8}>
            <StatBox icon={<QuestionCircleOutlined />} value={data.stats?.quiz ?? 0} label="Quiz" />
          </Col>
          <Col xs={24} md={8}>
            <StatBox icon={<ToolOutlined />} value={data.stats?.puzzle ?? 0} label="Puzzle" />
          </Col>
        </Row>

        <div style={{ height: 14 }} />

        <Collapse
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
          style={collapseStyle}
          expandIcon={({ isActive }) => (
            <DownOutlined
              style={{
                color: "rgba(255,255,255,0.6)",
                transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          )}
          items={[
            {
              key: "materi",
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: "rgba(124,92,255,0.7)" }} />
                  <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>Daftar Materi</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({(data.materi || []).length})
                  </Text>
                </div>
              ),
              style: panelStyle,
              children: (
                <List
                  dataSource={data.materi || []}
                  split={false}
                  renderItem={(it) => (
                    <List.Item style={{ paddingInline: 0, paddingBlock: 6, width: "100%" }}>
                      <ItemRow
                        icon={iconForMateri(it.type)}
                        title={it.title}
                        right={<ExpBadge point={it.point ?? it.exp_materi ?? 0} />}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: "quiz",
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: "rgba(124,92,255,0.7)" }} />
                  <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>Daftar Quiz</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({(data.quiz || []).length})
                  </Text>
                </div>
              ),
              style: panelStyle,
              children: (
                <List
                  dataSource={data.quiz || []}
                  split={false}
                  renderItem={(it) => (
                    <List.Item style={{ paddingInline: 0, paddingBlock: 6, width: "100%" }}>
                      <ItemRow
                        icon={<QuestionCircleOutlined />}
                        title={it.title}
                        right={<ExpBadge point={it.point} />}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: "puzzle",
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: "rgba(124,92,255,0.7)" }} />
                  <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>Daftar Puzzle</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({(data.puzzle || []).length})
                  </Text>
                </div>
              ),
              style: panelStyle,
              children: (
                <List
                  dataSource={data.puzzle || []}
                  split={false}
                  renderItem={(it) => (
                    <List.Item style={{ paddingInline: 0, paddingBlock: 6, width: "100%" }}>
                      <ItemRow
                        icon={<ToolOutlined />}
                        title={it.title}
                        meta={it.meta}
                        right={<ExpBadge point={it.point} />}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "transparent",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={onClose}
          style={{
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Tutup
        </Button>
      </div>
    </Modal>
  );
}