import React, { useMemo, useState } from "react";
import {
  Card,
  Input,
  Space,
  Button,
  Typography,
  Tag,
  Dropdown,
  Modal,
} from "antd";
import { PlusOutlined, MoreOutlined, SearchOutlined } from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddSoalModal from "./component/AddSoal.jsx";
import DetailSoalModal from "./component/DetailSoal.jsx";
import {
  getSoalApi,
  getSoalByIdApi,
  deleteSoalApi,
} from "../../components/api/soal";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

async function getSoal(param) {
  const params = new URLSearchParams(param);
  const response = await getSoalApi(params);

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
      }}
    >
      {children}
    </Tag>
  );
}

function TypePill({ type }) {
  const map = {
    checkbox: { label: "Checkbox", bg: "rgba(58,123,255,0.18)" },
    pilgan: { label: "Pilihan Ganda", bg: "rgba(124,92,255,0.18)" },
    true_false: { label: "True / False", bg: "rgba(255,149,0,0.18)" },
  };

  const cfg = map[type] || {
    label: type || "-",
    bg: "rgba(255,255,255,0.10)",
  };

  return <Pill bg={cfg.bg}>{cfg.label}</Pill>;
}

function DiffPill({ diff }) {
  const map = {
    easy: { label: "Easy", bg: "rgba(0,201,167,0.18)", color: "#BFF8EB" },
    medium: { label: "Medium", bg: "rgba(255,193,7,0.18)", color: "#FFE8A3" },
    hard: { label: "Hard", bg: "rgba(255,82,82,0.18)", color: "#FFC7C7" },
  };

  const cfg = map[diff] || {
    label: diff || "-",
    bg: "rgba(255,255,255,0.10)",
    color: "#E6ECFF",
  };

  return (
    <Pill bg={cfg.bg} color={cfg.color}>
      {cfg.label}
    </Pill>
  );
}

function normalizeDetail(raw) {
  if (!raw) return null;

  return {
    id: raw.id || raw.id_soal,
    question: raw.question || raw.soal,
    soal: raw.soal || raw.question,
    type: raw.type || raw.tipe_soal,
    tipe_soal: raw.tipe_soal || raw.type,
    difficulty: raw.difficulty,
    id_quiz: raw.id_quiz,
    quizTitle: raw.quizTitle || raw.judul_quiz || raw.quiz_title,
    judul_quiz: raw.judul_quiz || raw.quizTitle,
    module: raw.module || raw.judul_modul || raw.modul,
    judul_modul: raw.judul_modul || raw.module,
    jawaban: Array.isArray(raw.jawaban) ? raw.jawaban : [],
    created_by: raw.created_by,
    created_at: raw.created_at,
    updated_by: raw.updated_by,
    updated_at: raw.updated_at,
  };
}

export default function ManageSoal() {
  const [trigger, setTrigger] = useState(0);
  const [q, setQ] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [selectedSoal, setSelectedSoal] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deletingSoal, setDeletingSoal] = useState(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [detailSoal, setDetailSoal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refreshTable = () => setTrigger((x) => x + 1);
  const queryParams = useMemo(() => ({ q }), [q]);

  const handleDetail = async (row) => {
    try {
      setOpenDetail(true);
      setDetailLoading(true);
      setDetailSoal(null);

      const response = await getSoalByIdApi(row.id);

      if (response?.status === 200) {
        setDetailSoal(normalizeDetail(response?.data?.data));
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal mengambil detail soal.",
        });
        setOpenDetail(false);
      }
    } catch (error) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message:
          error?.message || "Terjadi kesalahan saat mengambil detail soal.",
      });
      setOpenDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = (row) => {
    setDeletingSoal(row);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deletingSoal) return;

    const response = await deleteSoalApi(deletingSoal.id);

    if (response?.status === 200) {
      NotifToast({
        type: "success",
        message: response?.data?.message || "Soal berhasil dihapus.",
      });
      setOpenDelete(false);
      setDeletingSoal(null);
      refreshTable();
    } else {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: response?.data?.message || "Gagal menghapus soal.",
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "PERTANYAAN",
        dataIndex: "question",
        key: "question",
        render: (val) => (
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>
            {val}
          </Typography.Text>
        ),
      },
      {
        title: "MODUL",
        dataIndex: "module",
        key: "module",
        width: 170,
        render: (val) => (
          <Typography.Text style={{ color: "rgba(230,236,255,0.85)" }}>
            {val || "-"}
          </Typography.Text>
        ),
      },
      {
        title: "JUDUL KUIS",
        dataIndex: "quizTitle",
        key: "quizTitle",
        width: 180,
        render: (val) => (
          <Typography.Text style={{ color: "rgba(230,236,255,0.85)" }}>
            {val || "-"}
          </Typography.Text>
        ),
      },
      {
        title: "TIPE",
        dataIndex: "type",
        key: "type",
        width: 150,
        render: (val) => <TypePill type={val} />,
      },
      {
        title: "KESULITAN",
        dataIndex: "difficulty",
        key: "difficulty",
        width: 140,
        render: (val) => <DiffPill diff={val} />,
      },
      {
        title: "AKSI",
        key: "action",
        width: 80,
        align: "right",
        render: (_, row) => {
          const items = [
            {
              key: "detail",
              label: "Detail",
              onClick: () => handleDetail(row),
            },
            {
              key: "edit",
              label: "Edit",
              onClick: () => {
                setSelectedSoal(row);
                setOpenAdd(true);
              },
            },
            {
              key: "delete",
              label: "Hapus",
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
                icon={
                  <MoreOutlined style={{ color: "rgba(255,255,255,0.65)" }} />
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
      r1: { name: "question", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "Modul", name: "module", color: "purple" },
      r3: { text: "Kuis", name: "quizTitle", type: "secondary" },
      r5: { text: "Tipe", name: "type" },
      r6: { text: "Level", name: "difficulty" },
      actionLabel: "Detail",
      action: (item) => handleDetail(item),
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
            Bank Soal
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kelola database pertanyaan, kuis, dan ujian.
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
            placeholder="Cari soal..."
            style={{ width: 280, borderRadius: 14 }}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 14 }}
            onClick={() => {
              setSelectedSoal(null);
              setOpenAdd(true);
            }}
          >
            Buat Soal Baru
          </Button>
        </Space>
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
          getData={getSoal}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 1150 }}
          onDataLoaded={() => {}}
        />

        <AddSoalModal
          open={openAdd}
          onClose={() => {
            setOpenAdd(false);
            setSelectedSoal(null);
          }}
          onSuccess={() => {
            setOpenAdd(false);
            setSelectedSoal(null);
            refreshTable();
          }}
          initialValues={selectedSoal || null}
        />

        <DetailSoalModal
          open={openDetail}
          loading={detailLoading}
          data={detailSoal}
          onClose={() => {
            setOpenDetail(false);
            setDetailSoal(null);
          }}
        />

        <Modal
          open={openDelete}
          onCancel={() => {
            setOpenDelete(false);
            setDeletingSoal(null);
          }}
          onOk={confirmDelete}
          centered
          closable={false}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setOpenDelete(false);
                setDeletingSoal(null);
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
                Hapus Soal
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
            Apakah yakin ingin menghapus soal "{deletingSoal?.question}"?
          </div>
        </Modal>
      </Card>
    </div>
  );
}