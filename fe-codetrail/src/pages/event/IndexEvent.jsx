import React, { useMemo, useState } from "react";
import { Card, Input, Space, Button, Typography, Dropdown } from "antd";
import { PlusOutlined, MoreOutlined, SearchOutlined } from "@ant-design/icons";
import TableList from "../../components/global/TableList.jsx";
import AddEventModal from "./component/AddEvent.jsx";

// ====== DEMO GET DATA (ganti ke API kamu) ======
async function getEvents(param) {
  const params = new URLSearchParams(param);

  const q = (params.get("q") || "").toLowerCase();

  const all = [
    {
      id: 1,
      title: "Webinar: Pengenalan Data Science",
      startAt: "2023-10-16T09:00:00Z",
      endAt: "2023-10-16T11:00:00Z",
    },
    {
      id: 2,
      title: "CodeTrail Winter Hackathon 2023",
      startAt: "2023-11-01T09:00:00Z",
      endAt: "2023-11-03T09:00:00Z",
    },
    {
      id: 3,
      title: "Workshop: Menguasai Algoritma",
      startAt: "2023-11-10T13:00:00Z",
      endAt: "2023-11-10T16:00:00Z",
    },
    {
      id: 4,
      title: "Guest Lecture: Future of AI",
      startAt: "2023-11-15T10:00:00Z",
      endAt: "2023-11-15T11:30:00Z",
    },
    {
      id: 5,
      title: "Kompetisi Debugging Nasional",
      startAt: "2023-11-20T09:00:00Z",
      endAt: "2023-11-20T14:00:00Z",
    },
  ];

  const filtered = q
    ? all.filter((x) => x.title.toLowerCase().includes(q))
    : all;

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

// ====== date formatter (biar sesuai screenshot) ======
function formatIDDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = d.toLocaleString("id-ID", { month: "short" }); // Okt, Nov, dst
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${dd} ${mm} ${yyyy}, ${hh}:${mi}`;
}

export default function ManageEvent() {
  const [trigger, setTrigger] = useState(0);
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);

  const queryParams = useMemo(() => ({ q }), [q]);

  const columns = useMemo(
    () => [
      {
        title: "JUDUL EVENT",
        dataIndex: "title",
        key: "title",
        render: (val) => (
          <Typography.Text style={{ color: "#E6ECFF", fontWeight: 700 }}>
            {val}
          </Typography.Text>
        ),
      },
      {
        title: "START DATE",
        dataIndex: "startAt",
        key: "startAt",
        width: 220,
        render: (val) => (
          <Typography.Text style={{ color: "rgba(230,236,255,0.85)" }}>
            {formatIDDateTime(val)}
          </Typography.Text>
        ),
      },
      {
        title: "END DATE",
        dataIndex: "endAt",
        key: "endAt",
        width: 220,
        render: (val) => (
          <Typography.Text style={{ color: "rgba(230,236,255,0.85)" }}>
            {formatIDDateTime(val)}
          </Typography.Text>
        ),
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
              onClick: () => console.log("detail", row),
            },
            {
              key: "edit",
              label: "Edit",
              onClick: () => console.log("edit", row),
            },
            {
              key: "delete",
              label: "Hapus",
              onClick: () => console.log("hapus", row),
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
    []
  );

  const mobile = useMemo(
    () => ({
      r1: { name: "title", style: { fontWeight: 800, color: "#E6ECFF" } },
      r2: { text: "Start", name: "startAt", type: "secondary" },
      r3: { text: "End", name: "endAt", type: "secondary" },
      r5: { text: "", name: "" },
      r6: { text: "", name: "" },
      actionLabel: "Detail",
      action: (item) => console.log("detail mobile", item),
    }),
    []
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header page */}
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
            Manage Event
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Jadwal acara, webinar, dan kompetisi coding.
          </Typography.Text>
        </div>

        <Space>
          <Input
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={() => setTrigger((x) => x + 1)}
            prefix={
              <SearchOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
            }
            placeholder="Cari event..."
            style={{ width: 260, borderRadius: 14 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ borderRadius: 14 }}
            onClick={() => setOpenAdd(true)}
          >
            Buat Event Baru
          </Button>
        </Space>
      </div>

      {/* Container table */}
      <Card
        style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <TableList
          getData={getEvents}
          queryParams={queryParams}
          columns={columns}
          trigger={trigger}
          mobile={mobile}
          tableScroll={{ y: 520, x: 1000 }}
          onDataLoaded={() => {}}
        />

        <AddEventModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onSubmit={(vals) => {
            console.log(vals);
            setOpenAdd(false);
          }}
        />
      </Card>
    </div>
  );
}
