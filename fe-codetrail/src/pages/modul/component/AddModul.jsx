import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Typography, Row, Col, Button } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  createModuleApi,
  updateModuleApi,
} from "../../../components/api/modul";
import {
  NotifAlert,
  NotifToast,
} from "../../../components/Global/ToastNotif";

const { Text } = Typography;

export default function AddModuleModal({
  open,
  onClose,
  onSuccess,
  initialValues,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(initialValues?.id);

  const levelLabel = useMemo(() => {
    if (initialValues?.level !== undefined && initialValues?.level !== null) {
      return `Level ${initialValues.level}`;
    }
    return "Level otomatis";
  }, [initialValues]);

  useEffect(() => {
    if (!open) return;

    form.resetFields();

    form.setFieldsValue({
      title: initialValues?.title || "",
      desc: initialValues?.desc || "",
      xp: initialValues?.xp ?? initialValues?.exp_modul ?? 500,
      level: levelLabel,
    });
  }, [open, initialValues, form, levelLabel]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        judul: values.title,
        deskripsi: values.desc,
        exp_modul: Number(values.xp),
      };

      setLoading(true);

      const response = isEdit
        ? await updateModuleApi(initialValues.id, payload)
        : await createModuleApi(payload);

      if (response?.status === 200 || response?.status === 201) {
        NotifToast({
          type: "success",
          message:
            response?.data?.message ||
            (isEdit
              ? "Modul berhasil diperbarui."
              : "Modul berhasil ditambahkan."),
        });

        form.resetFields();
        onSuccess?.();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message:
            response?.data?.message ||
            (isEdit
              ? "Gagal mengubah modul."
              : "Gagal menambahkan modul."),
        });
      }
    } catch (error) {
      if (error?.errorFields) return;

      NotifAlert({
        icon: "error",
        title: "Terjadi Kesalahan",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Terjadi kesalahan saat menyimpan modul.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
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
        body: { padding: 0 },
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
              background: isEdit
                ? "rgba(250,173,20,0.18)"
                : "rgba(124,92,255,0.18)",
              border: isEdit
                ? "1px solid rgba(250,173,20,0.25)"
                : "1px solid rgba(124,92,255,0.25)",
              color: isEdit ? "#faad14" : "#7C5CFF",
            }}
          >
            {isEdit ? <EditOutlined /> : <PlusOutlined />}
          </div>

          <Text style={{ color: "#E6ECFF", fontWeight: 800 }}>
            {isEdit ? "Edit Modul" : "Tambah Modul Baru"}
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
            desc: "",
            level: "Level otomatis",
            xp: 500,
          }}
        >
          <Form.Item
            label={
              <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                Judul Modul
              </Text>
            }
            name="title"
            rules={[{ required: true, message: "Judul modul wajib diisi" }]}
          >
            <Input
              placeholder="Contoh: Algoritma Pencarian Tingkat Lanjut"
              style={{
                borderRadius: 12,
                background: "rgba(10,16,28,0.55)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#E6ECFF",
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                Deskripsi Modul
              </Text>
            }
            name="desc"
            rules={[{ required: true, message: "Deskripsi modul wajib diisi" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Jelaskan secara singkat apa yang akan dipelajari dalam modul ini..."
              style={{
                borderRadius: 12,
                background: "rgba(10,16,28,0.55)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#E6ECFF",
                resize: "none",
              }}
            />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Deskripsi akan muncul di halaman detail materi mahasiswa.
          </Text>

          <div style={{ height: 14 }} />

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span>
                    <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                      Level Modul
                    </Text>{" "}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      (otomatis)
                    </Text>
                  </span>
                }
                name="level"
              >
                <Input
                  disabled
                  style={{
                    borderRadius: 12,
                    background: "rgba(10,16,28,0.35)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(230,236,255,0.7)",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                    XP Modul
                  </Text>
                }
                name="xp"
                rules={[
                  { required: true, message: "XP wajib diisi" },
                  {
                    validator: (_, value) => {
                      const num = Number(value);
                      if (Number.isNaN(num) || num < 0) {
                        return Promise.reject(
                          new Error("XP harus berupa angka minimal 0")
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  type="number"
                  prefix={
                    <span
                      style={{
                        fontSize: 12,
                        color: "#7C5CFF",
                        background: "rgba(124,92,255,0.14)",
                        border: "1px solid rgba(124,92,255,0.22)",
                        padding: "2px 8px",
                        borderRadius: 999,
                        marginRight: 6,
                      }}
                    >
                      XP
                    </span>
                  }
                  placeholder="Contoh: 500"
                  style={{
                    borderRadius: 12,
                    background: "rgba(10,16,28,0.55)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#E6ECFF",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Level ditentukan otomatis oleh sistem. XP diberikan saat mahasiswa
            menyelesaikan modul.
          </Text>
        </Form>
      </div>

      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "flex-end",
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
          onClick={handleSubmit}
          style={{ borderRadius: 12 }}
        >
          {isEdit ? "Update Modul" : "Simpan Modul"}
        </Button>
      </div>
    </Modal>
  );
}