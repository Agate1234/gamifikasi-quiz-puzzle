import React, { useMemo, useState } from "react";
import {
  Card,
  Input,
  Space,
  Button,
  Typography,
  Tag,
  Dropdown,
  Select,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddPuzzleModal from "./component/AddPuzzle.jsx";
import { getPuzzlesApi, getPuzzleByIdApi } from "../../components/api/puzzle";

async function getPuzzles(param) {
  const params = new URLSearchParams(param);
  const response = await getPuzzlesApi(params);

  if (response?.status === 200) {
    return {
      status: 200,
      data: {
        data: response?.data?.data || [],
        total: response?.data?.paging?.total || 0,
        paging: response?.data?.paging || {
          page: 1,
          limit: 10,
          total: 0,
          page_total: 1,
        },
      },
    };
  }

  return {
    status: response?.status || 500,
    data: {
      data: [],
      total: 0,
      paging: {
        page: 1,
        limit: 10,
        total: 0,
        page_total: 1,
      },
    },
  };
}

// ====== UI helpers ======
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
        marginInlineEnd: 6,
      }}
    >
      {children}
    </Tag>
  );
}

function LevelPill({ level }) {
  const map = {
    easy: { label: "Easy", bg: "rgba(0,201,167,0.18)", color: "#BFF8EB" },
    medium: { label: "Medium", bg: "rgba(255,193,7,0.18)", color: "#FFE8A3" },
    hard: { label: "Hard", bg: "rgba(255,82,82,0.18)", color: "#FFC7C7" },
  };
  const cfg = map[level] || { label: level, bg: "rgba(255,255,255,0.10)" };
  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

function XPPill({ xp }) {
  return (
    <Pill bg="rgba(255,193,7,0.14)" color="#FFE8A3">
      🪙 {xp} XP
    </Pill>
  );
}

export default function ManagePuzzle() {
  const [trigger, setTrigger] = useState(0);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");

  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const refreshTable = () => setTrigger((x) => x + 1);

  const queryParams = useMemo(
    () => ({ q, category, level, sort }),
    [q, category, level, sort],
  );

  const handleEdit = async (row) => {
  try {
    setLoadingEdit(true);
    const response = await getPuzzleByIdApi(row.id);

    if (response?.status === 200) {
      setSelectedPuzzle(response?.data?.data || null);
      setOpenAdd(true);
    }
  } finally {
    setLoadingEdit(false);
  }
};

  const columns = useMemo(
    () => [
      {
        title: "PUZZLE",
        dataIndex: "title",
        key: "title",
        render: (_, row) => (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: "rgba(124,92,255,0.18)",
                border: "1px solid rgba(255,255,255,0.06)",
                flex: "0 0 auto",
              }}
            >
              <span style={{ fontSize: 16 }}>🧩</span>
            </div>

            <div style={{ minWidth: 0 }}>
              <Typography.Text
                style={{ color: "#E6ECFF", fontWeight: 800, display: "block" }}
              >
                {row.title}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 520,
                }}
              >
                {row.desc}
              </Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: "MODUL TERKAIT",
        dataIndex: "module",
        key: "module",
        width: 230,
        render: (val) => (
          <div>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11, display: "block", lineHeight: 1.2 }}
            >
              MODUL TERKAIT
            </Typography.Text>
            <Typography.Text style={{ color: "rgba(230,236,255,0.88)" }}>
              {val}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: "LEVEL",
        dataIndex: "level",
        key: "level",
        width: 130,
        render: (val) => <LevelPill level={val} />,
      },
      {
        title: "XP",
        dataIndex: "xp",
        key: "xp",
        width: 120,
        render: (val) => <XPPill xp={val} />,
      },
      {
        title: "AKSI",
        key: "action",
        width: 110,
        align: "right",
        render: (_, row) => {
          const items = [
            {
              key: "preview",
              label: "Preview",
              icon: <EyeOutlined />,
              onClick: () => console.log("preview", row),
            },
            {
  key: "edit",
  label: "Edit",
  icon: <EditOutlined />,
  onClick: () => handleEdit(row),
},
            {
              key: "delete",
              label: "Hapus",
              icon: <DeleteOutlined />,
              onClick: () => console.log("hapus", row),
            },
          ];

          return (
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}
            >
              <Dropdown
                menu={{ items }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={
                    <MoreOutlined style={{ color: "rgba(255,255,255,0.65)" }} />
                  }
                />
              </Dropdown>
            </div>
          );
        },
      },
    ],
    [],
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "title", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "Modul", name: "module", color: "purple" },
      r3: { name: "desc", type: "secondary" },
      r5: { text: "XP", name: "xp" },
      r6: { text: "Level", name: "level" },
      actionLabel: "Edit",
      action: (item) => console.log("edit mobile", item),
    }),
    [],
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
            Manage Puzzle
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Buat, edit, dan atur parameter gamifikasi puzzle.
          </Typography.Text>
        </div>

        {/* ✅ Search + Buat Baru di kanan (sebelahan) */}
        <Space>
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={() => setTrigger((x) => x + 1)}
            prefix={
              <SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
            }
            placeholder="Cari puzzle..."
            style={{ width: 260, borderRadius: 14 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 14 }}
            onClick={() => {
              setSelectedPuzzle(null);
              setOpenAdd(true);
            }}
          >
            Tambah Puzzle
          </Button>
        </Space>
      </div>

      {/* Filters + Sort (tanpa tombol buat baru) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Space wrap>
          <Select
            value={category || undefined}
            onChange={(v) => {
              setCategory(v || "");
              setTrigger((x) => x + 1);
            }}
            allowClear
            placeholder={
              <span style={{ color: "rgba(230,236,255,0.75)" }}>
                <FilterOutlined />
                &nbsp; Semua Kategori
              </span>
            }
            style={{ minWidth: 180, borderRadius: 14 }}
            options={[
              { label: "Dasar Pemrograman", value: "Dasar Pemrograman" },
              { label: "Algoritma Logika", value: "Algoritma Logika" },
              { label: "Manajemen Memori", value: "Manajemen Memori" },
              { label: "Struktur Data", value: "Struktur Data" },
            ]}
          />

          <Select
            value={level || undefined}
            onChange={(v) => {
              setLevel(v || "");
              setTrigger((x) => x + 1);
            }}
            allowClear
            placeholder="Semua Level"
            style={{ minWidth: 160, borderRadius: 14 }}
            options={[
              { label: "Easy", value: "easy" },
              { label: "Medium", value: "medium" },
              { label: "Hard", value: "hard" },
            ]}
          />
        </Space>

        <Select
          value={sort}
          onChange={(v) => {
            setSort(v);
            setTrigger((x) => x + 1);
          }}
          style={{ minWidth: 180, borderRadius: 14 }}
          options={[
            { label: "Sort by Terbaru", value: "newest" },
            { label: "Sort by Terlama", value: "oldest" },
            { label: "XP Tertinggi", value: "xp_high" },
            { label: "XP Terendah", value: "xp_low" },
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
          getData={getPuzzles}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 1050 }}
          onDataLoaded={() => {}}
        />

        <AddPuzzleModal
          open={openAdd}
          initialValues={selectedPuzzle}
          onClose={() => {
            setOpenAdd(false);
            setSelectedPuzzle(null);
          }}
          onSuccess={() => {
            setOpenAdd(false);
            setSelectedPuzzle(null);
            refreshTable();
          }}
        />
      </Card>
    </div>
  );
}
