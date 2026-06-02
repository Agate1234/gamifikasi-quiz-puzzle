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
  Modal,
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
import DetailPuzzleModal from "./component/DetailPuzzle.jsx";
import {
  getPuzzlesApi,
  getPuzzleByIdApi,
  deletePuzzleApi,
} from "../../components/api/puzzle";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

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

  const cfg = map[level] || {
    label: level || "-",
    bg: "rgba(255,255,255,0.10)",
    color: "#E6ECFF",
  };

  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

function TypePill({ type }) {
  const map = {
    drag_drop: { label: "Drag Drop", bg: "rgba(124,92,255,0.18)" },
    fill_blank: { label: "Fill Blank", bg: "rgba(58,123,255,0.18)" },
    code: { label: "Code", bg: "rgba(255,149,0,0.18)" },
  };

  const cfg = map[type] || {
    label: type || "-",
    bg: "rgba(255,255,255,0.10)",
  };

  return <Pill bg={cfg.bg}>{cfg.label}</Pill>;
}

function XPPill({ xp }) {
  return (
    <Pill bg="rgba(255,193,7,0.14)" color="#FFE8A3">
      🪙 {xp || 0} XP
    </Pill>
  );
}

function normalizePuzzleDetail(raw) {
  if (!raw) return null;

  return {
    ...raw,
    id: raw.id || raw.id_puzzle,
    title: raw.title || raw.judul_puzzle,
    desc: raw.desc || raw.deskripsi_puzzle,
    module: raw.module || raw.judul_modul,
    level: raw.level || raw.difficulty_puzzle,
    xp: raw.xp ?? raw.exp_puzzle,
  };
}

export default function ManagePuzzle() {
  const [trigger, setTrigger] = useState(0);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");

  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [loadingEditId, setLoadingEditId] = useState(null);

  const [openPreview, setOpenPreview] = useState(false);
  const [previewPuzzle, setPreviewPuzzle] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deletingPuzzle, setDeletingPuzzle] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refreshTable = () => setTrigger((x) => x + 1);

  const queryParams = useMemo(
    () => ({ q, category, level, sort }),
    [q, category, level, sort],
  );

  const fetchPuzzleDetail = async (row) => {
    const response = await getPuzzleByIdApi(row.id);

    if (response?.status !== 200) {
      throw new Error(response?.data?.message || "Gagal mengambil detail puzzle.");
    }

    return normalizePuzzleDetail(response?.data?.data);
  };

  const openPreviewModal = async (row) => {
    try {
      setLoadingPreviewId(row.id);
      setPreviewPuzzle(null);
      setOpenPreview(true);

      const detail = await fetchPuzzleDetail(row);
      setPreviewPuzzle(detail);
    } catch (error) {
      setOpenPreview(false);
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: error?.message || "Terjadi kesalahan saat mengambil preview puzzle.",
      });
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleEdit = async (row) => {
    try {
      setLoadingEditId(row.id);

      const detail = await fetchPuzzleDetail(row);

      setSelectedPuzzle(detail);
      setOpenAdd(true);
    } catch (error) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: error?.message || "Terjadi kesalahan saat mengambil data edit puzzle.",
      });
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleDelete = (row) => {
    setDeletingPuzzle(row);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deletingPuzzle) return;

    try {
      setDeleting(true);

      const response = await deletePuzzleApi(deletingPuzzle.id);

      if (response?.status === 200) {
        NotifToast({
          type: "success",
          message: response?.data?.message || "Puzzle berhasil dihapus.",
        });

        setOpenDelete(false);
        setDeletingPuzzle(null);
        refreshTable();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal menghapus puzzle.",
        });
      }
    } finally {
      setDeleting(false);
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
                {row.desc || "-"}
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
              {val || "-"}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: "TIPE",
        dataIndex: "tipe_puzzle",
        key: "tipe_puzzle",
        width: 140,
        render: (val) => <TypePill type={val} />,
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
              onClick: () => openPreviewModal(row),
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
              danger: true,
              onClick: () => handleDelete(row),
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
                loading={loadingEditId === row.id || loadingPreviewId === row.id}
                icon={
                  <MoreOutlined style={{ color: "rgba(255,255,255,0.65)" }} />
                }
              />
            </Dropdown>
          );
        },
      },
    ],
    [loadingEditId, loadingPreviewId],
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "title", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "Modul", name: "module", color: "purple" },
      r3: { name: "desc", type: "secondary" },
      r5: { text: "XP", name: "xp" },
      r6: { text: "Level", name: "level" },
      actionLabel: "Preview",
      action: (item) => openPreviewModal(item),
    }),
    [],
  );

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
            Manage Puzzle
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Buat, edit, preview, hapus, dan atur parameter gamifikasi puzzle.
          </Typography.Text>
        </div>

        <Space wrap>
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={refreshTable}
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
          tableScroll={{ y: 520, x: 1180 }}
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

        <DetailPuzzleModal
          open={openPreview}
          loading={loadingPreviewId !== null}
          data={previewPuzzle}
          onClose={() => {
            setOpenPreview(false);
            setPreviewPuzzle(null);
          }}
        />

        <Modal
          open={openDelete}
          onCancel={() => {
            setOpenDelete(false);
            setDeletingPuzzle(null);
          }}
          onOk={confirmDelete}
          centered
          closable={false}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setOpenDelete(false);
                setDeletingPuzzle(null);
              }}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#E6ECFF",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                boxShadow: "none",
                fontWeight: 500,
              }}
            >
              Batal
            </Button>,
            <Button
              key="delete"
              danger
              loading={deleting}
              onClick={confirmDelete}
              style={{
                background: "#ff4d4f",
                border: "none",
                borderRadius: 10,
                boxShadow: "none",
                fontWeight: 600,
                color: "#ffffff",
                opacity: 1,
              }}
            >
              Hapus
            </Button>,
          ]}
          styles={{
            mask: {
              background: "rgba(2,6,23,0.72)",
              backdropFilter: "blur(6px)",
            },
            content: {
              background: "rgba(15,23,42,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 18,
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              padding: 20,
            },
            header: {
              background: "transparent",
              borderBottom: "none",
              padding: 0,
              marginBottom: 10,
            },
            body: {
              background: "transparent",
              color: "#E6ECFF",
              padding: 0,
            },
            footer: {
              background: "transparent",
              borderTop: "none",
              marginTop: 24,
              padding: 0,
            },
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  borderRadius: 999,
                  background: "rgba(255,184,0,0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffb800",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                !
              </div>
              <span style={{ color: "#E6ECFF", fontSize: 22, fontWeight: 600 }}>
                Hapus Puzzle
              </span>
            </div>
          }
        >
          <div
            style={{
              color: "rgba(230,236,255,0.72)",
              fontSize: 16,
              lineHeight: 1.6,
              marginTop: 8,
            }}
          >
            Apakah yakin ingin menghapus puzzle "{deletingPuzzle?.title}"?
          </div>
        </Modal>
      </Card>
    </div>
  );
}
