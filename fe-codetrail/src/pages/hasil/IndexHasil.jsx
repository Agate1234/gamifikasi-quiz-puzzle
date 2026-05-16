import React, { useMemo, useState } from "react";
import {
  Card,
  Input,
  Space,
  Button,
  Typography,
  Dropdown,
  Select,
  Avatar,
  Tag,
} from "antd";
import { SearchOutlined, EyeOutlined, FilterOutlined } from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import PreviewScoreMahasiswaModal from "./component/DetailHasil.jsx";

// ====== DEMO GET DATA (ganti ke API kamu) ======
async function getHasilMahasiswa(param) {
  const params = new URLSearchParams(param);

  const q = (params.get("q") || "").toLowerCase();
  const kelas = (params.get("kelas") || "").toLowerCase();

  const all = [
    {
      id: 1,
      name: "Rina Aulia",
      nim: "202301045",
      kelas: "Kelas A",
      xp: 12450,
    },
    {
      id: 2,
      name: "Dimas Pratama",
      nim: "202301052",
      kelas: "Kelas A",
      xp: 8920,
    },
    {
      id: 3,
      name: "Siti Nurhaliza",
      nim: "202301011",
      kelas: "Kelas B",
      xp: 15200,
    },
    {
      id: 4,
      name: "Bayu Pamungkas",
      nim: "202301088",
      kelas: "Kelas B",
      xp: 6400,
    },
    {
      id: 5,
      name: "Putri Indah",
      nim: "202301035",
      kelas: "Kelas A",
      xp: 10150,
    },
  ];

  let filtered = all.filter((x) => {
    const passQ = !q || x.name.toLowerCase().includes(q) || x.nim.includes(q);
    const passKelas = !kelas || x.kelas.toLowerCase() === kelas;
    return passQ && passKelas;
  });

  // sort default: xp desc (biar top scoring di atas)
  filtered = [...filtered].sort((a, b) => b.xp - a.xp);

  // pagination dummy
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);
  const total = filtered.length;

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: {
      data: filtered.slice(start, end),
      total,
      paging: {
        page,
        limit,
        total,
        page_total: Math.max(1, Math.ceil(total / limit)),
      },
    },
    status: 200,
  };
}

// ====== UI helpers ======
function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function formatXP(num) {
  const n = Number(num || 0);
  return n.toLocaleString("en-US"); // 12,450
}

function XPPill({ xp }) {
  return (
    <Tag
      style={{
        borderRadius: 999,
        paddingInline: 12,
        paddingBlock: 3,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(124,92,255,0.18)",
        color: "#E6ECFF",
        fontWeight: 700,
      }}
    >
      {formatXP(xp)} XP
    </Tag>
  );
}

export default function HasilMahasiswa() {
  const [trigger, setTrigger] = useState(0);

  const [q, setQ] = useState("");
  const [kelas, setKelas] = useState("");
  const [openScore, setOpenScore] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const queryParams = useMemo(() => ({ q, kelas }), [q, kelas]);

  const columns = useMemo(
    () => [
      {
        title: "NAMA MAHASISWA",
        key: "student",
        render: (_, row) => (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={34}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(230,236,255,0.85)",
                fontWeight: 800,
              }}
            >
              {initials(row.name)}
            </Avatar>

            <div style={{ lineHeight: 1.1 }}>
              <Typography.Text
                style={{ color: "#E6ECFF", fontWeight: 800, display: "block" }}
              >
                {row.name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                NIM: {row.nim}
              </Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: "TOTAL KESELURUHAN SCORE",
        dataIndex: "xp",
        key: "xp",
        width: 260,
        render: (val) => <XPPill xp={val} />,
      },
      {
        title: "AKSI",
        key: "action",
        width: 90,
        align: "right",
        render: (_, row) => (
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "rgba(255,255,255,0.65)" }} />}
            onClick={() => {
              setSelectedStudent(row);
              setOpenScore(true);
            }}
          />
        ),
      },
    ],
    []
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "name", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "NIM", name: "nim", type: "secondary" },
      r3: { text: "XP", name: "xp", type: "secondary" },
      r5: { text: "", name: "" },
      r6: { text: "", name: "" },
      actionLabel: "Detail",
      action: (item) => console.log("detail mobile", item),
    }),
    []
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: "#E6ECFF" }}>
            Daftar Mahasiswa
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kelola daftar mahasiswa dan lihat detail hasil pengerjaan mereka.
          </Typography.Text>
        </div>

        <Input
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={() => setTrigger((x) => x + 1)}
          prefix={
            <SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
          }
          placeholder="Cari nama mahasiswa..."
          style={{ width: 280, borderRadius: 14 }}
        />
      </div>

      {/* Filter row (Semua Kelas) */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Select
          value={kelas || undefined}
          onChange={(v) => {
            setKelas(v || "");
            setTrigger((x) => x + 1);
          }}
          allowClear
          placeholder={
            <span style={{ color: "rgba(230,236,255,0.75)" }}>
              <FilterOutlined />
              &nbsp; Semua Kelas
            </span>
          }
          style={{ minWidth: 170, borderRadius: 14 }}
          options={[
            { label: "Kelas A", value: "Kelas A" },
            { label: "Kelas B", value: "Kelas B" },
          ]}
        />
      </div>

      {/* Table */}
      <Card
        style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <TableList
          getData={getHasilMahasiswa}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 850 }}
          onDataLoaded={() => {}}
        />

        <PreviewScoreMahasiswaModal
          open={openScore}
          onClose={() => setOpenScore(false)}
          student={selectedStudent}
        />
      </Card>
    </div>
  );
}
