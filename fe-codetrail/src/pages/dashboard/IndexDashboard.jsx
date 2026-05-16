import React from "react";
import { Row, Col, Card, Typography, Space, Button, List } from "antd";
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
      <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {title}
          </Typography.Text>
          <div style={{ marginTop: 6 }}>
            <Typography.Text style={{ fontSize: 26, fontWeight: 800, color: "#E6ECFF" }}>
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

function LineChartMock() {
  // chart sederhana pakai SVG (no library)
  const points = [
    [0, 80],
    [40, 110],
    [80, 70],
    [120, 120],
    [160, 60],
    [200, 100],
    [240, 55],
    [280, 130],
    [320, 65],
    [360, 120],
    [400, 50],
    [440, 140],
  ];

  const path = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");

  return (
    <div style={{ width: "100%", height: 220 }}>
      <svg viewBox="0 0 460 160" width="100%" height="100%">
        {/* grid */}
        {[20, 50, 80, 110, 140].map((y) => (
          <line key={y} x1="0" y1={y} x2="460" y2={y} stroke="rgba(255,255,255,0.07)" />
        ))}

        {/* line */}
        <path d={path} fill="none" stroke="#7C5CFF" strokeWidth="3" strokeLinejoin="round" />

        {/* glow */}
        <path d={path} fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth="8" strokeLinejoin="round" />
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
          <Typography.Text key={d} type="secondary" style={{ fontSize: 11 }}>
            {d}
          </Typography.Text>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const recent = [
    { title: 'Rina Wati mengirim jawaban puzzle "Algoritma Dasar".', time: "2 menit yang lalu" },
    { title: 'Doni P. bergabung ke event "Hackathon 2024".', time: "15 menit yang lalu" },
    { title: 'Modul baru "Struktur Data" otomatis diterbitkan.', time: "1 jam yang lalu" },
    { title: "Sistem: 5 mahasiswa menunggu penilaian.", time: "5 jam yang lalu" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stat cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <StatCard title="Total Mahasiswa" value="120" sub="Terdaftar semester ini" icon={<TeamOutlined />} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <StatCard title="Event Aktif" value="5" sub="Sedang berlangsung" icon={<CalendarOutlined />} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <StatCard title="Puzzle Pending" value="12" sub="Butuh review" icon={<HourglassOutlined />} />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <StatCard title="Rata-rata Nilai" value="85%" sub="Rata-rata skor global" icon={<BarChartOutlined />} />
        </Col>
      </Row>

      {/* Chart + Activity */}
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
            <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
              <div>
                <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
                  Aktivitas Mahasiswa
                </Typography.Text>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Overview keterlibatan mingguan
                  </Typography.Text>
                </div>
              </div>

              <Button
                size="small"
                style={{ borderRadius: 12 }}
                icon={<RightOutlined />}
              >
                7 Hari Terakhir
              </Button>
            </Space>

            <div style={{ marginTop: 10 }}>
              <LineChartMock />
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
            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
              Aktivitas Terbaru
            </Typography.Text>

            <List
              style={{ marginTop: 10 }}
              dataSource={recent}
              renderItem={(item) => (
                <List.Item style={{ paddingInline: 0 }}>
                  <List.Item.Meta
                    title={
                      <Typography.Text style={{ color: "#E6ECFF", fontSize: 13, fontWeight: 600 }}>
                        {item.title}
                      </Typography.Text>
                    }
                    description={
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {item.time}
                      </Typography.Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
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
              style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              bodyStyle={{ padding: 16 }}
            >
              <Space direction="vertical" size={6}>
                <div style={{ color: "#7C5CFF", fontSize: 18 }}><FileDoneOutlined /></div>
                <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>Buat Soal</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Tambahkan pertanyaan</Typography.Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Card
              hoverable
              style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              bodyStyle={{ padding: 16 }}
            >
              <Space direction="vertical" size={6}>
                <div style={{ color: "#7C5CFF", fontSize: 18 }}><UploadOutlined /></div>
                <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>Upload Materi</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>PDF atau video</Typography.Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Card
              hoverable
              style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              bodyStyle={{ padding: 16 }}
            >
              <Space direction="vertical" size={6}>
                <div style={{ color: "#7C5CFF", fontSize: 18 }}><CalendarOutlined /></div>
                <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>Event Baru</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Jadwalkan kompetisi</Typography.Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12} lg={6}>
            <Card
              hoverable
              style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              bodyStyle={{ padding: 16 }}
            >
              <Space direction="vertical" size={6}>
                <div style={{ color: "#7C5CFF", fontSize: 18 }}><TrophyOutlined /></div>
                <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>Laporan</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Cek hasil ujian</Typography.Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
