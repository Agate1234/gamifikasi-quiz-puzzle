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
  Modal,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddUserModal from "./component/AddUser.jsx";
import DetailUserModal from "./component/DetailUser.jsx";
import {
  getUsersApi,
  getUserByIdApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from "../../components/api/user.jsx";
import { NotifAlert, NotifToast } from "../../components/global/ToastNotif";

async function getUsers(param) {
  const params = new URLSearchParams(param);
  const response = await getUsersApi(params);

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

function initials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function RolePill({ role }) {
  const normalized = String(role || "").toLowerCase();

  const map = {
    dosen: {
      label: "Dosen",
      bg: "rgba(58,123,255,0.18)",
      color: "#CFE0FF",
    },
    mahasiswa: {
      label: "Mahasiswa",
      bg: "rgba(0,201,167,0.18)",
      color: "#BFF8EB",
    },
    admin: {
      label: "Admin",
      bg: "rgba(124,92,255,0.18)",
      color: "#E6ECFF",
    },
    superadmin: {
      label: "Super Admin",
      bg: "rgba(124,92,255,0.18)",
      color: "#E6ECFF",
    },
  };

  const cfg = map[normalized] || {
    label: role || "-",
    bg: "rgba(255,255,255,0.08)",
    color: "#E6ECFF",
  };

  return (
    <Tag
      style={{
        borderRadius: 999,
        paddingInline: 12,
        paddingBlock: 3,
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
      }}
    >
      {cfg.label}
    </Tag>
  );
}

export default function ManageUser() {
  const [trigger, setTrigger] = useState(0);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  const queryParams = useMemo(() => ({ q, role }), [q, role]);

  const refreshTable = () => setTrigger((prev) => prev + 1);

  const openDetailModal = async (row) => {
    const idUser = row.id_user || row.id;

    if (!idUser) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "ID user tidak ditemukan.",
      });
      return;
    }

    try {
      setLoadingDetail(true);
      setDetailUser(null);

      const response = await getUserByIdApi(idUser);

      if (response?.status === 200) {
        setDetailUser(response?.data?.data || null);
        setOpenDetail(true);
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal mengambil detail user.",
        });
      }
    } catch {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat mengambil detail user.",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleEdit = async (row) => {
    const idUser = row.id_user || row.id;

    if (!idUser) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "ID user tidak ditemukan.",
      });
      return;
    }

    try {
      setSubmitLoading(true);

      const response = await getUserByIdApi(idUser);

      if (response?.status === 200) {
        setSelectedUser(response?.data?.data || row);
        setOpenAdd(true);
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: response?.data?.message || "Gagal mengambil data user.",
        });
      }
    } catch {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat mengambil data user.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (row) => {
    setDeletingUser(row);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    const idUser = deletingUser?.id_user || deletingUser?.id;

    if (!idUser) {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "ID user tidak ditemukan.",
      });
      return;
    }

    const response = await deleteUserApi(idUser);

    if (response?.status === 200) {
      NotifToast({
        type: "success",
        message: response?.data?.message || "User berhasil dihapus.",
      });

      setOpenDelete(false);
      setDeletingUser(null);
      refreshTable();
    } else {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: response?.data?.message || "Gagal menghapus user.",
      });
    }
  };

  const handleSubmitUser = async (values) => {
    try {
      setSubmitLoading(true);

      const idUser = selectedUser?.id_user || selectedUser?.id;

      const response = idUser
        ? await updateUserApi(idUser, values)
        : await createUserApi(values);

      if (
        response?.status >= 200 &&
        response?.status < 300 &&
        response?.data?.success !== false
      ) {
        NotifToast({
          type: "success",
          message:
            response?.data?.message ||
            (idUser ? "User berhasil diupdate." : "User berhasil ditambahkan."),
        });

        setOpenAdd(false);
        setSelectedUser(null);
        refreshTable();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message:
            response?.data?.message ||
            (idUser ? "Gagal mengupdate user." : "Gagal menambahkan user."),
        });
      }
    } catch {
      NotifAlert({
        icon: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat menyimpan user.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "NAMA",
        key: "name",
        render: (_, row) => (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={34}
              style={{
                background: "rgba(124,92,255,0.18)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#E6ECFF",
                fontWeight: 800,
              }}
            >
              {initials(row.name || row.nama_user)}
            </Avatar>

            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
              {row.name || row.nama_user || "-"}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: "EMAIL",
        dataIndex: "email",
        key: "email",
        render: (val) => (
          <Typography.Text style={{ color: "rgba(230,236,255,0.75)" }}>
            {val || "-"}
          </Typography.Text>
        ),
      },
      {
        title: "ROLE",
        dataIndex: "role",
        key: "role",
        width: 180,
        render: (_, row) => <RolePill role={row.role || row.nama_role} />,
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
              label: "Detail",
              onClick: () => openDetailModal(row),
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
        name: "name",
        style: {
          fontWeight: 800,
          color: "#E6ECFF",
        },
      },
      r2: {
        text: "Email",
        name: "email",
        type: "secondary",
      },
      r3: {
        text: "Role",
        name: "role",
        type: "secondary",
      },
      r5: {
        text: "",
        name: "",
      },
      r6: {
        text: "",
        name: "",
      },
      actionLabel: "Detail",
      action: (item) => openDetailModal(item),
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
            Manajemen User
          </Typography.Title>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kelola akun dosen dan mahasiswa.
          </Typography.Text>
        </div>

        <Space wrap>
          <Input
            allowClear
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onPressEnter={refreshTable}
            prefix={
              <SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
            }
            placeholder="Cari user..."
            style={{ width: 260, borderRadius: 14 }}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 14 }}
            onClick={() => {
              setSelectedUser(null);
              setOpenAdd(true);
            }}
          >
            Tambah User Baru
          </Button>
        </Space>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Select
          value={role || undefined}
          onChange={(value) => {
            setRole(value || "");
            refreshTable();
          }}
          allowClear
          placeholder={
            <span style={{ color: "rgba(230,236,255,0.75)" }}>
              <FilterOutlined />
              &nbsp; Semua Role
            </span>
          }
          style={{ minWidth: 170, borderRadius: 14 }}
          options={[
            {
              label: "Dosen",
              value: "dosen",
            },
            {
              label: "Mahasiswa",
              value: "mahasiswa",
            },
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
          getData={getUsers}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 950 }}
          onDataLoaded={() => {}}
        />
        <AddUserModal
          open={openAdd}
          onClose={() => {
            setOpenAdd(false);
            setSelectedUser(null);
          }}
          onSubmit={handleSubmitUser}
          loading={submitLoading}
          initialValues={selectedUser}
        />

        <DetailUserModal
          open={openDetail}
          onClose={() => {
            setOpenDetail(false);
            setDetailUser(null);
          }}
          userData={detailUser}
          loading={loadingDetail}
        />

        <Modal
          open={openDelete}
          onCancel={() => {
            setOpenDelete(false);
            setDeletingUser(null);
          }}
          onOk={confirmDelete}
          centered
          closable={false}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setOpenDelete(false);
                setDeletingUser(null);
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
                Hapus User
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
            Apakah yakin ingin menghapus user "
            {deletingUser?.name || deletingUser?.nama_user}"?
          </div>
        </Modal>
      </Card>
    </div>
  );
}
