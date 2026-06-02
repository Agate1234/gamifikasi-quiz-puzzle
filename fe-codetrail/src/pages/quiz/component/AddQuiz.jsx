import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Typography,
  Row,
  Col,
  Button,
  Select,
  Switch,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function AddQuizModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  loading = false,
  moduleOptions = [],
}) {
  const [form] = Form.useForm();
  const isEvent = false;

  const isEdit = Boolean(initialValues?.id);

  useEffect(() => {
    if (open) {
      form.resetFields();

      const mappedValues = {
        title: initialValues?.title || "",
        moduleId:
          initialValues?.id_modul || initialValues?.moduleId || undefined,
        desc: initialValues?.desc || "",
        xp: initialValues?.exp ?? initialValues?.xp ?? 100,
      };

      // Event dimatikan sementara, jadi nilainya selalu false.
      form.setFieldsValue(mappedValues);
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      onSubmit?.({
  ...values,
  moduleId: values.moduleId,
  isEvent: false,
  is_event: false,
});
    } catch {}
  };

  const inputStyle = {
    borderRadius: 12,
    background: "rgba(10,16,28,0.55)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#E6ECFF",
  };

  const labelStyle = { color: "rgba(255,255,255,0.85)" };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      closeIcon={
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>×</span>
      }
      styles={{
        content: {
          padding: 0,
          borderRadius: 14,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(20,30,46,0.98) 0%, rgba(23,33,50,0.98) 55%, rgba(18,27,42,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        },
        header: { display: "none" },
        body: { padding: 0, background: "transparent" },
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "rgba(124,92,255,0.18)",
              border: "1px solid rgba(124,92,255,0.25)",
              color: "#7C5CFF",
            }}
          >
            {isEdit ? <EditOutlined /> : <PlusOutlined />}
          </div>
          <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
            {isEdit ? "Edit Kuis" : "Tambah Kuis Baru"}
          </Text>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            title: "",
            moduleId: undefined,
            desc: "",
            xp: 100,
          }}
        >
          <Form.Item
            label={<Text style={labelStyle}>Judul Kuis</Text>}
            name="title"
            rules={[{ required: true, message: "Judul kuis wajib diisi" }]}
          >
            <Input
              placeholder="Contoh: Kuis Logika Pemrograman Dasar"
              style={inputStyle}
            />
          </Form.Item>

          <Form.Item
            label={<Text style={labelStyle}>Modul Terkait</Text>}
            name="moduleId"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (isEvent) return Promise.resolve();
                  if (value) return Promise.resolve();
                  return Promise.reject(new Error("Pilih modul terkait"));
                },
              }),
            ]}
          >
            <Select
              placeholder={
                isEvent
                  ? "Event aktif, modul tidak digunakan"
                  : "Pilih modul terkait..."
              }
              options={moduleOptions}
              style={{ width: "100%" }}
              disabled={isEvent}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label={<Text style={labelStyle}>Deskripsi Kuis</Text>}
            name="desc"
            rules={[{ required: true, message: "Deskripsi kuis wajib diisi" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Jelaskan tujuan kuis dan materi yang dicakup..."
              style={{
                ...inputStyle,
                resize: "none",
              }}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={15} md={3}>
  <Form.Item label={<Text style={labelStyle}>Event</Text>}>
    <Space>
      <Switch checked={false} disabled />
    </Space>
  </Form.Item>
</Col>

            <Col xs={15} md={12}>
              <Form.Item
                label={<Text style={labelStyle}>XP (Poin)</Text>}
                name="xp"
                rules={[
                  { required: true, message: "XP wajib diisi" },
                  {
                    type: "number",
                    transform: (v) => Number(v),
                    min: 0,
                    message: "XP minimal 0",
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder="e.g. 100"
                  suffix={
                    <span
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                      }}
                    >
                      XP
                    </span>
                  }
                  style={inputStyle}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          background: "transparent",
          borderTop: "none",
        }}
      >
        <Button
          onClick={onClose}
          style={{
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          Batal
        </Button>

        <Button
          type="primary"
          loading={loading}
          onClick={handleOk}
          style={{ borderRadius: 12 }}
        >
          {isEdit ? "Update Kuis" : "Simpan Kuis"}
        </Button>
      </div>
    </Modal>
  );
}
