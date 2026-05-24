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
import { getProgressMahasiswaApi } from "../../components/api/progressmahasiswa.jsx";

function initials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function barColor(percent) {
  if (percent >= 80) return "rgb(124,92,255)";
  if (percent >= 65) return "rgb(0,201,167)";
  if (percent >= 50) return "rgb(255,193,7)";
  return "rgb(255,82,82)";
}

function getPercent(row) {
  const direct = Number(row?.percent ?? row?.progress_percent);
  if (!Number.isNaN(direct)) return Math.max(0, Math.min(100, direct));

  const done = Number(row?.done || 0);
  const total = Number(row?.total || 0);
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
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
                {row.name || "-"}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {row.nim || "-"}{" "}
                {row.kelas && row.kelas !== "-" ? `• ${row.kelas}` : ""}
              </Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: "PROGRESS KESELURUHAN",
        key: "progress",
        render: (_, row) => {
          const percent = getPercent(row);
          const stroke = barColor(percent);
          const done = Number(row.done || row.done_modul || 0);
          const total = Number(row.total || row.total_modul || 0);

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
                  {done}/{total} Modul Selesai
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
              key: `detail-${row.id_user ?? row.id ?? row.nim ?? ""}`,
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
    [],
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "name", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "NIM", name: "nim", type: "secondary" },
      r3: { text: "Kelas", name: "kelas", type: "secondary" },
      r5: { text: "Done", name: "done" },
      r6: { text: "Total", name: "total" },
      actionLabel: "Detail",
      action: (item) => {
        setSelectedStudent(item);
        setOpenDetail(true);
      },
    }),
    [],
  );

  const handleExportCsv = async () => {
    const params = new URLSearchParams({
      q,
      kelas,
      sort,
      page: "1",
      limit: "9999",
    });

    const response = await getProgressMahasiswaApi(params);
    const rows = response?.data?.data || [];

    const header = [
      "Nama",
      "NIM",
      "Kelas",
      "Modul Selesai",
      "Total Modul",
      "Persen",
    ];

    const body = rows.map((row) => [
      row.name || "-",
      row.nim || "-",
      row.kelas || "-",
      row.done || 0,
      row.total || 0,
      `${getPercent(row)}%`,
    ]);

    const csv = [header, ...body]
      .map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "progress-mahasiswa.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
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

        <Space wrap>
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={() => setTrigger((x) => x + 1)}
            prefix={
              <SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
            }
            placeholder="Cari nama / NIM mahasiswa..."
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
            onClick={handleExportCsv}
          >
            Export Data
          </Button>
        </Space>
      </div>

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
            { label: "Kelas TI-1A", value: "Kelas TI-1A" },
            { label: "Kelas TI-1B", value: "Kelas TI-1B" },
          ]}
        />

        <Select
          value={sort}
          onChange={(v) => {
            setSort(v);
            setTrigger((x) => x + 1);
          }}
          style={{ minWidth: 190, borderRadius: 14 }}
          options={[
            { label: "Progress Terkecil", value: "asc" },
            { label: "Progress Terbesar", value: "desc" },
          ]}
          suffixIcon={
            <SortAscendingOutlined style={{ color: "rgba(230,236,255,0.6)" }} />
          }
        />

        <Button
          onClick={() => setTrigger((x) => x + 1)}
          style={{
            borderRadius: 14,
            background: "rgba(124,92,255,0.16)",
            border: "1px solid rgba(124,92,255,0.35)",
            color: "#E6ECFF",
            fontWeight: 700,
          }}
        >
          Terapkan
        </Button>
      </div>

      <Card
        style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <TableList
          getData={getProgressMahasiswaApi}
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