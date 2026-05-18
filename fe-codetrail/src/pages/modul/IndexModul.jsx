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
import {
  PlusOutlined,
  MoreOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddModuleModal from "./component/AddModul.jsx";
import PreviewModuleModal from "./component/DetailModul.jsx";
import {
  getModulesApi,
  getModuleByIdApi,
  deleteModuleApi,
} from "../../components/api/modul";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

// ambil list modul dari API
async function getModules(param) {
  const params = new URLSearchParams(param);
  const response = await getModulesApi(params);

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

function Pill({ color, children }) {
  return (
    <Tag
      style={{
        borderRadius: 999,
        paddingInline: 10,
        paddingBlock: 2,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: color,
        color: "#E6ECFF",
        marginInlineEnd: 6,
      }}
    >
      {children}
    </Tag>
  );
}

export default function Modules() {
  const [trigger, setTrigger] = useState(0);
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deletingModule, setDeletingModule] = useState(null);

  const queryParams = useMemo(() => ({ q }), [q]);

  const refreshTable = () => setTrigger((x) => x + 1);

  const openPreviewModal = async (row) => {
    try {
      setLoadingPreview(true);

      const response = await getModuleByIdApi(row.id);

      if (response?.status === 200) {
        setSelectedModule(response?.data?.data || null);
        setOpenPreview(true);
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal mengambil detail modul.",
        });
      }
    } catch (error) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat mengambil detail modul.",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleEdit = (row) => {
    setSelectedModule(row);
    setOpenAdd(true);
  };

  const handleDelete = (row) => {
    setDeletingModule(row);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deletingModule) return;

    const response = await deleteModuleApi(deletingModule.id);

    if (response?.status === 200) {
      NotifToast({
        type: "success",
        message: response?.data?.message || "Modul berhasil dihapus.",
      });
      setOpenDelete(false);
      setDeletingModule(null);
      refreshTable();
    } else {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: response?.data?.message || "Gagal menghapus modul.",
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "JUDUL MODUL",
        dataIndex: "title",
        key: "title",
        render: (val) => (
          <Space>
            <BookOutlined style={{ color: "#69b1ff" }} />
            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>
              {val}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "DESKRIPSI",
        dataIndex: "desc",
        key: "desc",
        render: (val) => (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {val}
          </Typography.Text>
        ),
      },
      {
        title: "TOTAL KONTEN",
        key: "content",
        render: (_, row) => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Pill color="rgba(58,123,255,0.18)">{row.materi || 0} Materi</Pill>
            <Pill color="rgba(124,92,255,0.18)">{row.kuis || 0} Kuis</Pill>
            <Pill color="rgba(0,201,167,0.18)">{row.puzzle || 0} Puzzle</Pill>
          </div>
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
                loading={loadingPreview && selectedModule?.id === row.id}
                icon={
                  <MoreOutlined style={{ color: "rgba(255,255,255,0.65)" }} />
                }
              />
            </Dropdown>
          );
        },
      },
    ],
    [loadingPreview, selectedModule],
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "title", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "Modul", color: "purple" },
      r3: { name: "desc", type: "secondary" },
      r5: { text: "", name: "" },
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
            Manage Modul
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kelola daftar modul dan materi pembelajaran.
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
            placeholder="Cari modul..."
            style={{ width: 260, borderRadius: 14 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 14 }}
            onClick={() => {
              setSelectedModule(null);
              setOpenAdd(true);
            }}
          >
            Tambah Modul
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
          getData={getModules}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 1000 }}
          onDataLoaded={() => {}}
        />

        <AddModuleModal
          open={openAdd}
          onClose={() => {
            setOpenAdd(false);
            setSelectedModule(null);
          }}
          onSuccess={() => {
            setOpenAdd(false);
            setSelectedModule(null);
            refreshTable();
          }}
          initialValues={selectedModule || { xp: 500, level: "0" }}
        />

        <PreviewModuleModal
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          moduleData={selectedModule}
        />

        <Modal
          open={openDelete}
          onCancel={() => {
            setOpenDelete(false);
            setDeletingModule(null);
          }}
          onOk={confirmDelete}
          centered
          closable={false}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setOpenDelete(false);
                setDeletingModule(null);
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
                Hapus Modul
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
            Apakah yakin ingin menghapus modul "{deletingModule?.title}"?
          </div>
        </Modal>
      </Card>
    </div>
  );
}
