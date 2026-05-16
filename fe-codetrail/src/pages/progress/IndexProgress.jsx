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
  Progress,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import DetailProgressMahasiswaModal from "./component/DetailProgress.jsx";

// ====== DEMO GET DATA (ganti ke API kamu) ======
async function getProgressMahasiswa(param) {
  const params = new URLSearchParams(param);

  const q = (params.get("q") || "").toLowerCase();
  const kelas = (params.get("kelas") || "").toLowerCase();
  const sort = (params.get("sort") || "desc").toLowerCase(); // desc | asc

  const all = [
    {
      id: 1,
      name: "Andi Saputra",
      nim: "23010045",
      kelas: "Kelas A",
      done: 10,
      total: 12,
    },
    {
      id: 2,
      name: "Citra Wijaya",
      nim: "23010052",
      kelas: "Kelas A",
      done: 9,
      total: 12,
    },
    {
      id: 3,
      name: "Budi Prakoso",
      nim: "23010018",
      kelas: "Kelas B",
      done: 7,
      total: 12,
    },
    {
      id: 4,
      name: "Dian Arista",
      nim: "23020022",
      kelas: "Kelas B",
      done: 5,
      total: 12,
    },
    {
      id: 5,
      name: "Fajar Hidayat",
      nim: "23010033",
      kelas: "Kelas A",
      done: 4,
      total: 12,
    },
  ];

  // filter + search
  let filtered = all.filter((x) => {
    const passQ =
      !q || x.name.toLowerCase().includes(q) || x.nim.toLowerCase().includes(q);

    const passKelas = !kelas || x.kelas.toLowerCase() === kelas;

    return passQ && passKelas;
  });

  // sort by percent
  filtered = [...filtered].sort((a, b) => {
    const pa = Math.round((a.done / a.total) * 100);
    const pb = Math.round((b.done / b.total) * 100);
    return sort === "asc" ? pa - pb : pb - pa;
  });

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

function barColor(percent) {
  if (percent >= 80) return "rgb(124,92,255)"; // ungu
  if (percent >= 65) return "rgb(0,201,167)"; // hijau
  if (percent >= 50) return "rgb(255,193,7)"; // kuning
  return "rgb(255,82,82)"; // merah
}

export default function ProgressMahasiswa() {
  const [trigger, setTrigger] = useState(0);

  const [q, setQ] = useState("");
  const [kelas, setKelas] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sort, setSort] = useState("desc");

  const queryParams = useMemo(() => ({ q, kelas, sort }), [q, kelas, sort]);

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
                background: "rgba(124,92,255,0.20)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#E6ECFF",
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
                {row.nim}
              </Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: "PROGRESS KESELURUHAN",
        key: "progress",
        render: (_, row) => {
          const percent = Math.round((row.done / row.total) * 100);
          const stroke = barColor(percent);

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ minWidth: 220 }}>
                <Typography.Text
                  style={{
                    color: "rgba(230,236,255,0.9)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {row.done}/{row.total} Modul Selesai
                </Typography.Text>

                <Progress
                  percent={percent}
                  showInfo={false}
                  strokeColor={stroke}
                  trailColor="rgba(255,255,255,0.08)"
                  size="small"
                  style={{ marginTop: 6 }}
                />
              </div>

              <Typography.Text
                style={{ color: "rgba(230,236,255,0.75)", fontSize: 12 }}
              >
                {percent}%
              </Typography.Text>
            </div>
          );
        },
      },
      {
        title: "AKSI",
        key: "action",
        width: 90,
        align: "right",
        render: (_, row) => {
          const items = [
            {
              key: `detail-${row.id ?? row.nim ?? row.key ?? ""}`,
              label: "Lihat Detail",
              onClick: () => {
                setSelectedStudent(row);
                setOpenDetail(true);
              },
            },
          ];

          return (
            <Dropdown
              menu={{ items }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={
                  <EyeOutlined style={{ color: "rgba(255,255,255,0.65)" }} />
                }
              />
            </Dropdown>
          );
        },
      },
    ],
    []
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "name", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "NIM", name: "nim", type: "secondary" },
      r3: { text: "Kelas", name: "kelas", type: "secondary" },
      r5: { text: "Done", name: "done" },
      r6: { text: "Total", name: "total" },
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
            Progres Mahasiswa
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Pantau perkembangan dan pencapaian mahasiswa.
          </Typography.Text>
        </div>

        <Space>
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

          <Button
            icon={<DownloadOutlined />}
            style={{
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(230,236,255,0.88)",
            }}
            onClick={() => console.log("export")}
          >
            Export Data
          </Button>
        </Space>
      </div>

      {/* Filters row */}
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

        <Select
          value={sort}
          onChange={(v) => {
            setSort(v);
            setTrigger((x) => x + 1);
          }}
          style={{ minWidth: 170, borderRadius: 14 }}
          options={[
            { label: "Terkecil → Terbesar", value: "asc" },
            { label: "Terbesar → Terkecil", value: "desc" },
          ]}
          suffixIcon={
            <SortAscendingOutlined style={{ color: "rgba(230,236,255,0.6)" }} />
          }
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
          getData={getProgressMahasiswa}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 900 }}
          onDataLoaded={() => {}}
        />

        <DetailProgressMahasiswaModal
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          student={selectedStudent}
        />
      </Card>
    </div>
  );
}
