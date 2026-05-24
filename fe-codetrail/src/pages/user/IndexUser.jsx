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
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddUserModal from "./component/AddUser.jsx";
import {
  getUsersApi,
  createUserApi,
  deleteUserApi,
} from "../../components/api/user.jsx";

function initials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
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
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const queryParams = useMemo(() => ({ q, role }), [q, role]);

  const handleCreateUser = async (values) => {
    setSubmitLoading(true);

    const response = await createUserApi(values);

    if (
      response.status >= 200 &&
      response.status < 300 &&
      response.data?.success !== false
    ) {
      message.success(response.data?.message || "User berhasil ditambahkan");
      setOpenAdd(false);
      setTrigger((prev) => prev + 1);
    } else {
      message.error(response.data?.message || "Gagal menambahkan user");
    }

    setSubmitLoading(false);
  };

  const handleDeleteUser = async (row) => {
    const idUser = row.id_user || row.id;

    if (!idUser) {
      message.error("ID user tidak ditemukan");
      return;
    }

    setDeleteLoadingId(idUser);

    const response = await deleteUserApi(idUser);

    if (
      response.status >= 200 &&
      response.status < 300 &&
      response.data?.success !== false
    ) {
      message.success(response.data?.message || "User berhasil dihapus");
      setTrigger((prev) => prev + 1);
    } else {
      message.error(response.data?.message || "Gagal menghapus user");
    }

    setDeleteLoadingId(null);
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
              {initials(row.name)}
            </Avatar>

            <Typography.Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
              {row.name || "-"}
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
        render: (val) => <RolePill role={val} />,
      },
      {
        title: "AKSI",
        key: "action",
        width: 80,
        align: "right",
        render: (_, row) => {
          const idUser = row.id_user || row.id;

          const menuItems = [
            {
              key: "detail",
              label: "Detail",
              onClick: () => {
                console.log("detail", row);
              },
            },
            {
              key: "delete",
              label: (
                <Popconfirm
                  title="Hapus user?"
                  description={`Yakin ingin menghapus ${row.name || "user ini"}?`}
                  okText="Hapus"
                  cancelText="Batal"
                  okButtonProps={{
                    danger: true,
                    loading: deleteLoadingId === idUser,
                  }}
                  onConfirm={() => handleDeleteUser(row)}
                >
                  <span style={{ color: "#ff7875" }}>Hapus</span>
                </Popconfirm>
              ),
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
    [deleteLoadingId],
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
      action: (item) => console.log("detail mobile", item),
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
            onPressEnter={() => setTrigger((prev) => prev + 1)}
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
            onClick={() => setOpenAdd(true)}
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
            setTrigger((prev) => prev + 1);
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

        <Button
          onClick={() => setTrigger((prev) => prev + 1)}
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
          getData={getUsersApi}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 950 }}
          onDataLoaded={() => {}}
        />

        <AddUserModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onSubmit={handleCreateUser}
          loading={submitLoading}
        />
      </Card>
    </div>
  );
}