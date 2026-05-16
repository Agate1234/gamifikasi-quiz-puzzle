import React, { memo, useEffect, useMemo, useState } from "react";
import { Table, Pagination, Row, Col, Card, Grid, Button, Typography, Tag, Empty } from "antd";
import { EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

const defaultMobile = {
  r1: { style: { fontWeight: 700, fontSize: 13 }, text: "", name: "" },
  r2: { style: { marginLeft: 8, fontSize: 13 }, color: "success", text: "", name: "" },
  r3: { style: { fontSize: 12 }, type: "secondary", text: "", name: "" },
  r4: { style: { fontSize: 12 }, type: "secondary", text: "", name: "" },
  r5: { style: { fontSize: 12 }, type: "secondary", text: "", name: "" },
  r6: { style: { fontSize: 12 }, type: "secondary", text: "", name: "" },
  actionLabel: "Detail",
  actionIcon: <EyeOutlined />,
  action: () => {},
};

function safeParseResponse(res) {
  // Support axios-like response OR plain object
  const payload = res?.data ?? res;

  // beberapa variasi umum dari backend
  const list =
    payload?.data?.data ??
    payload?.data ??
    payload?.items ??
    payload?.result ??
    [];

  const paging =
    payload?.paging ??
    payload?.data?.paging ??
    payload?.pagination ??
    payload?.meta ??
    {};

  const total =
    payload?.total ??
    payload?.data?.total ??
    paging?.total ??
    list?.length ??
    0;

  const page =
    paging?.page ??
    payload?.page ??
    1;

  const limit =
    paging?.limit ??
    payload?.limit ??
    10;

  const pageTotal =
    paging?.page_total ??
    payload?.page_total ??
    (limit ? Math.ceil(total / limit) : 1);

  return {
    list: Array.isArray(list) ? list : [],
    paging: {
      total,
      page,
      limit,
      pageTotal,
    },
  };
}

const TableList = memo(function TableList({
  getData,
  queryParams = {},
  columns = [],
  trigger,
  mobile = null, // kalau diisi => mode card di mobile
  rowSelection = null,
  rowKey = "id",
  tableScroll = { y: 520, x: 1300 },
  cardStyle,
  onDataLoaded, // optional callback(dataList)
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [pagingInfo, setPagingInfo] = useState({
    totalData: 0,
    perPage: 0,
    totalPage: 0,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const mobileCfg = useMemo(() => ({ ...defaultMobile, ...(mobile || {}) }), [mobile]);

  useEffect(() => {
    // fetch pertama atau saat trigger berubah
    fetchList(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const fetchList = async (page, pageSize) => {
    setLoading(true);

    try {
      const param = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        ...Object.fromEntries(
          Object.entries(queryParams || {}).map(([k, v]) => [k, v == null ? "" : String(v)])
        ),
      });

      const res = await getData(param);

      const parsed = safeParseResponse(res);

      setData(parsed.list);

      setPagingInfo({
        totalData: parsed.paging.total,
        perPage: parsed.paging.pageTotal,
        totalPage: parsed.paging.limit,
      });

      setPagination((prev) => ({
        ...prev,
        current: parsed.paging.page,
        pageSize: parsed.paging.limit,
        total: parsed.paging.total,
      }));

      if (typeof onDataLoaded === "function") onDataLoaded(parsed.list);
    } catch (e) {
      // kalau error, kosongin data biar aman
      setData([]);
      setPagingInfo({ totalData: 0, perPage: 0, totalPage: 0 });
      setPagination((prev) => ({ ...prev, total: 0 }));
      // kamu bisa tambah notif error di sini kalau punya global toast
      // console.error(e);
    } finally {
      // biar loading smooth (opsional)
      setTimeout(() => setLoading(false), 250);
    }
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
    fetchList(page, pageSize);
  };

  // ====== MOBILE CARD RENDER ======
  if (isMobile && mobile) {
    if (!data?.length && !loading) {
      return <Empty description="Tidak ada data" />;
    }

    return (
      <Row gutter={16}>
        <Col xs={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.map((item, idx) => (
              <Card
                key={item?.[rowKey] ?? idx}
                loading={loading}
                style={{
                  width: "100%",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  ...(cardStyle || {}),
                }}
                title={
                  (mobileCfg.r1 || mobileCfg.r2) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {mobileCfg.r1 && (
                        <span style={mobileCfg.r1.style || {}}>
                          {mobileCfg.r1.name ? item?.[mobileCfg.r1.name] : mobileCfg.r1.text}
                        </span>
                      )}
                      {mobileCfg.r2 && (
                        <Tag color={mobileCfg.r2.color || ""} style={mobileCfg.r2.style || {}}>
                          {mobileCfg.r2.name ? item?.[mobileCfg.r2.name] : mobileCfg.r2.text}
                        </Tag>
                      )}
                    </div>
                  )
                }
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(mobileCfg.r3 || mobileCfg.r4) && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      {mobileCfg.r3 && (
                        <Text type={mobileCfg.r3.type || "secondary"} style={mobileCfg.r3.style || {}}>
                          {mobileCfg.r3.name ? item?.[mobileCfg.r3.name] : mobileCfg.r3.text}
                        </Text>
                      )}
                      {mobileCfg.r4 && (
                        <Text type={mobileCfg.r4.type || "secondary"} style={mobileCfg.r4.style || {}}>
                          {mobileCfg.r4.name ? item?.[mobileCfg.r4.name] : mobileCfg.r4.text}
                        </Text>
                      )}
                    </div>
                  )}

                  {mobileCfg.r5 && (
                    <Text type={mobileCfg.r5.type || "secondary"} style={mobileCfg.r5.style || {}}>
                      {mobileCfg.r5.name ? item?.[mobileCfg.r5.name] : mobileCfg.r5.text}
                    </Text>
                  )}

                  {mobileCfg.r6 && (
                    <Text type={mobileCfg.r6.type || "secondary"} style={mobileCfg.r6.style || {}}>
                      {mobileCfg.r6.name ? item?.[mobileCfg.r6.name] : mobileCfg.r6.text}
                    </Text>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    paddingTop: 10,
                    textAlign: "right",
                  }}
                >
                  <Button
                    type="primary"
                    size="small"
                    shape="round"
                    icon={mobileCfg.actionIcon}
                    onClick={() => mobileCfg.action(item)}
                  >
                    {mobileCfg.actionLabel || "Detail"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination di mobile juga tetap ada */}
          <div style={{ marginTop: 14 }}>
            <Pagination
              showSizeChanger
              onChange={handlePaginationChange}
              onShowSizeChange={handlePaginationChange}
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
            />
          </div>
        </Col>
      </Row>
    );
  }

  // ====== DESKTOP TABLE RENDER ======
  return (
    <Row gutter={16}>
      <Col xs={24}>
        <Table
          rowSelection={rowSelection || null}
          columns={columns}
          dataSource={(data || []).map((item, index) => ({
            ...item,
            key: item?.[rowKey] ?? index,
          }))}
          pagination={false}
          loading={loading}
          scroll={tableScroll}
          style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      </Col>

      <Col xs={24} style={{ marginTop: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ color: "rgba(255,255,255,0.7)" }}>
              Menampilkan <b>{pagingInfo.totalData}</b> data
            </div>
          </Col>
          <Col>
            <Pagination
              showSizeChanger
              onChange={handlePaginationChange}
              onShowSizeChange={handlePaginationChange}
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
            />
          </Col>
        </Row>
      </Col>
    </Row>
  );
});

export default TableList;
