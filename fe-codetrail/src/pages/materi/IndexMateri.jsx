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
} from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddMateriModal from "./component/AddMateri.jsx";
import DetailMateriModal from "./component/DetailMateri.jsx";
import { getMateriApi, deleteMateriApi } from "../../components/api/materi";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

// ====== GET DATA ======
async function getMateri(param) {
  const params = new URLSearchParams(param);
  const response = await getMateriApi(params);

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

function Pill({ children, color = "rgba(124,92,255,0.18)" }) {
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

export default function Materi() {
  const [trigger, setTrigger] = useState(0);
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deletingMateri, setDeletingMateri] = useState(null);
  const [selectedMateri, setSelectedMateri] = useState(null);

  const queryParams = useMemo(() => ({ q }), [q]);

  const refreshTable = () => setTrigger((x) => x + 1);

  const openPreviewModal = (row) => {
    setSelectedMateri(row);
    setOpenPreview(true);
  };

  const handleEdit = (row) => {
    setSelectedMateri(row);
    setOpenAdd(true);
  };

  const handleDelete = (row) => {
    setDeletingMateri(row);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deletingMateri) return;

    const response = await deleteMateriApi(deletingMateri.id_materi);

    if (response?.status === 200) {
      NotifToast({
        type: "success",
        message: response?.data?.message || "Materi berhasil dihapus.",
      });
      setOpenDelete(false);
      setDeletingMateri(null);
      refreshTable();
    } else {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: response?.data?.message || "Gagal menghapus materi.",
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "JUDUL MATERI",
        dataIndex: "judul_materi",
        key: "judul_materi",
        render: (val) => (
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>
            {val}
          </Typography.Text>
        ),
      },
      {
        title: "MODUL TERKAIT",
        dataIndex: "judul_modul",
        key: "judul_modul",
        width: 300,
        render: (val) => <Pill>{val}</Pill>,
      },
      {
        title: "DESKRIPSI",
        dataIndex: "deskripsi_materi",
        key: "deskripsi_materi",
        render: (val) => (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {val || "-"}
          </Typography.Text>
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
              key: "detail",
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
      r1: {
        name: "judul_materi",
        style: { fontWeight: 800, color: "#E6ECFF" },
      },
      r2: { text: "Modul", name: "judul_modul", color: "purple" },
      r3: { name: "deskripsi_materi", type: "secondary" },
      r5: { text: "", name: "" },
      r6: { text: "", name: "" },
      actionLabel: "Detail",
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
            Manajemen Materi
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kelola daftar materi pembelajaran untuk mahasiswa.
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
            placeholder="Cari materi..."
            style={{ width: 260, borderRadius: 14 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 14 }}
            onClick={() => {
              setSelectedMateri(null);
              setOpenAdd(true);
            }}
          >
            Buat Materi Baru
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
          getData={getMateri}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 1100 }}
          onDataLoaded={() => {}}
        />

        <AddMateriModal
          open={openAdd}
          onClose={() => {
            setOpenAdd(false);
            setSelectedMateri(null);
          }}
          onSuccess={() => {
            setOpenAdd(false);
            setSelectedMateri(null);
            refreshTable();
          }}
          initialValues={selectedMateri}
        />

        <DetailMateriModal
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          materiData={selectedMateri}
        />

        <Modal
          open={openDelete}
          onCancel={() => {
            setOpenDelete(false);
            setDeletingMateri(null);
          }}
          centered
          closable={false}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setOpenDelete(false);
                setDeletingMateri(null);
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
                color: "#FFFFFF",
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
                Hapus Materi
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
            Apakah yakin ingin menghapus materi "{deletingMateri?.judul_materi}
            "?
          </div>
        </Modal>
      </Card>
    </div>
  );
}
