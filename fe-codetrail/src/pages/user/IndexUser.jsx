import React, { useMemo, useState } from "react";
import { Card, Input, Space, Button, Typography, Dropdown, Select, Avatar, Tag } from "antd";
import { PlusOutlined, MoreOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddUserModal from "./component/AddUser.jsx"; 

// ====== DEMO GET DATA (ganti ke API kamu) ======
async function getUsers(param) {
  const params = new URLSearchParams(param);

  const q = (params.get("q") || "").toLowerCase();
  const role = (params.get("role") || "").toLowerCase();

  const all = [
    { id: 1, name: "Bapak Budi", email: "budi.dosen@univ.ac.id", role: "dosen" },
    { id: 2, name: "Andi Pratama", email: "andi.pratama@mhs.univ.ac.id", role: "mahasiswa" },
    { id: 3, name: "Siti Rahma", email: "siti.rahma@mhs.univ.ac.id", role: "mahasiswa" },
    { id: 4, name: "Super Admin", email: "admin@codetrail.com", role: "admin" },
    { id: 5, name: "Dewi Sartika", email: "dewi.sartika@mhs.univ.ac.id", role: "mahasiswa" },
    { id: 6, name: "Rina Susanti", email: "rina.susanti@univ.ac.id", role: "dosen" },
  ];

  let filtered = all.filter((x) => {
    const passQ = !q || x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q);
    const passRole = !role || x.role.toLowerCase() === role;
    return passQ && passRole;
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

function RolePill({ role }) {
  const map = {
    dosen: { label: "Dosen", bg: "rgba(58,123,255,0.18)", color: "#CFE0FF" },
    mahasiswa: { label: "Mahasiswa", bg: "rgba(0,201,167,0.18)", color: "#BFF8EB" },
    admin: { label: "Admin", bg: "rgba(124,92,255,0.18)", color: "#E6ECFF" },
  };
  const cfg = map[role] || { label: role, bg: "rgba(255,255,255,0.08)", color: "#E6ECFF" };

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

  const queryParams = useMemo(() => ({ q, role }), [q, role]);

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
              {row.name}
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
            {val}
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
          const items = [
            { key: "detail", label: "Detail", onClick: () => console.log("detail", row) },
            { key: "edit", label: "Edit", onClick: () => console.log("edit", row) },
            { key: "delete", label: "Hapus", onClick: () => console.log("hapus", row) },
          ];
          return (
            <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                icon={<MoreOutlined style={{ color: "rgba(255,255,255,0.65)" }} />}
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
      r2: { text: "Email", name: "email", type: "secondary" },
      r3: { text: "Role", name: "role", type: "secondary" },
      r5: { text: "", name: "" },
      r6: { text: "", name: "" },
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
            Manajemen User
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Kelola akun admin, dosen, dan mahasiswa.
          </Typography.Text>
        </div>

        <Space>
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={() => setTrigger((x) => x + 1)}
            prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />}
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

      {/* Filter row (Semua Role) */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Select
          value={role || undefined}
          onChange={(v) => {
            setRole(v || "");
            setTrigger((x) => x + 1);
          }}
          allowClear
          placeholder={
            <span style={{ color: "rgba(230,236,255,0.75)" }}>
              <FilterOutlined />&nbsp; Semua Role
            </span>
          }
          style={{ minWidth: 170, borderRadius: 14 }}
          options={[
            { label: "Admin", value: "admin" },
            { label: "Dosen", value: "dosen" },
            { label: "Mahasiswa", value: "mahasiswa" },
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
  onClose={() => setOpenAdd(false)}
  onSubmit={(values) => {
    console.log(values);
    setOpenAdd(false);
  }}
/>;
      </Card>
    </div>
  );
}
