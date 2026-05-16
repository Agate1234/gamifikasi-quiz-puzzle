import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Select, Typography, Row, Col, Button, DatePicker } from "antd";
import { CalendarOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function AddEventModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialValues,
  // options untuk masing-masing tipe
  puzzleOptions = [{ value: "p1", label: "Puzzle: Bubble Sort" }],
  quizOptions = [{ value: "q1", label: "Quiz: Dasar Logika" }],
}) {
  const [form] = Form.useForm();
  const [type, setType] = useState("Puzzle"); // default

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
      label: { color: "rgba(255,255,255,0.85)" },
      subtle: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
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
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    const t = initialValues?.challengeType || "Puzzle";
    setType(t);

    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.setFieldsValue({
        challengeType: "Puzzle",
        itemId: undefined,
        startDate: null,
        endDate: null,
      });
    }
  }, [open, initialValues, form]);

  const optionsByType = useMemo(() => {
    if (type === "Puzzle") return puzzleOptions;
    if (type === "Quiz") return quizOptions;
    return [];
  }, [type, puzzleOptions, quizOptions]);

  const pickLabel =
    type === "Puzzle"
      ? "Pilih Puzzle"
      : "Pilih Kuis";

  const pickHelp =
    type === "Puzzle"
      ? "Pilih puzzle dari bank soal yang akan dikerjakan mahasiswa."
      : "Pilih kuis dari daftar kuis yang akan dikerjakan mahasiswa."

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSubmit?.(values);
    } catch {}
  };

  return (
    <Modal
      open={open}
      footer={null}
      centered
      width={560}
      closable={false}
      maskClosable
      keyboard
      destroyOnClose
      onCancel={onClose}
      styles={{ content: styles.content, body: { padding: 0, background: "transparent" } }}
    >
      {/* Header */}
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
            <CalendarOutlined />
          </div>

          <Text style={{ color: "#E6ECFF", fontWeight: 900 }}>Tambah Event Baru</Text>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose?.();
          }}
          style={styles.closeBtn}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<Text style={styles.label}>Tipe Tantangan</Text>}
            name="challengeType"
            rules={[{ required: true, message: "Tipe tantangan wajib dipilih" }]}
          >
            <Select
              value={type}
              onChange={(v) => {
                setType(v);
                // reset pilihan item ketika tipe berubah
                form.setFieldsValue({ itemId: undefined });
              }}
              options={[
                { value: "Puzzle", label: "Puzzle" },
                { value: "Quiz", label: "Quiz" },
              ]}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label={<Text style={styles.label}>{pickLabel}</Text>}
            name="itemId"
            rules={[{ required: true, message: `${pickLabel} wajib dipilih` }]}
            extra={<span style={styles.subtle}>{pickHelp}</span>}
          >
            <Select
              placeholder={`${pickLabel.toLowerCase()} yang tersedia...`}
              options={optionsByType}
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<Text style={styles.label}>Start Date</Text>}
                name="startDate"
                rules={[{ required: true, message: "Start date wajib diisi" }]}
              >
                <DatePicker
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="mm/dd/yyyy"
                  suffixIcon={<PlusOutlined style={{ color: "rgba(255,255,255,0.55)" }} />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<Text style={styles.label}>End Date</Text>}
                name="endDate"
                rules={[{ required: true, message: "End date wajib diisi" }]}
              >
                <DatePicker
                  style={{ ...styles.input, width: "100%" }}
                  placeholder="mm/dd/yyyy"
                  suffixIcon={<PlusOutlined style={{ color: "rgba(255,255,255,0.55)" }} />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
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

        <Button type="primary" loading={loading} onClick={handleSave} style={{ borderRadius: 12 }}>
          Simpan Event
        </Button>
      </div>
    </Modal>
  );
}
