import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Typography, Button, Select } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export default function AddUserModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [form] = Form.useForm();
  const [showPass, setShowPass] = useState(false);

  const roleOptions = [
    {
      value: 2,
      label: "Dosen",
    },
    {
      value: 3,
      label: "Mahasiswa",
    },
  ];

  const styles = useMemo(() => {
    const input = {
      borderRadius: 12,
      background: "rgba(10,16,28,0.55)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#E6ECFF",
    };

    return {
      content: {
        padding: 0,
        borderRadius: 14,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(20,30,46,0.98) 0%, rgba(23,33,50,0.98) 55%, rgba(18,27,42,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
      },
      header: {
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "transparent",
      },
      label: {
        color: "rgba(255,255,255,0.85)",
      },
      subtle: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 12,
        marginTop: 6,
      },
      input,
      footer: {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        background: "transparent",
        borderTop: "none",
      },
      closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.75)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        fontSize: 18,
        lineHeight: 1,
      },
      leftIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(230,236,255,0.85)",
      },
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    setShowPass(false);
    form.resetFields();
    form.setFieldsValue({
      nama_user: "",
      email: "",
      password: "",
      id_role: undefined,
    });
  }, [open, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      onSubmit?.({
        nama_user: values.nama_user,
        email: values.email,
        password: values.password,
        id_role: values.id_role,
        no_badge: [],
      });
    } catch {}
  };

  return (
    <Modal
      open={open}
      footer={null}
      centered
      width={520}
      closable={false}
      maskClosable
      keyboard
      destroyOnClose
      onCancel={onClose}
      styles={{
        content: styles.content,
        body: {
          padding: 0,
          background: "transparent",
        },
      }}
    >
      <div style={styles.header}>
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
            <UserOutlined />
          </div>

          <Text style={{ color: "#E6ECFF", fontWeight: 900 }}>
            Tambah User Baru
          </Text>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClose?.();
          }}
          style={styles.closeBtn}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<Text style={styles.label}>Nama Lengkap</Text>}
            name="nama_user"
            rules={[
              {
                required: true,
                message: "Nama lengkap wajib diisi",
              },
            ]}
          >
            <Input
              placeholder="Masukkan nama lengkap user..."
              prefix={
                <span style={styles.leftIconWrap}>
                  <UserOutlined />
                </span>
              }
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            label={<Text style={styles.label}>Email Address</Text>}
            name="email"
            rules={[
              {
                required: true,
                message: "Email wajib diisi",
              },
              {
                type: "email",
                message: "Format email tidak valid",
              },
            ]}
            extra={
              <span style={styles.subtle}>
                Pastikan format email valid. Contoh: user@domain.com
              </span>
            }
          >
            <Input
              placeholder="contoh@codetrail.com"
              prefix={
                <span style={styles.leftIconWrap}>
                  <MailOutlined />
                </span>
              }
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            label={<Text style={styles.label}>Password</Text>}
            name="password"
            rules={[
              {
                required: true,
                message: "Password wajib diisi",
              },
              {
                min: 6,
                message: "Password minimal 6 karakter",
              },
            ]}
          >
            <Input
              type={showPass ? "text" : "password"}
              placeholder="Buat password aman..."
              prefix={
                <span style={styles.leftIconWrap}>
                  <LockOutlined />
                </span>
              }
              suffix={
                <span
                  onClick={() => setShowPass((state) => !state)}
                  style={{
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.65)",
                  }}
                  title={showPass ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPass ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </span>
              }
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            label={<Text style={styles.label}>Role Pengguna</Text>}
            name="id_role"
            rules={[
              {
                required: true,
                message: "Role wajib dipilih",
              },
            ]}
            extra={
              <span style={styles.subtle}>
                Admin hanya dapat menambahkan akun Dosen atau Mahasiswa.
              </span>
            }
          >
            <Select
              placeholder="Pilih Role"
              options={roleOptions}
              style={{ width: "100%" }}
              suffixIcon={
                <TeamOutlined style={{ color: "rgba(255,255,255,0.55)" }} />
              }
            />
          </Form.Item>
        </Form>
      </div>

      <div style={styles.footer}>
        <Button
          onClick={onClose}
          disabled={loading}
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
          onClick={handleSave}
          style={{ borderRadius: 12 }}
        >
          Simpan User
        </Button>
      </div>
    </Modal>
  );
}