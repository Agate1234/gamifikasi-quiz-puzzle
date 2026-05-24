import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Button,
  List,
  Spin,
  message,
} from "antd";
import {
  TeamOutlined,
  CalendarOutlined,
  HourglassOutlined,
  BarChartOutlined,
  RightOutlined,
  FileDoneOutlined,
  UploadOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { getDashboardApi } from "../../components/api/dashboard";

function StatCard({ title, value, sub, icon }) {
  return (
    <Card
      style={{
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      bodyStyle={{ padding: 16 }}
    >
      <Space
        style={{ width: "100%", justifyContent: "space-between" }}
        align="start"
      >
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {title}
          </Typography.Text>

          <div style={{ marginTop: 6 }}>
            <Typography.Text
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#E6ECFF",
              }}
            >
              {value}
            </Typography.Text>
          </div>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {sub}
          </Typography.Text>
        </div>

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "rgba(124,92,255,0.14)",
            border: "1px solid rgba(124,92,255,0.22)",
          }}
        >
          <span style={{ color: "#7C5CFF" }}>{icon}</span>
        </div>
      </Space>
    </Card>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari yang lalu`;
}

function LineChart({ data = [] }) {
  const chartData =
    data.length > 0
      ? data
      : [
          { label: "Sen", total: 0 },
          { label: "Sel", total: 0 },
          { label: "Rab", total: 0 },
          { label: "Kam", total: 0 },
          { label: "Jum", total: 0 },
          { label: "Sab", total: 0 },
          { label: "Min", total: 0 },
        ];

  const width = 720;
  const height = 260;

  const paddingLeft = 54;
  const paddingRight = 22;
  const paddingTop = 24;
  const paddingBottom = 42;

  const rawMax = Math.max(
    ...chartData.map((item) => Number(item.total || 0)),
    1,
  );

  const maxValue = Math.max(5, Math.ceil(rawMax / 5) * 5);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
    Math.round(maxValue * ratio),
  );

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const getX = (index) => {
    if (chartData.length === 1) return paddingLeft + plotWidth / 2;

    return paddingLeft + (index / (chartData.length - 1)) * plotWidth;
  };

  const getY = (value) => {
    return (
      paddingTop +
      plotHeight -
      (Number(value || 0) / maxValue) * plotHeight
    );
  };

  const points = chartData.map((item, index) => [
    getX(index),
    getY(item.total),
  ]);

  const path = points
    .map(([x, y], index) => (index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");

  return (
    <div style={{ width: "100%", height: 300 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        {yTicks.map((tick) => {
          const y = getY(tick);

          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
              />

              <text
                x={paddingLeft - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="rgba(230,236,255,0.55)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="rgba(255,255,255,0.12)"
        />

        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}
          stroke="rgba(255,255,255,0.12)"
        />

        <path
          d={path}
          fill="none"
          stroke="rgba(124,92,255,0.32)"
          strokeWidth="9"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <path
          d={path}
          fill="none"
          stroke="#7C5CFF"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map(([x, y], index) => {
          const total = Number(chartData[index]?.total || 0);

          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="#7C5CFF"
                stroke="rgba(230,236,255,0.9)"
                strokeWidth="1.5"
              />

              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="rgba(230,236,255,0.8)"
              >
                {total}
              </text>
            </g>
          );
        })}

        {chartData.map((item, index) => (
          <text
            key={index}
            x={getX(index)}
            y={height - 14}
            textAnchor="middle"
            fontSize="11"
            fill="rgba(230,236,255,0.55)"
          >
            {item.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState({
    stats: {
      total_mahasiswa: 0,
      total_event: 0,
      puzzle_pending: 0,
      rata_rata_nilai: 0,
      total_quiz_selesai: 0,
      total_puzzle_selesai: 0,
      total_materi_selesai: 0,
    },
    weekly_activity: [],
    recent_activity: [],
    top_students: [],
  });

  const fetchDashboard = async () => {
    setLoading(true);

    const response = await getDashboardApi();

    if (
      response.status >= 200 &&
      response.status < 300 &&
      response.data?.success !== false
    ) {
      setDashboard(response.data?.data || dashboard);
    } else {
      message.error(
        response.data?.message || "Gagal mengambil data dashboard.",
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = dashboard.stats || {};
  const recent = dashboard.recent_activity || [];
  const weeklyActivity = dashboard.weekly_activity || [];

  const recentLimited = useMemo(() => {
    return (recent || []).slice(0, 4);
  }, [recent]);

  const completionSub = useMemo(() => {
    return `${formatNumber(stats.total_materi_selesai)} materi, ${formatNumber(
      stats.total_quiz_selesai,
    )} quiz, ${formatNumber(stats.total_puzzle_selesai)} puzzle selesai`;
  }, [stats]);

  return (
    <Spin spinning={loading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={6}>
            <StatCard
              title="Total Mahasiswa"
              value={formatNumber(stats.total_mahasiswa)}
              sub="Role mahasiswa aktif"
              icon={<TeamOutlined />}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <StatCard
              title="Event"
              value={formatNumber(stats.total_event)}
              sub="Total event terdaftar"
              icon={<CalendarOutlined />}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <StatCard
              title="Puzzle Pending"
              value={formatNumber(stats.puzzle_pending)}
              sub="Puzzle belum selesai"
              icon={<HourglassOutlined />}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <StatCard
              title="Rata-rata Nilai"
              value={`${formatNumber(stats.rata_rata_nilai)}%`}
              sub={completionSub}
              icon={<BarChartOutlined />}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              bodyStyle={{ padding: 16 }}
            >
              <Space
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                }}
                align="start"
              >
                <div>
                  <Typography.Text
                    style={{ color: "#E6ECFF", fontWeight: 800 }}
                  >
                    Aktivitas Mahasiswa
                  </Typography.Text>

                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Overview keterlibatan 7 hari terakhir
                    </Typography.Text>
                  </div>
                </div>

                <Button
                  size="small"
                  style={{ borderRadius: 12 }}
                  icon={<RightOutlined />}
                  onClick={fetchDashboard}
                >
                  Refresh
                </Button>
              </Space>

              <div style={{ marginTop: 14, minHeight: 300 }}>
                <LineChart data={weeklyActivity} />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                height: "100%",
              }}
              bodyStyle={{ padding: 16 }}
            >
              <Space
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography.Text
                  style={{ color: "#E6ECFF", fontWeight: 800 }}
                >
                  Aktivitas Terbaru
                </Typography.Text>

                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {recentLimited.length}/4
                </Typography.Text>
              </Space>

              <div
                style={{
                  marginTop: 10,
                  maxHeight: 280,
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                <List
                  dataSource={recentLimited}
                  locale={{ emptyText: "Belum ada aktivitas terbaru" }}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <List.Item.Meta
                        title={
                          <Typography.Text
                            style={{
                              color: "#E6ECFF",
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {item.title}
                          </Typography.Text>
                        }
                        description={
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                          >
                            {formatRelativeTime(item.created_at)}
                          </Typography.Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          bodyStyle={{ padding: 16 }}
        >
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
            Quick Actions
          </Typography.Text>

          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size={6}>
                  <div style={{ color: "#7C5CFF", fontSize: 18 }}>
                    <FileDoneOutlined />
                  </div>

                  <Typography.Text
                    style={{ color: "#E6ECFF", fontWeight: 700 }}
                  >
                    Buat Soal
                  </Typography.Text>

                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Tambahkan pertanyaan
                  </Typography.Text>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size={6}>
                  <div style={{ color: "#7C5CFF", fontSize: 18 }}>
                    <UploadOutlined />
                  </div>

                  <Typography.Text
                    style={{ color: "#E6ECFF", fontWeight: 700 }}
                  >
                    Upload Materi
                  </Typography.Text>

                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    PDF atau video
                  </Typography.Text>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size={6}>
                  <div style={{ color: "#7C5CFF", fontSize: 18 }}>
                    <CalendarOutlined />
                  </div>

                  <Typography.Text
                    style={{ color: "#E6ECFF", fontWeight: 700 }}
                  >
                    Event Baru
                  </Typography.Text>

                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Jadwalkan kompetisi
                  </Typography.Text>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size={6}>
                  <div style={{ color: "#7C5CFF", fontSize: 18 }}>
                    <TrophyOutlined />
                  </div>

                  <Typography.Text
                    style={{ color: "#E6ECFF", fontWeight: 700 }}
                  >
                    Laporan
                  </Typography.Text>

                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Cek hasil ujian
                  </Typography.Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </Spin>
  );
}