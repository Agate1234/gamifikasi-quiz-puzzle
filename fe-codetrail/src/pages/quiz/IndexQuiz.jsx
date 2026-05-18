import React, { useMemo, useState, useEffect } from "react";
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
import {
  PlusOutlined,
  MoreOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddQuizModal from "./component/AddQuiz.jsx";
import PreviewQuizHardcore from "./component/DetailQuiz.jsx";
import {
  getQuizApi,
  getQuizByIdApi,
  createQuizApi,
  updateQuizApi,
  deleteQuizApi,
} from "../../components/api/quiz";
import { getModulesApi } from "../../components/api/modul";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

// ambil list quiz dari API
async function getQuiz(param) {
  const params = new URLSearchParams(param);
  const response = await getQuizApi(params);

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

function Pill({
  color = "rgba(124,92,255,0.18)",
  textColor = "#E6ECFF",
  children,
}) {
  return (
    <Tag
      style={{
        borderRadius: 999,
        paddingInline: 10,
        paddingBlock: 2,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: color,
        color: textColor,
        marginInlineEnd: 6,
      }}
    >
      {children}
    </Tag>
  );
}

export default function ManageQuiz() {
  const [trigger, setTrigger] = useState(0);
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);

  const queryParams = useMemo(() => ({ q }), [q]);

  useEffect(() => {
    const fetchModules = async () => {
      const params = new URLSearchParams({
        page: 1,
        limit: 999,
        q: "",
      });

      const response = await getModulesApi(params);

      if (response?.status === 200) {
        const options = (response?.data?.data || []).map((item) => ({
          value: item.id,
          label: item.title,
        }));

        setModuleOptions(options);
      }
    };

    fetchModules();
  }, []);

  const refreshTable = () => setTrigger((x) => x + 1);

  const openPreviewModal = async (row) => {
    try {
      setLoadingPreview(true);

      const response = await getQuizByIdApi(row.id);

      if (response?.status === 200) {
        setSelectedQuiz(response?.data?.data || null);
        setOpenPreview(true);
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal mengambil detail quiz.",
        });
      }
    } catch (error) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat mengambil detail quiz.",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleEdit = async (row) => {
    try {
      setLoadingSubmit(true);

      const response = await getQuizByIdApi(row.id);

      if (response?.status === 200) {
        setSelectedQuiz(response?.data?.data || null);
        setOpenAdd(true);
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal mengambil detail quiz.",
        });
      }
    } catch (error) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat mengambil detail quiz.",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleSubmitQuiz = async (values) => {
    try {
      setLoadingSubmit(true);

      const payload = {
        judul_quiz: values.title,
        deskripsi_quiz: values.desc,
        is_event: values.isEvent,
        exp_quiz: Number(values.xp),
        id_modul: values.moduleId,
      };

      const response = selectedQuiz?.id
        ? await updateQuizApi(selectedQuiz.id, payload)
        : await createQuizApi(payload);

      if (response?.status === 200 || response?.status === 201) {
        NotifToast({
          type: "success",
          message:
            response?.data?.message ||
            (selectedQuiz?.id
              ? "Quiz berhasil diupdate."
              : "Quiz berhasil ditambahkan."),
        });

        setOpenAdd(false);
        setSelectedQuiz(null);
        refreshTable();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message:
            response?.data?.message ||
            (selectedQuiz?.id
              ? "Gagal mengupdate quiz."
              : "Gagal menambah quiz."),
        });
      }
    } catch (error) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat menyimpan quiz.",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = (row) => {
    setDeletingQuiz(row);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deletingQuiz) return;

    const response = await deleteQuizApi(deletingQuiz.id);

    if (response?.status === 200) {
      NotifToast({
        type: "success",
        message: response?.data?.message || "Quiz berhasil dihapus.",
      });
      setOpenDelete(false);
      setDeletingQuiz(null);
      refreshTable();
    } else {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: response?.data?.message || "Gagal menghapus quiz.",
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "JUDUL QUIZ",
        dataIndex: "title",
        key: "title",
        render: (val) => (
          <Space>
            <ReadOutlined style={{ color: "#69b1ff" }} />
            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>
              {val}
            </Typography.Text>
          </Space>
        ),
      },
      {
  title: "MODUL TERKAIT",
  dataIndex: "module",
  key: "module",
  width: 220,
  render: (val) =>
    val ? (
      <Pill color="rgba(124,92,255,0.18)">{val}</Pill>
    ) : (
      <Pill
        color="rgba(255,149,0,0.18)"
        textColor="#FFD8A8"
      >
        Event
      </Pill>
    ),
},
      {
        title: "EXP",
        dataIndex: "exp",
        key: "exp",
        width: 120,
        render: (val) => (
          <Typography.Text style={{ color: "rgba(230,236,255,0.85)" }}>
            {val || 0} EXP
          </Typography.Text>
        ),
      },
      {
        title: "JUMLAH SOAL",
        dataIndex: "totalQuestion",
        key: "totalQuestion",
        width: 140,
        render: (val) => (
          <Pill color="rgba(58,123,255,0.18)">{val || 0} Soal</Pill>
        ),
      },
      {
        title: "AKSI",
        key: "action",
        width: 90,
        align: "right",
        render: (_, row) => {
          const menuItems = [
            {
              key: "preview",
              icon: <EyeOutlined />,
              label: "Preview",
              onClick: () => openPreviewModal(row),
            },
            {
              key: "edit",
              icon: <EditOutlined />,
              label: "Edit",
              onClick: () => handleEdit(row),
            },
            {
              key: "delete",
              icon: <DeleteOutlined />,
              label: "Hapus",
              danger: true,
              onClick: () => handleDelete(row),
            },
          ];

          return (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                loading={loadingPreview && selectedQuiz?.id === row.id}
                icon={
                  <MoreOutlined style={{ color: "rgba(255,255,255,0.65)" }} />
                }
              />
            </Dropdown>
          );
        },
      },
    ],
    [loadingPreview, selectedQuiz],
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "title", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "Modul", name: "module", color: "purple" },
      r3: { text: "EXP", name: "exp", type: "secondary" },
      r5: { text: "Soal", name: "totalQuestion" },
      r6: { text: "", name: "" },
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
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: "#E6ECFF" }}>
            Manage Quiz
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kelola daftar kuis dan konfigurasi EXP serta jumlah soal.
          </Typography.Text>
        </div>

        <Space>
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={refreshTable}
            prefix={
              <SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
            }
            placeholder="Cari quiz..."
            style={{ width: 260, borderRadius: 14 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 14 }}
            onClick={() => {
              setSelectedQuiz(null);
              setOpenAdd(true);
            }}
          >
            Tambah Quiz
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
          getData={getQuiz}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 1000 }}
          onDataLoaded={() => {}}
        />

        <AddQuizModal
          open={openAdd}
          onClose={() => {
            setOpenAdd(false);
            setSelectedQuiz(null);
          }}
          onSubmit={handleSubmitQuiz}
          initialValues={selectedQuiz || {}}
          loading={loadingSubmit}
          moduleOptions={moduleOptions}
        />

        <PreviewQuizHardcore
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          quiz={selectedQuiz}
        />

        <Modal
          open={openDelete}
          onCancel={() => {
            setOpenDelete(false);
            setDeletingQuiz(null);
          }}
          onOk={confirmDelete}
          centered
          closable={false}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setOpenDelete(false);
                setDeletingQuiz(null);
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
                Hapus Quiz
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
            Apakah yakin ingin menghapus quiz "{deletingQuiz?.title}"?
          </div>
        </Modal>
      </Card>
    </div>
  );
}
