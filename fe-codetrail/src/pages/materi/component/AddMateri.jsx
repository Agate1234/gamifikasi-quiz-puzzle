import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Typography,
  Row,
  Col,
  Button,
  Select,
  Upload,
} from "antd";
import {
  PlusOutlined,
  CloudUploadOutlined,
  ThunderboltFilled,
  EditOutlined,
} from "@ant-design/icons";
import {
  createMateriApi,
  updateMateriApi,
} from "../../../components/api/materi";
import { getModulesApi } from "../../../components/api/modul";
import { NotifAlert, NotifToast } from "../../../components/global/ToastNotif";

const { Text } = Typography;

export default function AddMaterialModal({
  open,
  onClose,
  onSuccess,
  initialValues,
  loading = false,
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [moduleOptions, setModuleOptions] = useState([]);

  const isEdit = Boolean(initialValues?.id_materi);

  useEffect(() => {
    const loadModules = async () => {
      const response = await getModulesApi(
        new URLSearchParams({ page: 1, limit: 100, q: "" }),
      );

      if (response?.status === 200) {
        const options = (response?.data?.data || []).map((item) => ({
          value: item.id,
          label: item.title,
        }));
        setModuleOptions(options);
      }
    };

    if (open) loadModules();
  }, [open]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setFileList([]);

      if (initialValues) {
        form.setFieldsValue({
          judul_materi: initialValues.judul_materi || "",
          id_modul: initialValues.id_modul || undefined,
          exp_materi: initialValues.exp_materi ?? 100,
          deskripsi_materi: initialValues.deskripsi_materi || "",
          link: initialValues.link || "",
        });
      } else {
        form.setFieldsValue({
          judul_materi: "",
          id_modul: undefined,
          exp_materi: 100,
          deskripsi_materi: "",
          link: "",
        });
      }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const formData = new FormData();
      formData.append("judul_materi", values.judul_materi);
      formData.append("id_modul", values.id_modul);
      formData.append("exp_materi", values.exp_materi);
      formData.append("deskripsi_materi", values.deskripsi_materi || "");
      formData.append("link", null);

      if (fileList?.length > 0 && fileList[0]?.originFileObj) {
        formData.append("file_materi", fileList[0].originFileObj);
      }

      const response = isEdit
        ? await updateMateriApi(initialValues.id_materi, formData)
        : await createMateriApi(formData);

      if (response?.status === 200 || response?.status === 201) {
        NotifToast({
          type: "success",
          message:
            response?.data?.message ||
            (isEdit
              ? "Materi berhasil diupdate."
              : "Materi berhasil ditambahkan."),
        });

        onSuccess?.();
      } else {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message:
            response?.data?.message ||
            (isEdit
              ? "Gagal mengupdate materi."
              : "Gagal menambahkan materi."),
        });
      }
    } catch (error) {
      if (!error?.errorFields) {
        NotifAlert({
          icon: "error",
          title: "Gagal",
          message: "Terjadi kesalahan saat menyimpan materi.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(
    () => ({
      content: {
        padding: 0,
        borderRadius: 14,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(20,30,46,0.98) 0%, rgba(23,33,50,0.98) 55%, rgba(18,27,42,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
      },
      headerWrap: {
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      },
      input: {
        borderRadius: 12,
        background: "rgba(10,16,28,0.55)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#E6ECFF",
      },
      textarea: {
        borderRadius: 12,
        background: "rgba(10,16,28,0.55)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#E6ECFF",
        resize: "none",
      },
      label: { color: "rgba(255,255,255,0.85)" },
      footer: {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        background: "transparent",
        borderTop: "none",
      },
      dropzone: {
        borderRadius: 12,
        padding: "18px 14px",
        background: "rgba(10,16,28,0.45)",
        border: "1px dashed rgba(255,255,255,0.14)",
        textAlign: "center",
        color: "rgba(255,255,255,0.8)",
      },
    }),
    [],
  );

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
        content: styles.content,
        header: { display: "none" },
        body: { padding: 0, background: "transparent" },
      }}
    >
      <div style={styles.headerWrap}>
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
            {isEdit ? "Edit Materi" : "Tambah Materi Baru"}
          </Text>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<Text style={styles.label}>Judul Materi</Text>}
            name="judul_materi"
            rules={[{ required: true, message: "Judul materi wajib diisi" }]}
          >
            <Input
              placeholder="Contoh: Pengenalan Python Dasar"
              style={styles.input}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={16}>
              <Form.Item
                label={<Text style={styles.label}>Modul Terkait</Text>}
                name="id_modul"
                rules={[{ required: true, message: "Pilih modul terkait" }]}
              >
                <Select
                  placeholder="Pilih modul terkait..."
                  options={moduleOptions}
                  style={{ width: "100%" }}
                  popupMatchSelectWidth
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={<Text style={styles.label}>XP Materi</Text>}
                name="exp_materi"
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
                  suffix={<ThunderboltFilled style={{ color: "#F7C948" }} />}
                  style={styles.input}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<Text style={styles.label}>Deskripsi Materi</Text>}
            name="deskripsi_materi"
          >
            <Input.TextArea
              rows={4}
              placeholder="Jelaskan isi materi..."
              style={styles.textarea}
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                <Text style={styles.label}>Lampiran File</Text>{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (Opsional)
                </Text>
              </span>
            }
          >
            <Upload.Dragger
              multiple={false}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
              style={styles.dropzone}
              showUploadList
            >
              <div style={{ display: "grid", placeItems: "center", gap: 6 }}>
                <CloudUploadOutlined
                  style={{ fontSize: 20, color: "rgba(255,255,255,0.75)" }}
                />
                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                  Klik untuk unggah atau seret file
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  PDF, PPTX, DOCX, MP4
                </Text>
              </div>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </div>

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

        <Button
          type="primary"
          loading={loading || submitting}
          onClick={handleOk}
          style={{ borderRadius: 12 }}
        >
          {isEdit ? "Update Materi" : "Simpan Materi"}
        </Button>
      </div>
    </Modal>
  );
}